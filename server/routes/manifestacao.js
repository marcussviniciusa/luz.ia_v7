const express = require('express');
const {
  createManifestacao,
  getManifestacoes,
  getManifestacao,
  updateManifestacao,
  deleteManifestacao,
  addImage,
  removeImage,
  addAfirmacao,
  removeAfirmacao,
  addPasso,
  updatePasso,
  removePasso
} = require('../controllers/manifestacao');
const router = express.Router();
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { minioClient } = require('../config/minio');
const Manifestacao = require('../models/Manifestacao');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Nota: Removido multer pois estamos usando express-fileupload configurado globalmente
// com limitação de 50MB já configurada

// Proteger todas as rotas
router.use(protect);

// Rotas principais
router.route('/')
  .get(getManifestacoes)
  .post(createManifestacao);

// Nota: As rotas específicas para tipos de manifestação foram removidas
// pois agora estamos fazendo a filtragem por tipo no lado cliente

router.route('/:id')
  .get(getManifestacao)
  .put(updateManifestacao)
  .delete(deleteManifestacao);

// Upload de imagem para o quadro de visualização
router.post('/:id/imagem', asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.imagem) {
    return next(new ErrorResponse('Por favor, envie uma imagem', 400));
  }
  
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar permissão
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Usuário não autorizado a editar este item`, 403)
    );
  }
  
  try {
    const imagemFile = req.files.imagem;
    const bucketName = process.env.MINIO_BUCKET_NAME;
    
    // Verificar se o bucket existe
    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log(`Bucket ${bucketName} existe? ${bucketExists}`);
    
    if (!bucketExists) {
      console.log(`Criando bucket ${bucketName}...`);
      await minioClient.makeBucket(bucketName);
    }
    
    // Obter a extensão do arquivo original
    const fileExt = path.extname(imagemFile.name) || '.jpg';
    const objectName = `manifestacoes/${req.user.id}/${Date.now()}-${uuidv4()}${fileExt}`;
    
    // Definir metadados para o arquivo
    const metaData = {
      'Content-Type': imagemFile.mimetype,
      'X-Amz-Meta-Original-Filename': imagemFile.name
    };
    
    console.log(`Iniciando upload de imagem para MinIO bucket=${bucketName}, file=${objectName}`);
    
    if (imagemFile.tempFilePath) {
      console.log('Usando arquivo temporário para upload de imagem:', imagemFile.tempFilePath);
      
      // Upload do arquivo para o MinIO usando o arquivo temporário
      await minioClient.fPutObject(
        bucketName, 
        objectName, 
        imagemFile.tempFilePath,
        metaData
      );
    } else if (imagemFile.data) {
      console.log('Usando dados em memória para upload de imagem');
      
      // Salvar temporariamente os dados em um arquivo
      const tempPath = `/tmp/upload-manifestacao-${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, imagemFile.data);
      
      // Upload do arquivo temporário
      await minioClient.fPutObject(
        bucketName, 
        objectName, 
        tempPath,
        metaData
      );
      
      // Remover o arquivo temporário
      fs.unlinkSync(tempPath);
    }
    
    console.log('Arquivo de imagem salvo com sucesso');
    
    // Gerar URL via proxy interno para a imagem
    const imageUrl = `/api/proxy/minio/${objectName}`;
    
    // Adicionar informações da imagem ao documento
    const novaImagem = {
      path: imageUrl,
      objectName: objectName,
      descricao: req.body.descricao || ''
    };
    
    // Verificar se já existem imagens
    if (!manifestacao.imagens) {
      manifestacao.imagens = [];
    }
    
    manifestacao.imagens.push(novaImagem);
    await manifestacao.save();
    
    res.status(200).json({
      success: true,
      data: novaImagem
    });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    next(new ErrorResponse(`Erro ao fazer upload da imagem: ${error.message}`, 500));
  }
}));

// Upload de símbolo pessoal
router.post('/:id/simbolo', asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.simbolo) {
    return next(new ErrorResponse('Por favor, envie uma imagem para o símbolo', 400));
  }
  
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a modificar este item', 401)
    );
  }
  
  // Verificar se é um símbolo pessoal
  if (manifestacao.tipo !== 'simbolo') {
    return next(
      new ErrorResponse('Este item não é um símbolo pessoal', 400)
    );
  }
  
  try {
    const simboloFile = req.files.simbolo;
    const bucketName = process.env.MINIO_BUCKET_NAME;
    
    // Obter a extensão do arquivo original
    const fileExt = path.extname(simboloFile.name) || '.jpg';
    const fileName = `manifestacao/simbolo/${req.user.id}/${Date.now()}-${uuidv4()}${fileExt}`;
    
    // Verificar se o bucket existe
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      console.log(`Criando bucket ${bucketName}...`);
      await minioClient.makeBucket(bucketName);
    }
    
    // Se já existe um símbolo, remover do MinIO
    if (manifestacao.symbolObjectName) {
      try {
        await minioClient.removeObject(bucketName, manifestacao.symbolObjectName);
        console.log('Símbolo antigo removido com sucesso');
      } catch (error) {
        console.error('Erro ao remover símbolo antigo:', error);
        // Continuar mesmo com erro
      }
    }
    
    // Definir metadados para o arquivo
    const metaData = {
      'Content-Type': simboloFile.mimetype,
      'X-Amz-Meta-Original-Filename': simboloFile.name
    };
    
    console.log(`Iniciando upload de símbolo para MinIO bucket=${bucketName}, file=${fileName}`);
    
    if (simboloFile.tempFilePath) {
      console.log('Usando arquivo temporário para upload de símbolo:', simboloFile.tempFilePath);
      
      // Upload do arquivo para o MinIO usando o arquivo temporário
      await minioClient.fPutObject(
        bucketName, 
        fileName, 
        simboloFile.tempFilePath,
        metaData
      );
    } else if (simboloFile.data) {
      console.log('Usando dados em memória para upload de símbolo');
      
      // Salvar temporariamente os dados em um arquivo
      const tempPath = `/tmp/upload-simbolo-${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, simboloFile.data);
      
      // Upload do arquivo temporário
      await minioClient.fPutObject(
        bucketName, 
        fileName, 
        tempPath,
        metaData
      );
      
      // Remover o arquivo temporário
      fs.unlinkSync(tempPath);
    }
    
    // Gerar URL via proxy interno para a imagem
    // Isso evita problemas de CORS e de resolução de DNS
    const symbolUrl = `/api/proxy/minio/${fileName}`;
    
    // Log para debug
    console.log(`URL do símbolo gerada via proxy: ${symbolUrl}`);
    console.log(`Nome do objeto no MinIO: ${fileName}`);
    
    // Atualizar caminho do símbolo (armazenar a URL completa)
    manifestacao.simboloPath = symbolUrl;
    manifestacao.symbolObjectName = fileName; // Guardar o nome do objeto para remoção futura
    manifestacao.updatedAt = Date.now();
    
    await manifestacao.save();
    
    res.status(200).json({
      success: true,
      data: manifestacao
    });
  } catch (error) {
    console.error('Erro ao fazer upload de símbolo:', error);
    return next(new ErrorResponse('Erro ao fazer upload de símbolo', 500));
  }
}));

// Rotas para afirmações do quadro de visualização
router.route('/:id/afirmacao')
  .post(addAfirmacao);

router.route('/:id/afirmacao/:afirmacaoId')
  .delete(removeAfirmacao);

// Rotas para passos do checklist
router.route('/:id/passo')
  .post(addPasso);

router.route('/:id/passo/:passoId')
  .put(updatePasso)
  .delete(removePasso);

// Rota para remover imagem
router.route('/:id/imagem/:imagemId')
  .delete(removeImage);

module.exports = router;
