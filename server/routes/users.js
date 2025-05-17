const express = require('express');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Obter todos os usuários
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const users = await User.find({});
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
}));

// @desc    Obter um único usuário
// @route   GET /api/users/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse(`Usuário não encontrado com id ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
}));

module.exports = router;
