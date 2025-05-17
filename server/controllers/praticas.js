const Pratica = require('../models/Pratica');
const RegistroPratica = require('../models/RegistroPratica');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { minioClient } = require('../config/minio');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// @desc    Obter todas as práticas
// @route   GET /api/praticas
// @access  Private
exports.getPraticas = asyncHandler(async (req, res, next) => {
  // Opções de filtro
  const { categoria, destaque } = req.query;
  const filter = {};
  
  // Filtrar por categoria, se fornecido
  if (categoria) {
    filter.categoria = categoria;
  }
  
  // Filtrar práticas em destaque, se solicitado
  if (destaque === 'true') {
    filter.destaque = true;
  }
  
  // Filtrar apenas práticas ativas por padrão
  filter.ativa = true;
  
  // Se for admin e quiser ver todas (incluindo inativas)
  if (req.user.role === 'admin' && req.query.all === 'true') {
    delete filter.ativa;
  }
  
  // Buscar práticas
  const praticas = await Pratica.find(filter).sort({ ordem: 1, createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: praticas.length,
    data: praticas
  });
});

// @desc    Obter uma prática específica
// @route   GET /api/praticas/:id
// @access  Private
exports.getPratica = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Se não for admin e a prática não estiver ativa, negar acesso
  if (req.user.role !== 'admin' && !pratica.ativa) {
    return next(
      new ErrorResponse('Esta prática não está disponível no momento', 403)
    );
  }
  
  res.status(200).json({
    success: true,
    data: pratica
  });
});

// @desc    Criar nova prática (apenas admin)
// @route   POST /api/praticas
// @access  Private/Admin
exports.createPratica = asyncHandler(async (req, res, next) => {
  // Validar se tem todos os campos necessários
  if (!req.body.titulo || !req.body.descricao || !req.body.categoria || !req.body.duracao) {
    return next(
      new ErrorResponse('Por favor, preencha todos os campos obrigatórios', 400)
    );
  }
  
  // O audioPath será adicionado posteriormente no upload do áudio
  
  // Criar prática
  const pratica = await Pratica.create(req.body);
  
  res.status(201).json({
    success: true,
    data: pratica
  });
});

// @desc    Atualizar prática (apenas admin)
// @route   PUT /api/praticas/:id
// @access  Private/Admin
exports.updatePratica = asyncHandler(async (req, res, next) => {
  let pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Atualizar prática
  pratica = await Pratica.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: pratica
  });
});

// @desc    Excluir prática (apenas admin)
// @route   DELETE /api/praticas/:id
// @access  Private/Admin
exports.deletePratica = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Remover áudio e imagem do MinIO
  try {
    if (pratica.audioPath) {
      await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, pratica.audioPath);
    }
    
    if (pratica.imagemCapa && pratica.imagemCapa !== 'praticas/default-cover.jpg') {
      await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, pratica.imagemCapa);
    }
  } catch (error) {
    console.error('Erro ao remover arquivos do MinIO:', error);
    // Continuar mesmo com erro para remover o registro do banco
  }
  
  // Excluir prática
  await pratica.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Ativar/desativar prática (apenas admin)
// @route   PUT /api/praticas/:id/toggle
// @access  Private/Admin
exports.togglePratica = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Inverter status ativo
  pratica.ativa = !pratica.ativa;
  await pratica.save();
  
  res.status(200).json({
    success: true,
    data: pratica
  });
});

// @desc    Upload de áudio para prática (apenas admin)
// @route   PUT /api/praticas/:id/audio
// @access  Private/Admin
exports.uploadAudio = asyncHandler(async (req, res, next) => {
  // Esta função será implementada pelo middleware multer no arquivo de rotas
  // Ver rota correspondente em routes/praticas.js
});

// @desc    Upload de imagem de capa para prática (apenas admin)
// @route   PUT /api/praticas/:id/imagem
// @access  Private/Admin
exports.uploadImagem = asyncHandler(async (req, res, next) => {
  // Esta função será implementada pelo middleware multer no arquivo de rotas
  // Ver rota correspondente em routes/praticas.js
});

// @desc    Obter URL pré-assinada para streaming de áudio
// @route   GET /api/praticas/:id/audio-url
// @access  Private
exports.getAudioUrl = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Se não for admin e a prática não estiver ativa, negar acesso
  if (req.user.role !== 'admin' && !pratica.ativa) {
    return next(
      new ErrorResponse('Esta prática não está disponível no momento', 403)
    );
  }
  
  try {
    // Gerar URL pré-assinada para o áudio (válida por 2 horas)
    const url = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET_NAME,
      pratica.audioPath,
      2 * 60 * 60 // 2 horas em segundos
    );
    
    // Registrar o início da prática
    await RegistroPratica.create({
      user: req.user.id,
      pratica: pratica._id,
      tipoEvento: 'inicio'
    });
    
    res.status(200).json({
      success: true,
      url
    });
  } catch (error) {
    console.error('Erro ao gerar URL para áudio:', error);
    return next(
      new ErrorResponse('Erro ao gerar URL para áudio', 500)
    );
  }
});

// @desc    Registrar conclusão de prática
// @route   POST /api/praticas/:id/concluir
// @access  Private
exports.concluirPratica = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Registrar conclusão da prática
  await RegistroPratica.create({
    user: req.user.id,
    pratica: pratica._id,
    tipoEvento: 'conclusao',
    duracao: req.body.duracao || pratica.duracao // Tempo efetivo de prática
  });
  
  res.status(200).json({
    success: true,
    message: 'Prática concluída com sucesso'
  });
});

// @desc    Obter histórico de práticas do usuário
// @route   GET /api/praticas/historico
// @access  Private
exports.getHistorico = asyncHandler(async (req, res, next) => {
  // Obter parâmetros de filtro
  const { limit = 30, page = 1 } = req.query;
  
  // Calcular skip para paginação
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Agregação para obter histórico de práticas concluídas
  const historico = await RegistroPratica.aggregate([
    // Filtrar apenas registros do usuário atual e apenas conclusões
    { 
      $match: { 
        user: mongoose.Types.ObjectId(req.user.id),
        tipoEvento: 'conclusao'
      } 
    },
    // Ordenar por data (mais recente primeiro)
    { $sort: { createdAt: -1 } },
    // Aplicar paginação
    { $skip: skip },
    { $limit: parseInt(limit) },
    // Juntar com a coleção de práticas para obter detalhes
    {
      $lookup: {
        from: 'praticas',
        localField: 'pratica',
        foreignField: '_id',
        as: 'praticaDetalhes'
      }
    },
    // Desenrolar o array de práticas (que terá apenas um item)
    { $unwind: '$praticaDetalhes' },
    // Projetar apenas os campos necessários
    {
      $project: {
        _id: 1,
        data: '$createdAt',
        duracao: 1,
        praticaId: '$pratica',
        titulo: '$praticaDetalhes.titulo',
        categoria: '$praticaDetalhes.categoria',
        imagemCapa: '$praticaDetalhes.imagemCapa'
      }
    }
  ]);
  
  // Contar o total de práticas concluídas
  const total = await RegistroPratica.countDocuments({
    user: req.user.id,
    tipoEvento: 'conclusao'
  });
  
  res.status(200).json({
    success: true,
    count: historico.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    },
    data: historico
  });
});

// @desc    Obter estatísticas de prática do usuário
// @route   GET /api/praticas/stats
// @access  Private
exports.getStats = asyncHandler(async (req, res, next) => {
  // Agregação para obter estatísticas de práticas
  const stats = await RegistroPratica.aggregate([
    // Filtrar apenas registros do usuário atual e apenas conclusões
    { 
      $match: { 
        user: mongoose.Types.ObjectId(req.user.id),
        tipoEvento: 'conclusao'
      } 
    },
    // Agrupar por categoria da prática e calcular total e duração
    {
      $lookup: {
        from: 'praticas',
        localField: 'pratica',
        foreignField: '_id',
        as: 'praticaDetalhes'
      }
    },
    { $unwind: '$praticaDetalhes' },
    {
      $group: {
        _id: '$praticaDetalhes.categoria',
        total: { $sum: 1 },
        duracaoTotal: { $sum: '$duracao' },
        ultimaPratica: { $max: '$createdAt' }
      }
    },
    // Renomear _id para categoria para maior clareza
    {
      $project: {
        _id: 0,
        categoria: '$_id',
        total: 1,
        duracaoTotal: 1,
        ultimaPratica: 1
      }
    }
  ]);
  
  // Calcular estatísticas gerais
  const totalPraticas = await RegistroPratica.countDocuments({
    user: req.user.id,
    tipoEvento: 'conclusao'
  });
  
  // Obter a primeira e a última prática
  const primeiraPratica = await RegistroPratica.findOne({
    user: req.user.id,
    tipoEvento: 'conclusao'
  }).sort({ createdAt: 1 });
  
  const ultimaPratica = await RegistroPratica.findOne({
    user: req.user.id,
    tipoEvento: 'conclusao'
  }).sort({ createdAt: -1 });
  
  // Calcular dias consecutivos de prática (streak)
  const streak = await calcularStreak(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      categorias: stats,
      totalPraticas,
      primeiraPraticaData: primeiraPratica ? primeiraPratica.createdAt : null,
      ultimaPraticaData: ultimaPratica ? ultimaPratica.createdAt : null,
      streak
    }
  });
});

// Função auxiliar para calcular dias consecutivos de prática
const calcularStreak = async (userId) => {
  // Obter todas as datas de prática ordenadas por data (mais recente primeiro)
  const registros = await RegistroPratica.find({
    user: userId,
    tipoEvento: 'conclusao'
  })
  .sort({ createdAt: -1 })
  .select('createdAt');
  
  if (registros.length === 0) {
    return 0;
  }
  
  // Verificar se a última prática foi hoje ou ontem
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const ultimaPraticaData = new Date(registros[0].createdAt);
  ultimaPraticaData.setHours(0, 0, 0, 0);
  
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  
  // Se a última prática não foi hoje nem ontem, o streak é 0
  if (ultimaPraticaData.getTime() !== hoje.getTime() && 
      ultimaPraticaData.getTime() !== ontem.getTime()) {
    return 0;
  }
  
  // Iniciar contagem do streak
  let streak = 1;
  let dataAnterior = ultimaPraticaData;
  
  // Converter todas as datas para o início do dia para comparação
  const datasUnicas = new Set();
  registros.forEach(reg => {
    const data = new Date(reg.createdAt);
    data.setHours(0, 0, 0, 0);
    datasUnicas.add(data.getTime());
  });
  
  // Converter o Set para um array e ordenar
  const datasOrdenadas = [...datasUnicas].sort((a, b) => b - a);
  
  // Calcular streak contando dias consecutivos
  for (let i = 1; i < datasOrdenadas.length; i++) {
    const dataAtual = new Date(datasOrdenadas[i]);
    const dataEsperada = new Date(dataAnterior);
    dataEsperada.setDate(dataEsperada.getDate() - 1);
    
    if (dataAtual.getTime() === dataEsperada.getTime()) {
      streak++;
      dataAnterior = dataAtual;
    } else {
      break;
    }
  }
  
  return streak;
};
