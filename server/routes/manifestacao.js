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
    // Importar o utilitário de upload
    const { uploadFileToMinio } = require('../utils/minioUpload');
    
    console.log('Corpo da requisição recebida:', req.body);
    console.log('Arquivos recebidos:', req.files ? Object.keys(req.files) : 'Nenhum');
    
    // Upload da imagem usando o utilitário
    const uploadResult = await uploadFileToMinio(
      req.files.imagem, 
      'manifestacoes',
      req.user.id
    );
    
    console.log('Upload concluído com sucesso:', uploadResult);
    
    // Adicionar informações da imagem ao documento
    const novaImagem = {
      path: uploadResult.url,
      objectName: uploadResult.objectName,
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
    // Importar os utilitários de upload e remoção
    const { uploadFileToMinio, removeFileFromMinio } = require('../utils/minioUpload');
    
    console.log('Corpo da requisição recebida para símbolo:', req.body);
    console.log('Arquivos recebidos para símbolo:', req.files ? Object.keys(req.files) : 'Nenhum');
    
    // Se já existe um símbolo, remover do MinIO
    if (manifestacao.symbolObjectName) {
      try {
        await removeFileFromMinio(manifestacao.symbolObjectName);
        console.log(`Símbolo antigo ${manifestacao.symbolObjectName} removido com sucesso`);
      } catch (error) {
        console.error('Erro ao remover símbolo antigo:', error);
        // Continuar mesmo com erro
      }
    }
    
    // Upload do símbolo usando o utilitário
    const uploadResult = await uploadFileToMinio(
      req.files.simbolo, 
      'manifestacao/simbolo',
      req.user.id
    );
    
    console.log('Upload de símbolo concluído com sucesso:', uploadResult);
    
    // Log para debug
    console.log(`URL do símbolo gerada via proxy: ${uploadResult.url}`);
    console.log(`Nome do objeto no MinIO: ${uploadResult.objectName}`);
    
    // Atualizar caminho do símbolo (armazenar a URL completa)
    manifestacao.simboloPath = uploadResult.url;
    manifestacao.symbolObjectName = uploadResult.objectName; // Guardar o nome do objeto para remoção futura
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
