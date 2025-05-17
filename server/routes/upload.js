const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { minioClient } = require('../config/minio');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Configuração do multer para upload temporário
const upload = multer({
  dest: 'tmp/uploads/',
  limits: { fileSize: 25 * 1024 * 1024 } // Limite de 25MB
});

// Proteger todas as rotas
router.use(protect);

// @desc    Upload de arquivo genérico
// @route   POST /api/upload/:folder
// @access  Private
router.post('/:folder', upload.single('file'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Por favor, envie um arquivo', 400));
  }
  
  const folder = req.params.folder;
  
  // Validar pasta
  const validFolders = ['transcricoes', 'materiais', 'documentos', 'outros'];
  if (!validFolders.includes(folder) && req.user.role !== 'admin') {
    return next(new ErrorResponse('Pasta de upload inválida', 400));
  }
  
  try {
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${folder}/${req.user.id}/${uuidv4()}${fileExtension}`;
    
    // Determinar o tipo de conteúdo
    let contentType = 'application/octet-stream'; // Padrão
    
    // Detectar tipo com base na extensão
    if (fileExtension.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      contentType = `image/${fileExtension.substring(1).replace('jpg', 'jpeg')}`;
    } else if (fileExtension.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      contentType = `audio/${fileExtension.substring(1)}`;
    } else if (fileExtension.match(/\.(mp4|webm|mov)$/i)) {
      contentType = `video/${fileExtension.substring(1)}`;
    } else if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    } else if (fileExtension.match(/\.(doc|docx)$/i)) {
      contentType = 'application/msword';
    } else if (fileExtension.match(/\.(xls|xlsx)$/i)) {
      contentType = 'application/vnd.ms-excel';
    } else if (fileExtension === '.txt') {
      contentType = 'text/plain';
    }
    
    // Upload do arquivo para o MinIO
    await minioClient.fPutObject(
      process.env.MINIO_BUCKET_NAME,
      fileName,
      req.file.path,
      { 'Content-Type': contentType }
    );
    
    // Remover arquivo temporário
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Erro ao remover arquivo temporário:', err);
    });
    
    res.status(200).json({
      success: true,
      data: {
        fileName,
        originalName: req.file.originalname,
        mimetype: contentType,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo:', error);
    return next(new ErrorResponse('Erro ao fazer upload de arquivo', 500));
  }
}));

// @desc    Upload de transcrição do curso (para alimentar a LUZ IA)
// @route   POST /api/upload/transcricao
// @access  Private/Admin
router.post('/transcricao', authorize('admin'), upload.single('file'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Por favor, envie um arquivo de texto', 400));
  }
  
  // Verificar se é um arquivo de texto
  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  if (!fileExtension.match(/\.(txt|md)$/i)) {
    return next(new ErrorResponse('Formato de arquivo inválido. Use arquivos de texto (TXT ou MD).', 400));
  }
  
  try {
    const fileName = `transcricoes/${uuidv4()}${fileExtension}`;
    
    // Primeiro salvar no sistema de arquivos local para o treinamento da IA
    const targetPath = path.join(__dirname, '../../ai-training/transcricoes', path.basename(fileName));
    
    // Copiar o arquivo para a pasta de treinamento
    fs.copyFileSync(req.file.path, targetPath);
    
    // Upload do arquivo para o MinIO também como backup
    await minioClient.fPutObject(
      process.env.MINIO_BUCKET_NAME,
      fileName,
      req.file.path,
      { 'Content-Type': fileExtension === '.md' ? 'text/markdown' : 'text/plain' }
    );
    
    // Remover arquivo temporário
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Erro ao remover arquivo temporário:', err);
    });
    
    res.status(200).json({
      success: true,
      data: {
        fileName,
        localPath: targetPath,
        originalName: req.file.originalname,
        size: req.file.size
      },
      message: 'Transcrição carregada com sucesso. Atualize a base de conhecimento da LUZ IA para aplicar as mudanças.'
    });
  } catch (error) {
    console.error('Erro ao fazer upload de transcrição:', error);
    return next(new ErrorResponse('Erro ao fazer upload de transcrição', 500));
  }
}));

// @desc    Obter URL pré-assinada para download de arquivo
// @route   GET /api/upload/url/:fileName
// @access  Private
router.get('/url/:fileName', asyncHandler(async (req, res, next) => {
  try {
    const fileName = req.params.fileName;
    
    // Verificar se o arquivo existe
    try {
      await minioClient.statObject(process.env.MINIO_BUCKET_NAME, fileName);
    } catch (error) {
      return next(new ErrorResponse('Arquivo não encontrado', 404));
    }
    
    // Gerar URL pré-assinada (válida por 24 horas)
    const url = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET_NAME,
      fileName,
      24 * 60 * 60 // 24 horas em segundos
    );
    
    res.status(200).json({
      success: true,
      url
    });
  } catch (error) {
    console.error('Erro ao gerar URL para arquivo:', error);
    return next(new ErrorResponse('Erro ao gerar URL para arquivo', 500));
  }
}));

// @desc    Excluir arquivo
// @route   DELETE /api/upload/:fileName
// @access  Private
router.delete('/:fileName', asyncHandler(async (req, res, next) => {
  try {
    const fileName = req.params.fileName;
    
    // Verificar se o arquivo existe
    try {
      await minioClient.statObject(process.env.MINIO_BUCKET_NAME, fileName);
    } catch (error) {
      return next(new ErrorResponse('Arquivo não encontrado', 404));
    }
    
    // Verificar se o arquivo pertence ao usuário
    // A verificação é feita checando se o ID do usuário está no caminho do arquivo
    if (!fileName.includes(`/${req.user.id}/`) && req.user.role !== 'admin') {
      return next(new ErrorResponse('Não autorizado a excluir este arquivo', 401));
    }
    
    // Excluir o arquivo
    await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, fileName);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    return next(new ErrorResponse('Erro ao excluir arquivo', 500));
  }
}));

module.exports = router;
