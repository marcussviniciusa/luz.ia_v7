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
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { minioClient } = require('../config/minio');
const Manifestacao = require('../models/Manifestacao');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Configuração do multer para upload temporário
const upload = multer({
  dest: 'tmp/uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Proteger todas as rotas
router.use(protect);

// Rotas principais
router.route('/')
  .get(getManifestacoes)
  .post(upload.single('imagem'), createManifestacao);

// Nota: As rotas específicas para tipos de manifestação foram removidas
// pois agora estamos fazendo a filtragem por tipo no lado cliente

router.route('/:id')
  .get(getManifestacao)
  .put(upload.single('imagem'), updateManifestacao)
  .delete(deleteManifestacao);

// Upload de imagem para o quadro de visualização
router.post('/:id/imagem', upload.single('imagem'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Por favor, envie uma imagem', 400));
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
  
  // Verificar se é um quadro de visualização
  if (manifestacao.tipo !== 'quadro') {
    return next(
      new ErrorResponse('Este item não é um quadro de visualização', 400)
    );
  }
  
  try {
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `manifestacao/quadro/${req.user.id}/${uuidv4()}${fileExtension}`;
    
    // Upload do arquivo para o MinIO
    await minioClient.fPutObject(
      process.env.MINIO_BUCKET_NAME,
      fileName,
      req.file.path,
      { 'Content-Type': req.file.mimetype }
    );
    
    // Gerar URL via proxy interno para a imagem
    // Isso evita problemas de CORS e de resolução de DNS
    const imageUrl = `/api/proxy/minio/${fileName}`;
    
    // Log para debug
    console.log(`URL da imagem gerada via proxy (upload): ${imageUrl}`);
    console.log(`Nome do objeto no MinIO: ${fileName}`);
    
    // Adicionar imagem ao quadro
    manifestacao.imagens.push({
      path: imageUrl,
      objectName: fileName,
      descricao: req.body.descricao || ''
    });
    
    manifestacao.updatedAt = Date.now();
    
    await manifestacao.save();
    
    // Remover arquivo temporário
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Erro ao remover arquivo temporário:', err);
    });
    
    res.status(200).json({
      success: true,
      data: manifestacao
    });
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    return next(new ErrorResponse('Erro ao fazer upload de imagem', 500));
  }
}));

// Upload de símbolo pessoal
router.post('/:id/simbolo', upload.single('simbolo'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
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
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `manifestacao/simbolo/${req.user.id}/${uuidv4()}${fileExtension}`;
    
    // Se já existe um símbolo, remover do MinIO
    if (manifestacao.simboloPath) {
      try {
        await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, manifestacao.simboloPath);
      } catch (error) {
        console.error('Erro ao remover símbolo antigo:', error);
        // Continuar mesmo com erro
      }
    }
    
    // Upload do arquivo para o MinIO
    await minioClient.fPutObject(
      process.env.MINIO_BUCKET_NAME,
      fileName,
      req.file.path,
      { 'Content-Type': req.file.mimetype }
    );
    
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
    
    // Remover arquivo temporário
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Erro ao remover arquivo temporário:', err);
    });
    
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
