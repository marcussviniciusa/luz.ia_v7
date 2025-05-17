const DiarioEntry = require('../models/DiarioEntry');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Criar nova entrada no diário
// @route   POST /api/diario
// @access  Private
exports.createEntry = asyncHandler(async (req, res, next) => {
  // Adicionar usuário ao corpo da requisição
  req.body.user = req.user.id;
  
  // Verificar se já existe uma entrada para a data especificada
  const date = req.body.date ? new Date(req.body.date) : new Date();
  date.setHours(0, 0, 0, 0); // Normalizar para início do dia
  
  const existingEntry = await DiarioEntry.findOne({
    user: req.user.id,
    date: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
    }
  });
  
  if (existingEntry) {
    return next(
      new ErrorResponse(
        'Você já tem uma entrada para esta data. Considere atualizar a entrada existente.',
        400
      )
    );
  }
  
  // Criar nova entrada
  const entry = await DiarioEntry.create({
    ...req.body,
    date: date
  });
  
  res.status(201).json({
    success: true,
    data: entry
  });
});

// @desc    Obter todas as entradas do usuário
// @route   GET /api/diario
// @access  Private
exports.getEntries = asyncHandler(async (req, res, next) => {
  // Opções de filtro
  const { startDate, endDate, limit = 30, page = 1 } = req.query;
  const filter = { user: req.user.id };
  
  // Filtrar por intervalo de datas se fornecido
  if (startDate || endDate) {
    filter.date = {};
    
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }
  
  // Calcular skip para paginação
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Buscar entradas
  const entries = await DiarioEntry.find(filter)
    .sort({ date: -1 }) // Ordenar por data (mais recente primeiro)
    .skip(skip)
    .limit(parseInt(limit));
  
  // Contar total de entradas
  const total = await DiarioEntry.countDocuments(filter);
  
  res.status(200).json({
    success: true,
    count: entries.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    },
    data: entries
  });
});

// @desc    Obter uma entrada específica
// @route   GET /api/diario/:id
// @access  Private
exports.getEntry = asyncHandler(async (req, res, next) => {
  const entry = await DiarioEntry.findById(req.params.id);
  
  if (!entry) {
    return next(
      new ErrorResponse(`Entrada não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se a entrada pertence ao usuário
  if (entry.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a acessar esta entrada', 401)
    );
  }
  
  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Obter entrada para data específica
// @route   GET /api/diario/data/:date
// @access  Private
exports.getEntryByDate = asyncHandler(async (req, res, next) => {
  const date = new Date(req.params.date);
  date.setHours(0, 0, 0, 0); // Normalizar para início do dia
  
  const entry = await DiarioEntry.findOne({
    user: req.user.id,
    date: {
      $gte: date,
      $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
    }
  });
  
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Nenhuma entrada encontrada para esta data'
    });
  }
  
  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Atualizar entrada
// @route   PUT /api/diario/:id
// @access  Private
exports.updateEntry = asyncHandler(async (req, res, next) => {
  let entry = await DiarioEntry.findById(req.params.id);
  
  if (!entry) {
    return next(
      new ErrorResponse(`Entrada não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se a entrada pertence ao usuário
  if (entry.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a atualizar esta entrada', 401)
    );
  }
  
  // Atualizar entrada
  entry = await DiarioEntry.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: entry
  });
});

// @desc    Excluir entrada
// @route   DELETE /api/diario/:id
// @access  Private
exports.deleteEntry = asyncHandler(async (req, res, next) => {
  const entry = await DiarioEntry.findById(req.params.id);
  
  if (!entry) {
    return next(
      new ErrorResponse(`Entrada não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se a entrada pertence ao usuário
  if (entry.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a excluir esta entrada', 401)
    );
  }
  
  // Excluir entrada
  await entry.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter estatísticas das entradas
// @route   GET /api/diario/stats
// @access  Private
exports.getStats = asyncHandler(async (req, res, next) => {
  // Contar total de entradas
  const totalEntries = await DiarioEntry.countDocuments({ user: req.user.id });
  
  // Obter todas as entradas para cálculos de streak e progresso emocional
  const entries = await DiarioEntry.find({ user: req.user.id })
    .sort({ date: -1 })
    .select('date avaliacaoEmocional');
  
  // Calcular sequência atual (streak)
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Obter datas únicas das entradas
  const entryDates = entries.map(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime();
  }).sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo
  
  if (entryDates.length > 0) {
    // Verificar se há entrada hoje
    const todayTime = today.getTime();
    let lastDate = entryDates[0] === todayTime ? todayTime : entryDates[0];
    currentStreak = 1; // Já temos pelo menos uma entrada
    
    // Verificar dias consecutivos anteriores
    for (let i = 1; i < entryDates.length; i++) {
      const expectedPrevDate = new Date(lastDate);
      expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
      
      if (entryDates[i] === expectedPrevDate.getTime()) {
        currentStreak++;
        lastDate = entryDates[i];
      } else {
        break; // Quebra na sequência
      }
    }
  }
  
  // Calcular progresso emocional (comparando média das últimas 3 entradas com as 3 anteriores)
  let emotionalProgress = 0;
  
  if (entries.length >= 6) {
    // Pegar as últimas 3 entradas com avaliação emocional
    const recentEntries = entries.slice(0, 3).filter(e => e.avaliacaoEmocional);
    // Pegar as 3 entradas anteriores com avaliação emocional
    const previousEntries = entries.slice(3, 6).filter(e => e.avaliacaoEmocional);
    
    if (recentEntries.length > 0 && previousEntries.length > 0) {
      const recentAvg = recentEntries.reduce((sum, entry) => sum + entry.avaliacaoEmocional, 0) / recentEntries.length;
      const previousAvg = previousEntries.reduce((sum, entry) => sum + entry.avaliacaoEmocional, 0) / previousEntries.length;
      
      // Calcular diferença percentual
      const difference = recentAvg - previousAvg;
      emotionalProgress = Math.round((difference / 5) * 100); // 5 é o valor máximo da escala
    }
  }
  
  // Calcular consistência (entradas nos últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const entriesLast30Days = await DiarioEntry.countDocuments({
    user: req.user.id,
    date: { $gte: thirtyDaysAgo }
  });
  
  // Calcular taxa de consistência (%)
  const consistencyRate = Math.round((entriesLast30Days / 30) * 100);
  
  res.status(200).json({
    success: true,
    data: {
      totalEntries,
      currentStreak,
      emotionalProgress,
      entriesLast30Days,
      consistencyRate
    }
  });
});
