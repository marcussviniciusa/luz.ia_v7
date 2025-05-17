const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const LuzIA = require('../services/ia/luz-ia');

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
  // Contar usuários por status
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Formatar os dados para o frontend
  const formattedUserStats = {};
  userStats.forEach(stat => {
    formattedUserStats[stat._id] = stat.count;
  });

  // Número total de usuários
  const totalUsers = await User.countDocuments();

  // Retornar estatísticas
  res.status(200).json({
    success: true,
    data: {
      userStats: formattedUserStats,
      totalUsers,
      // Outras estatísticas podem ser adicionadas aqui
    }
  });
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
