const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const { minioClient } = require('../config/minio');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload temporário
const upload = multer({ 
  dest: 'tmp/uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});

// @desc    Atualizar foto de perfil
// @route   PUT /api/perfil/foto
// @access  Private
router.put('/foto', protect, upload.single('photo'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Por favor, envie uma imagem', 400));
  }

  try {
    const userId = req.user.id;
    const fileExtension = req.file.mimetype.split('/')[1];
    const fileName = `perfil/${userId}/${uuidv4()}.${fileExtension}`;
    
    // Upload do arquivo para o MinIO
    await minioClient.fPutObject(
      process.env.MINIO_BUCKET_NAME,
      fileName,
      req.file.path,
      { 'Content-Type': req.file.mimetype }
    );
    
    // Atualizar o perfil do usuário com a nova foto
    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: fileName },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        profileImage: fileName
      }
    });
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    return next(new ErrorResponse('Erro ao fazer upload de imagem', 500));
  }
}));

// @desc    Servir imagem de perfil padrão
// @route   GET /api/perfil/foto/default-profile.jpg
// @access  Public
router.get('/foto/default-profile.jpg', asyncHandler(async (req, res, next) => {
  // Em vez de tentar encontrar um arquivo, retornar uma resposta JSON
  // Isso é uma solução temporária para evitar o erro 404
  res.status(200).json({
    success: true,
    message: 'Imagem de perfil padrão não disponível no momento'
  });
}));

// @desc    Obter URL pré-assinada para a foto de perfil
// @route   GET /api/perfil/foto/:nome
// @access  Private
router.get('/foto/:nome', protect, asyncHandler(async (req, res, next) => {
  try {
    const url = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET_NAME,
      req.params.nome,
      24 * 60 * 60 // URL válida por 24 horas
    );
    
    res.status(200).json({
      success: true,
      url
    });
  } catch (error) {
    console.error('Erro ao gerar URL para imagem:', error);
    return next(new ErrorResponse('Erro ao gerar URL para imagem', 500));
  }
}));

// @desc    Atualizar perfil do usuário
// @route   PUT /api/perfil
// @access  Private
router.put('/', protect, asyncHandler(async (req, res, next) => {
  const { name, bio } = req.body;
  
  // Apenas permitir atualização de campos específicos
  const fieldsToUpdate = {
    name,
    bio
  };
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: user
  });
}));

module.exports = router;
