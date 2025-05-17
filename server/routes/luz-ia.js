const express = require('express');
const {
  chatWithLuzIA,
  getCurrentConversation,
  getConversations,
  getConversation,
  createConversation,
  endCurrentConversation,
  deleteConversation,
  getPrompts
} = require('../controllers/luz-ia');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas para interação com a LUZ IA
router.post('/chat', chatWithLuzIA);
router.get('/prompts', getPrompts);

// Rotas para gerenciamento de conversas
router.route('/conversations')
  .get(getConversations)
  .post(createConversation);

router.get('/conversations/current', getCurrentConversation);
router.put('/conversations/current/end', endCurrentConversation);

// Rota especial para conversas recentes
router.get('/conversations/recent', getConversations);

router.route('/conversations/:id')
  .get(getConversation)
  .delete(deleteConversation);

// Rota para adicionar mensagens a uma conversa específica
router.post('/conversations/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória'
      });
    }
    
    const Conversation = require('../models/Conversation');
    
    const conversation = await Conversation.findOne({
      _id: id,
      user: req.user.id
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }
    
    // Adicionar a mensagem à conversa
    conversation.messages.push({
      role: message.type,
      content: message.content,
      timestamp: message.timestamp || new Date()
    });
    
    await conversation.save();
    
    return res.status(200).json({
      success: true,
      message: 'Mensagem adicionada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar mensagem:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar mensagem'
    });
  }
});

module.exports = router;
