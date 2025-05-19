const express = require('express');
const luziAdminRouter = require('./admin/luz-ia-admin');
const {
  getUsers,
  getPendingUsers,
  getUser,
  createUser,
  updateUser,
  approveUser,
  deactivateUser,
  deleteUser,
  getStats,
  getRecentActivities,
  updateLuzIAKnowledge,
  updateLuzIAPrompt,
  getLuzIAPrompts,
  checkEmailExists
} = require('../controllers/admin');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const User = require('../models/User');

// Todas as rotas de admin precisam de autenticação e autorização
router.use(protect);
router.use(authorize('admin'));

// Rotas de gerenciamento de usuários
router.route('/users')
  .get(advancedResults(User), getUsers)
  .post(createUser);

router.get('/users/pending', getPendingUsers);
router.get('/users/check-email', checkEmailExists);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/approve', approveUser);
router.put('/users/:id/deactivate', deactivateUser);

// Rotas para estatísticas
router.get('/stats', getStats);
router.get('/recent-activities', getRecentActivities);

// Rotas para gerenciamento da LUZ IA (legado)
router.put('/luz-ia/knowledge', updateLuzIAKnowledge);
router.get('/luz-ia/prompts', getLuzIAPrompts);
router.put('/luz-ia/prompts/:name', updateLuzIAPrompt);

// Novas rotas para gerenciamento completo da LUZ IA
router.use('/luzia', luziAdminRouter);

module.exports = router;
