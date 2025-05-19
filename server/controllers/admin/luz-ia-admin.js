const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const fs = require('fs');
const path = require('path');
const { minioClient } = require('../../config/minio');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const LuzIA = require('../../services/ia/luz-ia');

// @desc    Obter configurações da LUZ IA
// @route   GET /api/admin/luzia/settings
// @access  Private/Admin
exports.getSettings = asyncHandler(async (req, res, next) => {
  // Em produção, poderia buscar estas configurações de um banco de dados
  // ou arquivo de configuração específico
  const settings = {
    apiKey: process.env.OPENAI_API_KEY ? '•••••••••••••••••••••••' : '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.7,
    personalityLevel: 'equilibrado'
  };

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Atualizar configurações da LUZ IA
// @route   PUT /api/admin/luzia/settings
// @access  Private/Admin
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const { model, maxTokens, temperature, personalityLevel } = req.body;
  
  // Validar entradas
  if (!model || !maxTokens || temperature === undefined || !personalityLevel) {
    return next(new ErrorResponse('Todos os campos são obrigatórios', 400));
  }

  // Em produção, salvar estas configurações em um banco de dados ou
  // atualizar variáveis de ambiente conforme necessário
  
  // Exemplo de atualização das configurações na memória
  const newSettings = {
    model,
    maxTokens,
    temperature,
    personalityLevel
  };
  
  // Aqui você poderia salvar as configurações em um arquivo ou banco de dados
  
  res.status(200).json({
    success: true,
    data: {
      ...newSettings,
      apiKey: '•••••••••••••••••••••••' // Nunca retornar a API key real
    },
    message: 'Configurações atualizadas com sucesso'
  });
});

// @desc    Obter lista de arquivos na base de conhecimento
// @route   GET /api/admin/luzia/knowledgebase
// @access  Private/Admin
exports.getKnowledgeBase = asyncHandler(async (req, res, next) => {
  try {
    // Diretório onde estão armazenados os arquivos de transcrição
    const transcriptionsDir = path.join(__dirname, '../../../ai-training/transcricoes');
    
    // Verificar se o diretório existe
    if (!fs.existsSync(transcriptionsDir)) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Ler o diretório e obter a lista de arquivos
    const files = fs.readdirSync(transcriptionsDir);
    
    // Formatar a resposta
    const knowledgeBase = files.map((file, index) => {
      const filePath = path.join(transcriptionsDir, file);
      const stats = fs.statSync(filePath);
      const fileType = path.extname(file).replace('.', '').toLowerCase();
      
      return {
        id: index + 1,
        name: file,
        size: `${Math.round(stats.size / 1024)} KB`,
        type: fileType || 'text',
        uploaded: stats.mtime.toISOString().split('T')[0],
        description: 'Arquivo de transcrição para LUZ IA',
        status: 'processed'
      };
    });
    
    res.status(200).json({
      success: true,
      data: knowledgeBase
    });
  } catch (error) {
    console.error('Erro ao buscar base de conhecimento:', error);
    return next(new ErrorResponse('Erro ao buscar base de conhecimento', 500));
  }
});

// @desc    Adicionar arquivo à base de conhecimento
// @route   POST /api/admin/luzia/knowledgebase
// @access  Private/Admin
exports.addToKnowledgeBase = asyncHandler(async (req, res, next) => {
  // Verificar se um arquivo foi enviado
  if (!req.files || !req.files.file) {
    return next(new ErrorResponse('Por favor, envie um arquivo', 400));
  }
  
  const file = req.files.file;
  const { description } = req.body;
  
  // Verificar tipo de arquivo
  const allowedTypes = ['.pdf', '.docx', '.txt', '.json'];
  const fileExt = path.extname(file.name).toLowerCase();
  
  if (!allowedTypes.includes(fileExt)) {
    return next(new ErrorResponse('Tipo de arquivo não permitido. Apenas PDF, DOCX, TXT e JSON são aceitos.', 400));
  }
  
  try {
    // Diretório para salvar os arquivos
    const transcriptionsDir = path.join(__dirname, '../../../ai-training/transcricoes');
    
    // Verificar se o diretório existe, se não, criar
    if (!fs.existsSync(transcriptionsDir)) {
      fs.mkdirSync(transcriptionsDir, { recursive: true });
    }
    
    // Gerar nome de arquivo único
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = path.join(transcriptionsDir, fileName);
    
    // Mover o arquivo para o diretório
    await file.mv(filePath);
    
    // Adicionar metadados sobre o arquivo (opcional, em produção poderia salvar em um banco de dados)
    const fileInfo = {
      name: fileName,
      originalName: file.name,
      size: file.size,
      type: fileExt.replace('.', ''),
      path: filePath,
      description: description || '',
      uploadedAt: new Date(),
      status: 'processing'
    };
    
    // Em produção, você poderia iniciar um job para processar o arquivo
    // e adicioná-lo à base de conhecimento da LUZ IA
    
    res.status(201).json({
      success: true,
      data: {
        id: Date.now(),
        name: fileName,
        size: `${Math.round(file.size / 1024)} KB`,
        type: fileExt.replace('.', ''),
        uploaded: new Date().toISOString().split('T')[0],
        description: description || '',
        status: 'processing'
      },
      message: 'Arquivo enviado para processamento'
    });
  } catch (error) {
    console.error('Erro ao adicionar arquivo à base de conhecimento:', error);
    return next(new ErrorResponse('Erro ao processar upload do arquivo', 500));
  }
});

// @desc    Remover arquivo da base de conhecimento
// @route   DELETE /api/admin/luzia/knowledgebase/:id
// @access  Private/Admin
exports.removeFromKnowledgeBase = asyncHandler(async (req, res, next) => {
  try {
    // Diretório onde estão armazenados os arquivos de transcrição
    const transcriptionsDir = path.join(__dirname, '../../../ai-training/transcricoes');
    
    // Verificar se o diretório existe
    if (!fs.existsSync(transcriptionsDir)) {
      return next(new ErrorResponse('Diretório de transcrições não encontrado', 404));
    }
    
    // Ler o diretório e obter a lista de arquivos
    const files = fs.readdirSync(transcriptionsDir);
    
    // Buscar arquivo pelo ID (posição no array + 1)
    const fileIndex = parseInt(req.params.id) - 1;
    
    if (fileIndex < 0 || fileIndex >= files.length) {
      return next(new ErrorResponse('Arquivo não encontrado', 404));
    }
    
    const fileName = files[fileIndex];
    const filePath = path.join(transcriptionsDir, fileName);
    
    // Remover o arquivo
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      success: true,
      data: {},
      message: 'Arquivo removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover arquivo da base de conhecimento:', error);
    return next(new ErrorResponse('Erro ao remover arquivo', 500));
  }
});

// @desc    Resetar e reprocessar a base de conhecimento
// @route   POST /api/admin/luzia/knowledgebase/reset
// @access  Private/Admin
exports.resetKnowledgeBase = asyncHandler(async (req, res, next) => {
  try {
    // Aqui você poderia implementar a lógica para reprocessar todos
    // os documentos na base de conhecimento
    
    // Como exemplo simples, vamos apenas retornar sucesso
    // Em produção, isso poderia iniciar um job de processamento
    
    res.status(200).json({
      success: true,
      message: 'Base de conhecimento está sendo reprocessada'
    });
  } catch (error) {
    console.error('Erro ao resetar base de conhecimento:', error);
    return next(new ErrorResponse('Erro ao resetar base de conhecimento', 500));
  }
});

// @desc    Obter histórico de conversas para administrador
// @route   GET /api/admin/luzia/conversations
// @access  Private/Admin
exports.getConversations = asyncHandler(async (req, res, next) => {
  try {
    // Buscar todas as conversas (com limite e paginação em produção)
    const conversations = await Conversation.find()
      .sort({ createdAt: -1 })
      .limit(20) // Limitar a 20 conversas mais recentes
      .populate('user', 'name email');
    
    // Formatar os dados para a resposta
    const formattedConversations = conversations.map(conv => {
      // Obter a primeira mensagem do usuário como preview
      const userMessage = conv.messages.find(msg => msg.role === 'user');
      
      // Obter todos os tópicos únicos da conversa
      const topics = [...new Set(conv.messages
        .filter(msg => msg.promptType)
        .map(msg => msg.promptType))];
      
      return {
        id: conv._id,
        user: conv.user ? conv.user.name : 'Usuário desconhecido',
        date: conv.createdAt.toISOString().split('T')[0],
        messages: conv.messages.length,
        topic: topics[0] || 'Geral',
        preview: userMessage ? userMessage.content.substring(0, 50) + '...' : 'Sem mensagens'
      };
    });
    
    res.status(200).json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de conversas:', error);
    return next(new ErrorResponse('Erro ao buscar histórico de conversas', 500));
  }
});

// @desc    Obter métricas da LUZ IA para administrador
// @route   GET /api/admin/luzia/metrics
// @access  Private/Admin
exports.getMetrics = asyncHandler(async (req, res, next) => {
  try {
    // Contar total de conversas
    const totalConversations = await Conversation.countDocuments();
    
    // Contar total de mensagens
    const conversationsWithMessages = await Conversation.find();
    const totalMessages = conversationsWithMessages.reduce(
      (acc, conv) => acc + conv.messages.length, 0
    );
    
    // Calcular média de mensagens por conversa
    const averageMessagesPerConversation = totalConversations > 0 
      ? Math.round(totalMessages / totalConversations) 
      : 0;
    
    // Buscar usuários mais ativos (com mais conversas)
    const userCounts = {};
    const userPromises = [];
    
    conversationsWithMessages.forEach(conv => {
      if (conv.user) {
        userCounts[conv.user] = (userCounts[conv.user] || 0) + 1;
      }
    });
    
    // Ordenar usuários por número de conversas
    const topUserIds = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1]) // Ordenar decrescente
      .slice(0, 3) // Top 3 usuários
      .map(entry => entry[0]); // Obter apenas o IDs
    
    // Buscar nomes dos usuários
    for (const userId of topUserIds) {
      userPromises.push(User.findById(userId, 'name'));
    }
    
    const users = await Promise.all(userPromises);
    
    // Mapear usuários ativos
    const mostActiveUsers = users.map((user, index) => ({
      name: user ? user.name : 'Usuário desconhecido',
      conversations: userCounts[topUserIds[index]]
    }));
    
    // Contar tópicos populares
    const topicCounts = {};
    
    conversationsWithMessages.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.promptType) {
          topicCounts[msg.promptType] = (topicCounts[msg.promptType] || 0) + 1;
        }
      });
    });
    
    // Ordenar tópicos por contagem
    const popularTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1]) // Ordenar decrescente
      .slice(0, 3) // Top 3 tópicos
      .map(entry => ({
        topic: entry[0],
        count: entry[1]
      }));
    
    // Se não houver tópicos, adicionar alguns padrão
    if (popularTopics.length === 0) {
      popularTopics.push(
        { topic: 'Manifestação', count: 0 },
        { topic: 'Práticas Guiadas', count: 0 },
        { topic: 'Diário Quântico', count: 0 }
      );
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalConversations,
        totalMessages,
        averageMessagesPerConversation,
        mostActiveUsers,
        popularTopics
      }
    });
  } catch (error) {
    console.error('Erro ao buscar métricas da LUZ IA:', error);
    return next(new ErrorResponse('Erro ao buscar métricas da LUZ IA', 500));
  }
});
