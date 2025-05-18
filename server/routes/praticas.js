const express = require('express');
const {
  getPraticas,
  getPratica,
  createPratica,
  updatePratica,
  deletePratica,
  togglePratica,
  uploadAudio,
  uploadImagem,
  uploadPraticaFiles,
  getAudioUrl,
  concluirPratica,
  getHistorico,
  getStats
} = require('../controllers/praticas');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { minioClient } = require('../config/minio');
const Pratica = require('../models/Pratica');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Configuração do multer para uploads temporários
const upload = multer({
  dest: 'tmp/uploads/',
  limits: { fileSize: 25 * 1024 * 1024 } // Limite de 25MB para arquivos de áudio
});

// Proteger todas as rotas
router.use(protect);

// Rotas principais
router.route('/')
  .get(getPraticas)
  .post(authorize('admin'), createPratica);

// Rota para estatísticas
router.get('/stats', getStats);

// Rota para histórico de práticas
router.get('/historico', getHistorico);

// Rotas para gerenciar práticas específicas
router.route('/:id')
  .get(getPratica)
  .put(authorize('admin'), updatePratica)
  .delete(authorize('admin'), deletePratica);

// Rota para ativar/desativar prática
router.put('/:id/toggle', authorize('admin'), togglePratica);

// Rota para upload de arquivos (áudio e imagem)
router.put('/:id/uploads', authorize('admin'), uploadPraticaFiles);

// Rota para obter URL de streaming
router.get('/:id/audio-url', getAudioUrl);

// Rota para registrar conclusão de prática
router.post('/:id/concluir', concluirPratica);

// Upload de áudio
router.put('/:id/audio', authorize('admin'), upload.single('audio'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Por favor, envie um arquivo de áudio', 400));
  }
  
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  try {
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Verificar se é um formato de áudio válido
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    if (!validExtensions.includes(fileExtension)) {
      return next(
        new ErrorResponse('Formato de arquivo inválido. Use MP3, WAV, OGG ou M4A.', 400)
      );
    }
    
    const fileName = `praticas/audio/${uuidv4()}${fileExtension}`;
    
    // Se já existe um áudio, remover do MinIO
    if (pratica.audioPath) {
      try {
        await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, pratica.audioPath);
      } catch (error) {
        console.error('Erro ao remover áudio antigo:', error);
        // Continuar mesmo com erro
      }
    }
    
    // Upload do arquivo para o MinIO
    await minioClient.fPutObject(
      process.env.MINIO_BUCKET_NAME,
      fileName,
      req.file.path,
      { 'Content-Type': `audio/${fileExtension.substring(1)}` }
    );
    
    // Atualizar caminho do áudio
    pratica.audioPath = fileName;
    await pratica.save();
    
    // Remover arquivo temporário
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Erro ao remover arquivo temporário:', err);
    });
    
    res.status(200).json({
      success: true,
      data: pratica
    });
  } catch (error) {
    console.error('Erro ao fazer upload de áudio:', error);
    return next(new ErrorResponse('Erro ao fazer upload de áudio', 500));
  }
}));

// Upload de imagem de capa
router.put('/:id/imagem', authorize('admin'), upload.single('imagem'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Por favor, envie uma imagem', 400));
  }
  
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  try {
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Verificar se é um formato de imagem válido
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!validExtensions.includes(fileExtension)) {
      return next(
        new ErrorResponse('Formato de arquivo inválido. Use JPG, PNG ou WEBP.', 400)
      );
    }
    
    const fileName = `praticas/imagem/${uuidv4()}${fileExtension}`;
    
    // Se já existe uma imagem, remover do MinIO (exceto a imagem padrão)
    if (pratica.imagemCapa && pratica.imagemCapa !== 'praticas/default-cover.jpg') {
      try {
        await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, pratica.imagemCapa);
      } catch (error) {
        console.error('Erro ao remover imagem antiga:', error);
        // Continuar mesmo com erro
      }
    }
    
    // Upload do arquivo para o MinIO
    await minioClient.fPutObject(
      process.env.MINIO_BUCKET_NAME,
      fileName,
      req.file.path,
      { 'Content-Type': `image/${fileExtension.substring(1).replace('jpg', 'jpeg')}` }
    );
    
    // Atualizar caminho da imagem
    pratica.imagemCapa = fileName;
    await pratica.save();
    
    // Remover arquivo temporário
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Erro ao remover arquivo temporário:', err);
    });
    
    res.status(200).json({
      success: true,
      data: pratica
    });
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    return next(new ErrorResponse('Erro ao fazer upload de imagem', 500));
  }
}));

module.exports = router;
