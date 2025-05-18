const User = require('../models/User');
const Conversation = require('../models/Conversation');
const DiarioEntry = require('../models/DiarioEntry');
const Manifestacao = require('../models/Manifestacao');
const RegistroPratica = require('../models/RegistroPratica');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const LuzIA = require('../services/ia/luz-ia');
const mongoose = require('mongoose');

// @desc    Obter todos os usuários
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter usuários pendentes de aprovação
// @route   GET /api/admin/users/pending
// @access  Private/Admin
exports.getPendingUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({ status: 'pendente' });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Obter usuário pelo ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Criar usuário (pelo admin)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar usuário
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Aprovar usuário
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
exports.approveUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'aprovada' },
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user,
    message: 'Usuário aprovado com sucesso'
  });
});

// @desc    Desativar usuário
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'desativada' },
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user,
    message: 'Usuário desativado com sucesso'
  });
});

// @desc    Excluir usuário
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter estatísticas gerais
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = asyncHandler(async (req, res, next) => {
  try {
    // Executar todas as consultas em paralelo para melhor performance
    const [
      userStats,
      totalUsers,
      totalContent,
      pendingUsers,
      totalManifestacoes,
      totalPraticas,
      luzIAInteractions,
      totalDiarioEntries
    ] = await Promise.all([
      // Contar usuários por status
      User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      // Número total de usuários
      User.countDocuments(),
      // Total de conteúdos (aqui estamos considerando como exemplos de conteúdo)
      Manifestacao.countDocuments({ tipo: 'conteudo' }),
      // Usuários pendentes
      User.countDocuments({ status: 'pendente' }),
      // Total de manifestações
      Manifestacao.countDocuments(),
      // Total de práticas concluídas
      RegistroPratica.countDocuments({ tipoEvento: 'conclusao' }),
      // Interações com LUZ IA
      Conversation.aggregate([
        {
          $project: {
            messageCount: { $size: '$messages' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$messageCount' }
          }
        }
      ]),
      // Total de entradas no diário
      DiarioEntry.countDocuments()
    ]);
    
    // Formatar os dados de usuários por status
    const formattedUserStats = {};
    userStats.forEach(stat => {
      formattedUserStats[stat._id] = stat.count;
    });
    
    // Retornar estatísticas
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        pendingUsers,
        totalContent,
        totalPraticas,
        totalManifestacoes,
        totalDiarioEntries,
        luzIAInteractions: luzIAInteractions.length > 0 ? luzIAInteractions[0].total : 0,
        userStats: formattedUserStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de admin:', error);
    return next(new ErrorResponse('Erro ao buscar estatísticas', 500));
  }
});

// @desc    Obter atividades recentes no sistema
// @route   GET /api/admin/recent-activities
// @access  Private/Admin
exports.getRecentActivities = asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Buscar dados em paralelo
    const [
      recentUsers,
      recentPraticas,
      recentDiario,
      recentLuzIA,
      recentManifestacoes
    ] = await Promise.all([
      // Novos usuários registrados
      User.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('nome email status createdAt'),
        
      // Práticas concluídas recentemente
      RegistroPratica.find({ tipoEvento: 'conclusao' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'nome')
        .populate('pratica', 'titulo categoria')
        .select('createdAt user pratica duracao'),
        
      // Novos registros de diário
      DiarioEntry.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'nome')
        .select('createdAt user'),
        
      // Novas conversas com LUZ IA
      Conversation.find()
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('user', 'nome')
        .select('title createdAt updatedAt user'),
        
      // Novas manifestações
      Manifestacao.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'nome')
        .select('nome tipo createdAt user')
    ]);
    
    // Formatar todas as atividades em um formato consistente
    const allActivities = [
      ...recentUsers.map(user => ({
        id: user._id,
        type: 'user',
        action: `Nova conta ${user.status === 'pendente' ? 'pendente' : 'criada'}`,
        user: user.nome,
        date: user.createdAt
      })),
      
      ...recentPraticas.map(reg => ({
        id: reg._id,
        type: 'content',
        action: `Prática concluída: ${reg.pratica.titulo}`,
        user: reg.user ? reg.user.nome : 'Usuário desconhecido',
        date: reg.createdAt
      })),
      
      ...recentDiario.map(entry => ({
        id: entry._id,
        type: 'diario',
        action: 'Novo registro no Diário',
        user: entry.user ? entry.user.nome : 'Usuário desconhecido',
        date: entry.createdAt
      })),
      
      ...recentLuzIA.map(conv => ({
        id: conv._id,
        type: 'luzia',
        action: `Conversa com LUZ IA: ${conv.title}`,
        user: conv.user ? conv.user.nome : 'Usuário desconhecido',
        date: conv.updatedAt
      })),
      
      ...recentManifestacoes.map(item => ({
        id: item._id,
        type: 'manifestacao',
        action: `Nova ferramenta de manifestação: ${item.nome}`,
        user: item.user ? item.user.nome : 'Usuário desconhecido',
        date: item.createdAt
      }))
    ];
    
    // Ordenar por data (mais recente primeiro)
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limitar ao número solicitado
    const limitedActivities = allActivities.slice(0, limit);
    
    res.status(200).json({
      success: true,
      count: limitedActivities.length,
      data: limitedActivities
    });
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    return next(new ErrorResponse('Erro ao buscar atividades recentes', 500));
  }
});

// @desc    Atualizar base de conhecimento da LUZ IA
// @route   PUT /api/admin/luz-ia/knowledge
// @access  Private/Admin
exports.updateLuzIAKnowledge = asyncHandler(async (req, res, next) => {
  const result = await LuzIA.updateKnowledgeBase();
  
  if (!result.success) {
    return next(new ErrorResponse('Erro ao atualizar base de conhecimento', 500));
  }
  
  res.status(200).json({
    success: true,
    message: 'Base de conhecimento atualizada com sucesso'
  });
});

// @desc    Atualizar prompt da LUZ IA
// @route   PUT /api/admin/luz-ia/prompts/:name
// @access  Private/Admin
exports.updateLuzIAPrompt = asyncHandler(async (req, res, next) => {
  const { name } = req.params;
  const { template } = req.body;
  
  if (!template) {
    return next(new ErrorResponse('Template do prompt é obrigatório', 400));
  }
  
  const result = await LuzIA.updatePrompt(name, template);
  
  if (!result.success) {
    return next(new ErrorResponse(result.message, 500));
  }
  
  res.status(200).json({
    success: true,
    message: `Prompt '${name}' atualizado com sucesso`
  });
});

// @desc    Listar prompts da LUZ IA
// @route   GET /api/admin/luz-ia/prompts
// @access  Private/Admin
exports.getLuzIAPrompts = asyncHandler(async (req, res, next) => {
  const prompts = LuzIA.getAvailablePrompts();
  
  res.status(200).json({
    success: true,
    data: prompts
  });
});
