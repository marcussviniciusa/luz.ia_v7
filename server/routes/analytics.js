const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const DiarioEntry = require('../models/DiarioEntry');
const Manifestacao = require('../models/Manifestacao');
const RegistroPratica = require('../models/RegistroPratica');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const mongoose = require('mongoose');

// Proteger todas as rotas
router.use(protect);

// @desc    Obter estatísticas gerais do usuário
// @route   GET /api/analytics/me
// @access  Private
router.get('/me', asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Contar entradas no diário
  const totalDiarioEntries = await DiarioEntry.countDocuments({ user: userId });
  
  // Contar conversas com a LUZ IA
  const totalConversations = await Conversation.countDocuments({ user: userId });
  
  // Contar itens de manifestação
  const totalManifestacoes = await Manifestacao.countDocuments({ user: userId });
  
  // Contar práticas concluídas
  const totalPraticas = await RegistroPratica.countDocuments({
    user: userId,
    tipoEvento: 'conclusao'
  });
  
  // Calcular streak de diário
  const streak = await calcularStreakDiario(userId);
  
  // Calcular estatísticas de praticas
  const praticasStats = await RegistroPratica.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), tipoEvento: 'conclusao' } },
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
        duracaoTotal: { $sum: '$duracao' }
      }
    },
    {
      $project: {
        _id: 0,
        categoria: '$_id',
        total: 1,
        duracaoTotal: 1
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalDiarioEntries,
      totalConversations,
      totalManifestacoes,
      totalPraticas,
      streak,
      praticasPorCategoria: praticasStats
    }
  });
}));

// @desc    Obter atividade recente do usuário
// @route   GET /api/analytics/me/recent-activity
// @access  Private
router.get('/me/recent-activity', asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;
  
  // Buscar entradas recentes do diário
  const diarioEntries = await DiarioEntry.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('_id date estadoEmocional createdAt');
  
  // Buscar conversas recentes com a LUZ IA
  const conversations = await Conversation.find({ user: userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('_id title createdAt updatedAt');
  
  // Buscar práticas concluídas recentemente
  const praticasRegistros = await RegistroPratica.find({
    user: userId,
    tipoEvento: 'conclusao'
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('pratica', 'titulo categoria')
    .select('_id pratica createdAt duracao');
  
  // Combinar todos os tipos de atividade e ordenar por data
  const allActivities = [
    ...diarioEntries.map(entry => ({
      type: 'diario',
      id: entry._id,
      title: `Registro no Diário Quântico`,
      date: entry.createdAt,
      data: {
        estadoEmocional: entry.estadoEmocional,
        date: entry.date
      }
    })),
    ...conversations.map(conv => ({
      type: 'conversation',
      id: conv._id,
      title: conv.title,
      date: conv.updatedAt,
      data: {
        createdAt: conv.createdAt
      }
    })),
    ...praticasRegistros.map(reg => ({
      type: 'pratica',
      id: reg._id,
      title: `Prática: ${reg.pratica.titulo}`,
      date: reg.createdAt,
      data: {
        categoria: reg.pratica.categoria,
        duracao: reg.duracao
      }
    }))
  ];
  
  // Ordenar todas as atividades por data (mais recente primeiro)
  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Limitar ao número solicitado
  const limitedActivities = allActivities.slice(0, limit);
  
  res.status(200).json({
    success: true,
    count: limitedActivities.length,
    data: limitedActivities
  });
}));

// @desc    Obter estatísticas por período
// @route   GET /api/analytics/me/period
// @access  Private
router.get('/me/period', asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { startDate, endDate, period = 'daily' } = req.query;
  
  // Validar datas
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();
  
  // Definir formato de agrupamento baseado no período
  let dateGroup;
  if (period === 'monthly') {
    dateGroup = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  } else if (period === 'weekly') {
    dateGroup = { 
      $dateToString: { 
        format: '%Y-%U', 
        date: '$createdAt'
      } 
    };
  } else {
    // daily é o padrão
    dateGroup = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }
  
  // Estatísticas do diário por período
  const diarioStats = await DiarioEntry.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: dateGroup,
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  // Estatísticas de práticas por período
  const praticasStats = await RegistroPratica.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        tipoEvento: 'conclusao',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: dateGroup,
        count: { $sum: 1 },
        duracaoTotal: { $sum: '$duracao' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
        duracaoTotal: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  // Estatísticas de conversas por período
  const conversationsStats = await Conversation.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: dateGroup,
        count: { $sum: 1 },
        messagensTotal: { $sum: { $size: '$messages' } }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
        messagensTotal: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      diario: diarioStats,
      praticas: praticasStats,
      conversas: conversationsStats,
      periodo: period,
      dataInicio: start,
      dataFim: end
    }
  });
}));

// @desc    Obter marcos do usuário
// @route   GET /api/analytics/me/milestones
// @access  Private
router.get('/me/milestones', asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Buscar todas as estatísticas do usuário
  const diarioCount = await DiarioEntry.countDocuments({ user: userId });
  const praticasCount = await RegistroPratica.countDocuments({
    user: userId,
    tipoEvento: 'conclusao'
  });
  const conversationsCount = await Conversation.countDocuments({ user: userId });
  const manifestacoesCount = await Manifestacao.countDocuments({ user: userId });
  
  // Buscar dados para calcular streaks
  const streak = await calcularStreakDiario(userId);
  
  // Calcular minutos de práticas
  const praticasDuracao = await RegistroPratica.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        tipoEvento: 'conclusao'
      }
    },
    {
      $group: {
        _id: null,
        duracaoTotal: { $sum: '$duracao' }
      }
    }
  ]);
  
  const minutosPratica = praticasDuracao.length > 0 
    ? Math.floor(praticasDuracao[0].duracaoTotal / 60) 
    : 0;
  
  // Definir marcos e verificar quais foram alcançados
  const milestones = [
    {
      id: 'diario-first',
      titulo: 'Primeiro Registro no Diário',
      descricao: 'Você fez seu primeiro registro no Diário Quântico!',
      alcancado: diarioCount > 0,
      data: diarioCount > 0 ? await getFirstDate(DiarioEntry, userId) : null,
      categoria: 'diario'
    },
    {
      id: 'diario-7days',
      titulo: '7 Dias de Registros',
      descricao: 'Você registrou 7 dias no Diário Quântico!',
      alcancado: diarioCount >= 7,
      data: diarioCount >= 7 ? await getNthDate(DiarioEntry, userId, 7) : null,
      categoria: 'diario'
    },
    {
      id: 'diario-30days',
      titulo: '30 Dias de Registros',
      descricao: 'Você registrou 30 dias no Diário Quântico!',
      alcancado: diarioCount >= 30,
      data: diarioCount >= 30 ? await getNthDate(DiarioEntry, userId, 30) : null,
      categoria: 'diario'
    },
    {
      id: 'diario-streak-7',
      titulo: '7 Dias Consecutivos de Registros',
      descricao: 'Você manteve uma sequência de 7 dias consecutivos de registros!',
      alcancado: streak >= 7,
      data: null, // Não é possível determinar facilmente a data exata
      categoria: 'diario'
    },
    {
      id: 'pratica-first',
      titulo: 'Primeira Prática Completa',
      descricao: 'Você concluiu sua primeira prática guiada!',
      alcancado: praticasCount > 0,
      data: praticasCount > 0 ? await getFirstDate(RegistroPratica, userId, { tipoEvento: 'conclusao' }) : null,
      categoria: 'pratica'
    },
    {
      id: 'pratica-10',
      titulo: '10 Práticas Concluídas',
      descricao: 'Você concluiu 10 práticas guiadas!',
      alcancado: praticasCount >= 10,
      data: praticasCount >= 10 ? await getNthDate(RegistroPratica, userId, 10, { tipoEvento: 'conclusao' }) : null,
      categoria: 'pratica'
    },
    {
      id: 'pratica-60min',
      titulo: '1 Hora de Práticas',
      descricao: 'Você completou mais de 60 minutos de práticas guiadas!',
      alcancado: minutosPratica >= 60,
      data: null, // Não é possível determinar facilmente a data exata
      categoria: 'pratica'
    },
    {
      id: 'luzia-first',
      titulo: 'Primeira Conversa com LUZ IA',
      descricao: 'Você iniciou sua primeira conversa com a LUZ IA!',
      alcancado: conversationsCount > 0,
      data: conversationsCount > 0 ? await getFirstDate(Conversation, userId) : null,
      categoria: 'luzia'
    },
    {
      id: 'manifestacao-first',
      titulo: 'Primeira Ferramenta de Manifestação',
      descricao: 'Você criou sua primeira ferramenta de manifestação!',
      alcancado: manifestacoesCount > 0,
      data: manifestacoesCount > 0 ? await getFirstDate(Manifestacao, userId) : null,
      categoria: 'manifestacao'
    }
  ];
  
  // Filtrar apenas marcos alcançados
  const marcosAlcancados = milestones.filter(m => m.alcancado);
  
  res.status(200).json({
    success: true,
    count: marcosAlcancados.length,
    total: milestones.length,
    data: {
      alcancados: marcosAlcancados,
      todos: milestones
    }
  });
}));

// Rota só para administradores
// @desc    Obter estatísticas gerais da plataforma
// @route   GET /api/analytics/admin/general
// @access  Private/Admin
router.get('/admin/general', authorize('admin'), asyncHandler(async (req, res, next) => {
  // Estatísticas de usuários
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1
      }
    }
  ]);
  
  // Total de usuários
  const totalUsers = await User.countDocuments();
  
  // Usuários ativos nos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const activeUsers = await RegistroPratica.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: '$user'
      }
    },
    {
      $count: 'total'
    }
  ]);
  
  // Contagem de recursos
  const diarioCount = await DiarioEntry.countDocuments();
  const conversationsCount = await Conversation.countDocuments();
  const manifestacoesCount = await Manifestacao.countDocuments();
  const praticasCount = await RegistroPratica.countDocuments({ tipoEvento: 'conclusao' });
  
  res.status(200).json({
    success: true,
    data: {
      usuarios: {
        total: totalUsers,
        porStatus: userStats,
        ativos7Dias: activeUsers.length > 0 ? activeUsers[0].total : 0
      },
      recursos: {
        diario: diarioCount,
        conversas: conversationsCount,
        manifestacoes: manifestacoesCount,
        praticas: praticasCount
      }
    }
  });
}));

// @desc    Obter estatísticas de uso por período para admin
// @route   GET /api/analytics/admin/usage
// @access  Private/Admin
router.get('/admin/usage', authorize('admin'), asyncHandler(async (req, res, next) => {
  const { startDate, endDate, period = 'daily' } = req.query;
  
  // Validar datas
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();
  
  // Definir formato de agrupamento baseado no período
  let dateGroup;
  if (period === 'monthly') {
    dateGroup = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  } else if (period === 'weekly') {
    dateGroup = { 
      $dateToString: { 
        format: '%Y-%U', 
        date: '$createdAt'
      } 
    };
  } else {
    // daily é o padrão
    dateGroup = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  }
  
  // Estatísticas do diário por período
  const diarioStats = await DiarioEntry.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: dateGroup,
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  // Estatísticas de práticas por período
  const praticasStats = await RegistroPratica.aggregate([
    {
      $match: {
        tipoEvento: 'conclusao',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: dateGroup,
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        duracaoTotal: { $sum: '$duracao' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        duracaoTotal: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  // Estatísticas de conversas por período
  const conversationsStats = await Conversation.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: dateGroup,
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        messagensTotal: { $sum: { $size: '$messages' } }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        messagensTotal: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  // Estatísticas de registros por período
  const userRegistrationStats = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: dateGroup,
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1
      }
    },
    { $sort: { date: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      diario: diarioStats,
      praticas: praticasStats,
      conversas: conversationsStats,
      registros: userRegistrationStats,
      periodo: period,
      dataInicio: start,
      dataFim: end
    }
  });
}));

// Funções auxiliares

// Obter a data do primeiro registro de uma coleção
const getFirstDate = async (Model, userId, additionalFilter = {}) => {
  const filter = { user: userId, ...additionalFilter };
  const firstRecord = await Model.findOne(filter).sort({ createdAt: 1 }).select('createdAt');
  return firstRecord ? firstRecord.createdAt : null;
};

// Obter a data do N-ésimo registro de uma coleção
const getNthDate = async (Model, userId, n, additionalFilter = {}) => {
  const filter = { user: userId, ...additionalFilter };
  const records = await Model.find(filter).sort({ createdAt: 1 }).select('createdAt').limit(n);
  return records.length === n ? records[n-1].createdAt : null;
};

// Calcular streak de diário
const calcularStreakDiario = async (userId) => {
  // Obter todas as datas de registros de diário ordenadas por data (mais recente primeiro)
  const registros = await DiarioEntry.find({ user: userId })
    .sort({ date: -1 })
    .select('date');
  
  if (registros.length === 0) {
    return 0;
  }
  
  // Verificar se o último registro foi hoje ou ontem
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const ultimoRegistroData = new Date(registros[0].date);
  ultimoRegistroData.setHours(0, 0, 0, 0);
  
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  
  // Se o último registro não foi hoje nem ontem, o streak é 0
  if (ultimoRegistroData.getTime() !== hoje.getTime() && 
      ultimoRegistroData.getTime() !== ontem.getTime()) {
    return 0;
  }
  
  // Iniciar contagem do streak
  let streak = 1;
  let dataAnterior = ultimoRegistroData;
  
  // Converter todas as datas para o início do dia para comparação
  const datasUnicas = new Set();
  registros.forEach(reg => {
    const data = new Date(reg.date);
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

module.exports = router;
