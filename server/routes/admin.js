const express = require('express');
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
  updateLuzIAKnowledge,
  updateLuzIAPrompt,
  getLuzIAPrompts
} = require('../controllers/admin');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Todas as rotas de admin precisam de autenticação e autorização
router.use(protect);
router.use(authorize('admin'));

// Rotas de gerenciamento de usuários
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.get('/users/pending', getPendingUsers);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/approve', approveUser);
router.put('/users/:id/deactivate', deactivateUser);

// Rotas para estatísticas
router.get('/stats', getStats);

// Rotas para gerenciamento da LUZ IA
router.put('/luz-ia/knowledge', updateLuzIAKnowledge);
router.get('/luz-ia/prompts', getLuzIAPrompts);
router.put('/luz-ia/prompts/:name', updateLuzIAPrompt);

module.exports = router;
