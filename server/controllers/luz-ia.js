const LuzIA = require('../services/ia/luz-ia');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Conversation = require('../models/Conversation');

// @desc    Realizar pergunta à LUZ IA
// @route   POST /api/luz-ia/chat
// @access  Private
exports.chatWithLuzIA = asyncHandler(async (req, res, next) => {
  const { question, promptType } = req.body;
  const userId = req.user.id;

  if (!question) {
    return next(new ErrorResponse('Por favor, forneça uma pergunta', 400));
  }

  // Processar a pergunta usando o serviço LUZ IA
  const response = await LuzIA.processQuestion(question, promptType || 'default');

  if (!response.success) {
    return next(new ErrorResponse('Erro ao processar pergunta', 500));
  }

  // Salvar a interação no histórico de conversas
  let conversation = await Conversation.findOne({ user: userId, active: true });

  // Se não existir uma conversa ativa, criar uma nova
  if (!conversation) {
    conversation = await Conversation.create({
      user: userId,
      active: true,
      messages: []
    });
  }

  // Adicionar a mensagem à conversa
  conversation.messages.push({
    role: 'user',
    content: question,
    promptType: promptType || 'default',
    timestamp: Date.now()
  });

  // Adicionar a resposta à conversa
  conversation.messages.push({
    role: 'assistant',
    content: response.response,
    promptType: promptType || 'default',
    timestamp: Date.now()
  });

  // Salvar a conversa atualizada
  await conversation.save();

  res.status(200).json({
    success: true,
    data: {
      response: response.response,
      conversationId: conversation._id
    }
  });
});

// @desc    Obter histórico de conversa atual
// @route   GET /api/luz-ia/conversations/current
// @access  Private
exports.getCurrentConversation = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Buscar a conversa ativa do usuário
  const conversation = await Conversation.findOne({ user: userId, active: true });

  if (!conversation) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Listar todas as conversas do usuário
// @route   GET /api/luz-ia/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Buscar todas as conversas do usuário (ordenadas por data de criação, mais recentes primeiro)
  const conversations = await Conversation.find({ user: userId })
    .sort({ createdAt: -1 })
    .select('_id title createdAt active');

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

// @desc    Obter uma conversa específica
// @route   GET /api/luz-ia/conversations/:id
// @access  Private
exports.getConversation = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const conversationId = req.params.id;

  // Buscar a conversa específica
  const conversation = await Conversation.findOne({
    _id: conversationId,
    user: userId
  });

  if (!conversation) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${conversationId}`, 404));
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Criar uma nova conversa
// @route   POST /api/luz-ia/conversations
// @access  Private
exports.createConversation = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { title } = req.body;

  // Desativar a conversa ativa atual, se existir
  await Conversation.updateMany(
    { user: userId, active: true },
    { active: false }
  );

  // Criar nova conversa
  const conversation = await Conversation.create({
    user: userId,
    title: title || `Conversa ${new Date().toLocaleDateString()}`,
    active: true,
    messages: []
  });

  res.status(201).json({
    success: true,
    data: conversation
  });
});

// @desc    Finalizar conversa atual
// @route   PUT /api/luz-ia/conversations/current/end
// @access  Private
exports.endCurrentConversation = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Buscar e atualizar a conversa ativa
  const conversation = await Conversation.findOneAndUpdate(
    { user: userId, active: true },
    { active: false },
    { new: true }
  );

  if (!conversation) {
    return next(new ErrorResponse('Nenhuma conversa ativa encontrada', 404));
  }

  res.status(200).json({
    success: true,
    data: conversation,
    message: 'Conversa finalizada com sucesso'
  });
});

// @desc    Excluir uma conversa
// @route   DELETE /api/luz-ia/conversations/:id
// @access  Private
exports.deleteConversation = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const conversationId = req.params.id;

  // Buscar a conversa
  const conversation = await Conversation.findOne({
    _id: conversationId,
    user: userId
  });

  if (!conversation) {
    return next(new ErrorResponse(`Conversa não encontrada com id ${conversationId}`, 404));
  }

  // Excluir a conversa
  await conversation.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter lista de prompts disponíveis
// @route   GET /api/luz-ia/prompts
// @access  Private
exports.getPrompts = asyncHandler(async (req, res, next) => {
  const prompts = LuzIA.getAvailablePrompts();

  res.status(200).json({
    success: true,
    data: prompts
  });
});
