import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  Avatar,
  Chip,
  CircularProgress,
  useTheme,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import InfoIcon from '@mui/icons-material/Info';
import LightbulbIcon from '@mui/icons-material/LightbulbOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { SnackbarContext } from '../contexts/SnackbarContext';
import ReactMarkdown from 'react-markdown';

// Estilos personalizados
const MessageBubble = styled(Paper)(({ theme, type }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxWidth: '80%',
  borderRadius: type === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
  backgroundColor: type === 'user' ? theme.palette.primary.light : '#f5f5f5',
  color: type === 'user' ? theme.palette.primary.contrastText : theme.palette.text.primary,
  alignSelf: type === 'user' ? 'flex-end' : 'flex-start',
  boxShadow: type === 'user' 
    ? '0 2px 4px rgba(0,0,0,0.1)' 
    : '0 2px 4px rgba(0,0,0,0.05)',
  position: 'relative',
}));

// Componente de mensagem de marca d'água
const Watermark = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  bottom: theme.spacing(0.5),
  fontSize: '0.6rem',
  color: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
}));

// Componente para rolagem automática com altura fixa
const ScrollableMessages = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  padding: theme.spacing(2),
  height: 'calc(70vh - 140px)', // Altura fixa para o container
  minHeight: '400px',            // Altura mínima para garantir visibilidade
  maxHeight: '70vh',             // Altura máxima relativa
  marginBottom: theme.spacing(2),
  "&::-webkit-scrollbar": {
    width: '8px',
    borderRadius: '4px',
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(0,0,0,0.05)",
    borderRadius: '4px',
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(0,0,0,0.15)",
    borderRadius: '4px',
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(0,0,0,0.2)",
  }
}));

// Componente para caixa de sugestões
const SuggestionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: theme.palette.primary.lighter,
    transform: 'translateY(-2px)',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
}));

// Componente principal
function LuzIA() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { showError } = useContext(SnackbarContext);
  
  // Estados
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [suggestions, setSuggestions] = useState([
    "Como posso manifestar mais abundância?",
    "Me ajude a desenvolver gratidão",
    "O que são crenças limitantes?",
    "Como elevar meu estado vibracional?"
  ]);
  
  // Estados para o histórico de conversas
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Referência para rolagem automática
  const messagesEndRef = useRef(null);
  
  // Efeito para rolar para a mensagem mais recente
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);
  
  // Efeito para carregar o histórico de todas as conversas
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!user) return;
      
      try {
        setLoadingHistory(true);
        const response = await axios.get('/api/luz-ia/conversations');
        
        if (response.data.success) {
          setConversationHistory(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar histórico de conversas:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    loadConversationHistory();
  }, [user]);

  // Função para mapear mensagens do formato do banco para o formato do frontend
  const mapDatabaseMessagesToFrontend = (messages) => {
    return messages.map(msg => ({
      type: msg.role || msg.type, // Usar role se existir, caso contrário usar type
      content: msg.content,
      timestamp: msg.timestamp
    }));
  };
  
  // Efeito para carregar histórico de conversa ou iniciar uma nova
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        // Tentar recuperar a conversa mais recente
        const response = await axios.get('/api/luz-ia/conversations/recent');
        
        if (response.data.success && response.data.data) {
          setConversationId(response.data.data._id);
          // Mapear mensagens do formato do banco para o formato do frontend
          const mappedMessages = mapDatabaseMessagesToFrontend(response.data.data.messages || []);
          setConversation(mappedMessages);
        } else {
          // Iniciar nova conversa
          await createNewConversation();
        }
      } catch (error) {
        console.error('Erro ao inicializar conversa:', error);
        showError('Não foi possível inicializar a conversa. Tente novamente mais tarde.');
        
        // Fallback: iniciar conversa local
        const welcomeMessage = {
          type: 'assistant',
          content: `Olá ${user?.name?.split(' ')[0] || 'Jornada'}! Sou a LUZ IA, sua assistente para a Jornada Mente Merecedora. Como posso te ajudar hoje?`,
          timestamp: new Date().toISOString()
        };
        
        setConversation([welcomeMessage]);
      }
    };
    
    initializeConversation();
  }, [user, showError]);
  
  // Função para criar uma nova conversa
  const createNewConversation = async () => {
    try {
      setLoading(true);
      const newConvResponse = await axios.post('/api/luz-ia/conversations');
      
      if (newConvResponse.data.success) {
        const newId = newConvResponse.data.data._id;
        setConversationId(newId);
        
        // Adicionar mensagem de boas-vindas
        const welcomeMessage = {
          type: 'assistant',
          content: `Olá ${user?.name?.split(' ')[0] || 'Jornada'}! Sou a LUZ IA, sua assistente para a Jornada Mente Merecedora. Como posso te ajudar hoje?`,
          timestamp: new Date().toISOString()
        };
        
        setConversation([welcomeMessage]);
        
        // Salvar mensagem de boas-vindas
        await axios.post(`/api/luz-ia/conversations/${newId}/messages`, {
          message: welcomeMessage
        });
        
        // Atualizar histórico de conversas
        const historyResponse = await axios.get('/api/luz-ia/conversations');
        if (historyResponse.data.success) {
          setConversationHistory(historyResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao criar nova conversa:', error);
      showError('Não foi possível criar uma nova conversa. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para carregar uma conversa específica
  const loadConversation = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/luz-ia/conversations/${id}`);
      
      if (response.data.success) {
        setConversationId(response.data.data._id);
        // Mapear mensagens do formato do banco para o formato do frontend
        const mappedMessages = mapDatabaseMessagesToFrontend(response.data.data.messages || []);
        setConversation(mappedMessages);
        setDrawerOpen(false); // Fechar o drawer após selecionar uma conversa
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
      showError('Não foi possível carregar a conversa selecionada.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // Criar objeto de mensagem do usuário
    const userMessage = {
      type: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Atualizar estado de conversação local
    setConversation(prev => [...prev, userMessage]);
    
    // Limpar campo de mensagem e mostrar loading
    setMessage('');
    setLoading(true);
    
    try {
      // Salvar mensagem do usuário
      if (conversationId) {
        await axios.post(`/api/luz-ia/conversations/${conversationId}/messages`, {
          message: userMessage
        });
      }
      
      // Obter resposta da IA
      const response = await axios.post('/api/luz-ia/chat', {
        question: userMessage.content,
        conversationId
      });
      
      if (response.data.success) {
        // Criar objeto de mensagem da IA
        const aiMessage = {
          type: 'assistant',
          content: response.data.data.response,
          timestamp: new Date().toISOString()
        };
        
        // Atualizar conversa local
        setConversation(prev => [...prev, aiMessage]);
        
        // Salvar mensagem da IA
        if (conversationId) {
          await axios.post(`/api/luz-ia/conversations/${conversationId}/messages`, {
            message: aiMessage
          });
        }
      } else {
        showError(response.data.message || 'Não foi possível obter resposta da IA.');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showError('Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.');
      
      // Adicionar mensagem de erro da IA
      const errorMessage = {
        type: 'assistant',
        content: 'Desculpe, estou enfrentando dificuldades técnicas no momento. Por favor, tente novamente mais tarde.',
        timestamp: new Date().toISOString()
      };
      
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  // Função para lidar com tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Função para usar sugestão
  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
  };
  
  // Função para iniciar nova conversa
  const startNewConversation = async () => {
    if (loading) return;
    
    const confirmed = window.confirm('Deseja realmente iniciar uma nova conversa? A conversa atual será encerrada.');
    
    if (confirmed) {
      try {
        setLoading(true);
        
        // Finalizar conversa atual, se existir
        if (conversationId) {
          await axios.put(`/api/luz-ia/conversations/${conversationId}/end`);
        }
        
        // Criar nova conversa
        await createNewConversation();
      } catch (error) {
        console.error('Erro ao iniciar nova conversa:', error);
        showError('Não foi possível iniciar uma nova conversa. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Função para lidar com clique no ícone de informação
  const handleInfoClick = () => {
    alert('LUZ IA \n\nAssistente virtual desenvolvida para auxiliar na jornada de desenvolvimento pessoal do curso Mente Merecedora.');
  };

  // Formatar data para exibição no histórico
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Drawer lateral com histórico de conversas */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '300px',
            maxWidth: '80vw',
          },
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          backgroundColor: theme.palette.primary.main,
          color: 'white'
        }}>
          <Typography variant="h6">Histórico de Conversas</Typography>
          <IconButton onClick={() => setDrawerOpen(false)} color="inherit">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              createNewConversation();
              setDrawerOpen(false);
            }}
          >
            Nova Conversa
          </Button>
        </Box>
        
        {loadingHistory ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {conversationHistory.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="Nenhuma conversa encontrada" 
                  secondary="Inicie uma nova conversa com a LUZ IA"
                />
              </ListItem>
            ) : (
              conversationHistory.map((conv) => (
                <ListItemButton 
                  key={conv._id} 
                  onClick={() => loadConversation(conv._id)}
                  selected={conversationId === conv._id}
                  sx={{
                    borderLeft: conversationId === conv._id ? `4px solid ${theme.palette.primary.main}` : 'none',
                    bgcolor: conversationId === conv._id ? 'rgba(0,0,0,0.04)' : 'transparent',
                  }}
                >
                  <ListItemIcon>
                    <ChatIcon color={conversationId === conv._id ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={conv.title} 
                    secondary={formatDate(conv.createdAt)}
                    primaryTypographyProps={{
                      noWrap: true,
                      sx: { fontWeight: conversationId === conv._id ? 600 : 400 }
                    }}
                  />
                </ListItemButton>
              ))
            )}
          </List>
        )}
      </Drawer>
      
      <Paper 
        elevation={0}
        sx={{ 
          height: '100%',     // Ocupa toda a altura disponível
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <Box 
          sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme.palette.primary.main,
            color: '#fff'
          }}
        >
          <IconButton 
            color="inherit" 
            edge="start" 
            onClick={() => setDrawerOpen(true)} 
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Avatar 
            sx={{ 
              bgcolor: 'white',
              mr: 2,
              padding: '3px',
              '& svg': { color: theme.palette.primary.main }
            }}
          >
            <SupportAgentIcon />
          </Avatar>
          <Typography variant="h6" component="h1" sx={{ flex: 1 }}>
            LUZ IA - Assistente Mente Merecedora
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              color="inherit" 
              onClick={startNewConversation}
              title="Iniciar nova conversa"
            >
              <AddCircleOutlineIcon />
            </IconButton>
            <IconButton 
              color="inherit"
              onClick={handleInfoClick}
              title="Sobre a LUZ IA"
            >
              <InfoIcon />
            </IconButton>
          </Box>
        </Box>
        
        {/* Área de mensagens */}
        <Paper 
          elevation={3} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            flexGrow: 1,
            p: 0,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <ScrollableMessages>
            {conversation.map((msg, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex',
                  mb: 3,
                  alignItems: 'flex-start',
                  flexDirection: (msg.type === 'user' || msg.role === 'user') ? 'row-reverse' : 'row'
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: (msg.type === 'user' || msg.role === 'user') ? '#e0e0e0' : theme.palette.primary.main,
                    mr: (msg.type === 'user' || msg.role === 'user') ? 0 : 2,
                    ml: (msg.type === 'user' || msg.role === 'user') ? 2 : 0
                  }}
                >
                  {(msg.type === 'user' || msg.role === 'user') ? 
                    <PersonIcon /> : 
                    <SupportAgentIcon />
                  }
                </Avatar>
                <MessageBubble type={msg.type || msg.role} elevation={1}>
                  <Box sx={{ mb: (msg.type === 'assistant' || msg.role === 'assistant') ? 3 : 0 }}>
                    {(msg.type === 'assistant' || msg.role === 'assistant') ? (
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => (
                            <Typography 
                              variant="body1" 
                              {...props} 
                              sx={{ mb: 2 }} 
                            />
                          ),
                          h1: ({ node, ...props }) => (
                            <Typography 
                              variant="h5" 
                              {...props} 
                              sx={{ fontWeight: 'bold', mb: 2, mt: 1 }} 
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <Typography 
                              variant="h6" 
                              {...props} 
                              sx={{ fontWeight: 'bold', mb: 2, mt: 1 }} 
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <Box component="li" sx={{ mb: 1 }} {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <Box component="ul" sx={{ mb: 2, pl: 2 }} {...props} />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <Typography variant="body1">
                        {msg.content}
                      </Typography>
                    )}
                  </Box>
                  {(msg.type === 'assistant' || msg.role === 'assistant') && (
                    <Watermark>
                      <Typography variant="body2" fontSize="0.7rem" color="text.secondary">
                        LUZ IA
                      </Typography>
                    </Watermark>
                  )}
                </MessageBubble>
              </Box>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <Box 
                sx={{ 
                  display: 'flex',
                  mb: 2,
                  alignItems: 'flex-start'
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                    mr: 2
                  }}
                >
                  <SupportAgentIcon />
                </Avatar>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    backgroundColor: '#f5f5f5',
                    p: 2,
                    borderRadius: '18px 18px 18px 0',
                  }}
                >
                  <CircularProgress size={20} thickness={6} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Gerando resposta...
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Âncora para rolagem automática */}
            <div ref={messagesEndRef} />
          </ScrollableMessages>
          
          {/* Sugestões */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              px: 2,
              pb: 1.5
            }}
          >
            {suggestions.map((suggestion, index) => (
              <SuggestionChip
                key={index}
                icon={<LightbulbIcon />}
                label={suggestion}
                variant="outlined"
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
          
          <Divider />
          
          {/* Campo de entrada */}
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex',
              alignItems: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.02)'
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              variant="outlined"
              sx={{ 
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <IconButton 
              color="primary" 
              onClick={sendMessage} 
              disabled={loading || !message.trim()}
              sx={{ 
                p: 1,
                bgcolor: (loading || !message.trim()) ? 'transparent' : theme.palette.primary.main,
                color: (loading || !message.trim()) ? theme.palette.text.disabled : 'white',
                '&:hover': {
                  bgcolor: (loading || !message.trim()) ? 'rgba(0,0,0,0.04)' : theme.palette.primary.dark,
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Paper>
    </Box>
  );
}

export default LuzIA;
