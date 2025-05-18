const Content = require('../models/Content');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { uploadToMinIO, deleteFromMinIO } = require('../utils/minio');

// @desc    Obter todos os conteúdos
// @route   GET /api/contents
// @access  Public
exports.getContents = asyncHandler(async (req, res, next) => {
  // Filtros adicionais para usuários comuns
  if (!req.user || req.user.role !== 'admin') {
    req.query.status = 'published'; // Apenas conteúdo publicado para usuários normais
  }
  
  res.status(200).json(res.advancedResults);
});

// @desc    Obter conteúdo por ID
// @route   GET /api/contents/:id
// @access  Public
exports.getContent = asyncHandler(async (req, res, next) => {
  const content = await Content.findById(req.params.id).populate('user', 'nome email');

  if (!content) {
    return next(new ErrorResponse(`Conteúdo não encontrado com id ${req.params.id}`, 404));
  }

  // Se não for admin e o conteúdo não estiver publicado, negar acesso
  if ((!req.user || req.user.role !== 'admin') && content.status !== 'published') {
    return next(new ErrorResponse('Acesso não autorizado a este conteúdo', 403));
  }

  res.status(200).json({
    success: true,
    data: content
  });
});

// @desc    Criar novo conteúdo
// @route   POST /api/contents
// @access  Private/Admin
exports.createContent = asyncHandler(async (req, res, next) => {
  // Adicionar user ID ao req.body
  req.body.user = req.user.id;
  
  // Se a imagem for base64, fazer upload para MinIO
  if (req.body.imageBase64) {
    try {
      const base64Data = req.body.imageBase64.split(';base64,').pop();
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const filename = `content_${Date.now()}${path.extname(req.body.imageName || '.jpg')}`;
      
      // Upload da imagem para o MinIO
      const uploadResult = await uploadToMinIO('contents', filename, imageBuffer);
      
      if (uploadResult.success) {
        // Garantir que a URL siga o formato esperado pela rota de proxy
        req.body.imageUrl = `/api/proxy/minio/contents/${filename}`;
      } else {
        return next(new ErrorResponse('Erro no upload da imagem', 500));
      }
      
      // Remover os campos base64 do objeto a ser salvo
      delete req.body.imageBase64;
      delete req.body.imageName;
    } catch (error) {
      return next(new ErrorResponse('Erro no processamento da imagem', 500));
    }
  }

  const content = await Content.create(req.body);

  res.status(201).json({
    success: true,
    data: content
  });
});

// @desc    Atualizar conteúdo
// @route   PUT /api/contents/:id
// @access  Private/Admin
exports.updateContent = asyncHandler(async (req, res, next) => {
  let content = await Content.findById(req.params.id);

  if (!content) {
    return next(new ErrorResponse(`Conteúdo não encontrado com id ${req.params.id}`, 404));
  }

  // Se a imagem for base64, fazer upload para MinIO
  if (req.body.imageBase64) {
    try {
      const base64Data = req.body.imageBase64.split(';base64,').pop();
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const filename = `content_${Date.now()}${path.extname(req.body.imageName || '.jpg')}`;
      
      // Upload da nova imagem para o MinIO
      const uploadResult = await uploadToMinIO('contents', filename, imageBuffer);
      
      if (uploadResult.success) {
        // Se havia uma imagem anterior, excluí-la
        if (content.imageUrl) {
          try {
            const oldImageKey = content.imageUrl.split('/').pop();
            await deleteFromMinIO('contents', oldImageKey);
          } catch (error) {
            console.error('Erro ao excluir imagem antiga:', error);
          }
        }
        
        // Garantir que a URL siga o formato esperado pela rota de proxy
        req.body.imageUrl = `/api/proxy/minio/contents/${filename}`;
      } else {
        return next(new ErrorResponse('Erro no upload da imagem', 500));
      }
      
      // Remover os campos base64 do objeto a ser salvo
      delete req.body.imageBase64;
      delete req.body.imageName;
    } catch (error) {
      return next(new ErrorResponse('Erro no processamento da imagem', 500));
    }
  }

  // Garantir que o campo updatedAt seja atualizado
  req.body.updatedAt = Date.now();

  content = await Content.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: content
  });
});

// @desc    Excluir conteúdo
// @route   DELETE /api/contents/:id
// @access  Private/Admin
exports.deleteContent = asyncHandler(async (req, res, next) => {
  const content = await Content.findById(req.params.id);

  if (!content) {
    return next(new ErrorResponse(`Conteúdo não encontrado com id ${req.params.id}`, 404));
  }

  // Excluir a imagem do MinIO se existir
  if (content.imageUrl) {
    try {
      const imageKey = content.imageUrl.split('/').pop();
      await deleteFromMinIO('contents', imageKey);
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
    }
  }

  await content.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter conteúdo em destaque
// @route   GET /api/contents/featured
// @access  Public
exports.getFeaturedContents = asyncHandler(async (req, res, next) => {
  const category = req.query.category;
  const type = req.query.type;
  
  const query = { 
    featured: true, 
    status: 'published' 
  };
  
  // Adicionar filtros opcionais
  if (category) {
    query.category = category;
  }
  
  if (type) {
    query.type = type;
  }
  
  const contents = await Content.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(req.query.limit) || 5)
    .populate('user', 'nome');

  res.status(200).json({
    success: true,
    count: contents.length,
    data: contents
  });
});

// @desc    Buscar conteúdo
// @route   GET /api/contents/search
// @access  Public
exports.searchContents = asyncHandler(async (req, res, next) => {
  const query = req.query.q;
  
  if (!query) {
    return next(new ErrorResponse('Termo de busca não fornecido', 400));
  }
  
  const filter = {
    $text: { $search: query },
    status: 'published' // Apenas conteúdo publicado para usuários normais
  };
  
  // Adicionar filtros opcionais
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  if (req.query.type) {
    filter.type = req.query.type;
  }
  
  const contents = await Content.find(filter)
    .sort({ score: { $meta: 'textScore' } })
    .limit(parseInt(req.query.limit) || 10)
    .populate('user', 'nome');

  res.status(200).json({
    success: true,
    count: contents.length,
    data: contents
  });
});
