const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Proteger rotas
exports.protect = asyncHandler(async (req, res, next) => {
  // Verifica se é uma rota de imagem, proxy ou recurso público
  const isPublicPath = 
      req.path.includes('/public/') || 
      req.path.includes('/images/') || 
      req.path.includes('/uploads/') || 
      req.path.includes('/proxy/') || 
      req.path.includes('/api/proxy/') ||
      req.path.includes('/minio/') ||
      req.path.includes('/perfil/foto') ||
      req.originalUrl.includes('/perfil/foto');
      
  // Permitir acesso a imagens e recursos públicos sem autenticação
  if (isPublicPath) {
    console.log('Rota de imagem, proxy ou recurso público detectada, ignorando autenticação:', req.path);
    return next();
  }
  
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Obter token do header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Tenta obter o token dos cookies
    token = req.cookies.token;
  }

  // Verificar se o token existe
  if (!token) {
    return next(new ErrorResponse('Acesso não autorizado a esta rota', 401));
  }

  try {
    // Verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);
    
    // Verificar se o usuário está ativo
    if (req.user.status !== 'aprovada') {
      return next(new ErrorResponse('Sua conta não está ativa. Por favor, aguarde a aprovação do administrador.', 403));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Acesso não autorizado a esta rota', 401));
  }
});

// Conceder acesso a roles específicas
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `O papel ${req.user.role} não tem permissão para acessar esta rota`,
          403
        )
      );
    }
    next();
  };
};
