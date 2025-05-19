const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');

const {
  getSettings,
  updateSettings,
  getKnowledgeBase,
  addToKnowledgeBase,
  removeFromKnowledgeBase,
  resetKnowledgeBase,
  getConversations,
  getMetrics
} = require('../../controllers/admin/luz-ia-admin');

// Proteger todas as rotas
router.use(protect);
router.use(authorize('admin'));

// Rota de configurações
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

// Rotas de base de conhecimento
router.route('/knowledgebase')
  .get(getKnowledgeBase)
  .post(addToKnowledgeBase);

router.route('/knowledgebase/:id')
  .delete(removeFromKnowledgeBase);

router.route('/knowledgebase/reset')
  .post(resetKnowledgeBase);

// Rotas de conversas
router.route('/conversations')
  .get(getConversations);

// Rota de métricas
router.route('/metrics')
  .get(getMetrics);

module.exports = router;
