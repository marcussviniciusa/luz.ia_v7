const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Verificar se já existe um usuário com este email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email já está em uso', 400));
  }

  // Criar usuário (por padrão estará pendente)
  const user = await User.create({
    name,
    email,
    password,
    status: 'pendente'
  });

  // Retorna resposta sem criar token (usuário terá que aguardar aprovação)
  res.status(201).json({
    success: true,
    message: 'Cadastro realizado com sucesso. Aguarde a aprovação do administrador para acessar o sistema.'
  });
});

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  console.log('Tentativa de login:', { email });

  // Validar email e password
  if (!email || !password) {
    console.log('Email ou senha não fornecidos');
    return next(new ErrorResponse('Por favor, informe email e senha', 400));
  }

  // Verificar se o usuário existe
  const user = await User.findOne({ email }).select('+password');
  console.log('Usuário encontrado:', user ? 'Sim' : 'Não');

  if (!user) {
    console.log('Usuário não encontrado com o email:', email);
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }
  console.log('Status do usuário:', user.status);

  // Verificar se o usuário está aprovado
  if (user.status !== 'aprovada') {
    console.log('Usuário não aprovado, status:', user.status);
    return next(new ErrorResponse('Sua conta está pendente de aprovação. Por favor, aguarde a confirmação do administrador.', 403));
  }
  console.log('Usuário aprovado, verificando senha...');

  // Verificar se a senha está correta
  const isMatch = await user.matchPassword(password);
  console.log('Senha correta:', isMatch ? 'Sim' : 'Não');

  if (!isMatch) {
    console.log('Senha incorreta para o usuário:', email);
    return next(new ErrorResponse('Credenciais inválidas', 401));
  }
  console.log('Autenticação bem-sucedida, gerando token...');

  sendTokenResponse(user, 200, res);
});

// @desc    Logout / limpar cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar dados do usuário
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    bio: req.body.bio
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Atualizar senha
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Verificar senha atual
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Senha atual incorreta', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Função auxiliar para criar token e enviar resposta
const sendTokenResponse = (user, statusCode, res) => {
  // Criar token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        bio: user.bio
      }
    });
};
