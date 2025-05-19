import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  History as HistoryIcon,
  QuestionAnswer as QuestionAnswerIcon,
  ChatBubble as ChatBubbleIcon
} from '@mui/icons-material';
import { SnackbarContext } from '../../contexts/SnackbarContext';

// Componente principal
const LuzIAManagement = () => {
  const { showSuccess, showError } = useContext(SnackbarContext);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Estados para configurações
  const [settings, setSettings] = useState({
    apiKey: '•••••••••••••••••••••••',
    model: 'gpt-4o-mini',
    maxTokens: 2000,
    temperature: 0.7,
    personalityLevel: 'equilibrado'
  });
  
  // Estado para base de conhecimento
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [openAddFileDialog, setOpenAddFileDialog] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  
  // Estado para conversas
  const [conversations, setConversations] = useState([]);
  const [openConversationDialog, setOpenConversationDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  // Estado para métricas
  const [metrics, setMetrics] = useState({
    totalConversations: 0,
    totalMessages: 0,
    averageMessagesPerConversation: 0,
    mostActiveUsers: [],
    popularTopics: []
  });

  useEffect(() => {
    // Carregar dados com base na aba ativa
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Chamadas à API específicas para cada aba
      if (tabValue === 0) {
        // Buscar configurações da IA
        const response = await axios.get('/api/admin/luzia/settings');
        if (response.data.success) {
          setSettings(response.data.data);
        }
      } else if (tabValue === 1) {
        // Buscar base de conhecimento
        const response = await axios.get('/api/admin/luzia/knowledgebase');
        if (response.data.success) {
          setKnowledgeBase(response.data.data);
        }
      } else if (tabValue === 2) {
        // Buscar histórico de conversas
        const response = await axios.get('/api/admin/luzia/conversations');
        if (response.data.success) {
          setConversations(response.data.data);
        }
      } else if (tabValue === 3) {
        // Buscar métricas
        const response = await axios.get('/api/admin/luzia/metrics');
        if (response.data.success) {
          setMetrics(response.data.data);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      showError('Erro ao carregar dados: ' + (error.response?.data?.error || 'Erro de conexão'));
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.put('/api/admin/luzia/settings', settings);
      
      if (response.data.success) {
        showSuccess('Configurações salvas com sucesso');
      } else {
        showError('Erro ao salvar configurações: ' + response.data.error);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showError('Erro ao salvar configurações: ' + (error.response?.data?.error || 'Erro de conexão'));
      setLoading(false);
    }
  };

  const handleFileSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
    }
  };

  const handleAddFileDialogOpen = () => {
    setOpenAddFileDialog(true);
    setFileToUpload(null);
    setFileDescription('');
  };

  const handleAddFileDialogClose = () => {
    setOpenAddFileDialog(false);
  };

  const handleUploadFile = async () => {
    if (!fileToUpload) {
      showError('Selecione um arquivo para upload');
      return;
    }
    
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('description', fileDescription);
      
      const response = await axios.post('/api/admin/luzia/knowledgebase', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Atualizar a lista de arquivos com o novo arquivo
        await fetchData();
        showSuccess('Arquivo enviado para processamento');
        handleAddFileDialogClose();
      } else {
        showError('Erro ao fazer upload do arquivo: ' + response.data.error);
      }
      setUploadingFile(false);
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      showError('Erro ao fazer upload do arquivo: ' + (error.response?.data?.error || 'Erro de conexão'));
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/api/admin/luzia/knowledgebase/${fileId}`);
      
      if (response.data.success) {
        // Atualizar a lista de arquivos
        await fetchData();
        showSuccess('Arquivo removido da base de conhecimento');
      } else {
        showError('Erro ao remover arquivo: ' + response.data.error);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      showError('Erro ao remover arquivo: ' + (error.response?.data?.error || 'Erro de conexão'));
      setLoading(false);
    }
  };

  const handleViewConversation = (conversation) => {
    setSelectedConversation(conversation);
    setOpenConversationDialog(true);
  };

  const handleCloseConversationDialog = () => {
    setOpenConversationDialog(false);
    setSelectedConversation(null);
  };

  const handleResetKnowledgeBase = async () => {
    if (!window.confirm('Tem certeza que deseja resetar a base de conhecimento? Isso irá reprocessar todos os documentos.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/luzia/knowledgebase/reset');
      
      if (response.data.success) {
        showSuccess('Base de conhecimento está sendo reprocessada');
      } else {
        showError('Erro ao resetar base de conhecimento: ' + response.data.error);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao resetar base de conhecimento:', error);
      showError('Erro ao resetar base de conhecimento: ' + (error.response?.data?.error || 'Erro de conexão'));
      setLoading(false);
    }
  };

  const renderTabs = () => (
    <Paper sx={{ mb: 3 }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
      >
        <Tab icon={<SettingsIcon />} label="Configurações" />
        <Tab icon={<StorageIcon />} label="Base de Conhecimento" />
        <Tab icon={<HistoryIcon />} label="Histórico de Conversas" />
        <Tab icon={<PsychologyIcon />} label="Métricas" />
      </Tabs>
    </Paper>
  );

  const renderSettings = () => (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configurações da LUZ IA
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="API Key"
            type="password"
            name="apiKey"
            value={settings.apiKey}
            onChange={handleSettingChange}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Modelo</InputLabel>
            <Select
              name="model"
              value={settings.model}
              onChange={handleSettingChange}
              label="Modelo"
            >
              <MenuItem value="gpt-4o-mini">GPT-4o Mini</MenuItem>
              <MenuItem value="gpt-4o">GPT-4o</MenuItem>
              <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Máximo de Tokens"
            type="number"
            name="maxTokens"
            value={settings.maxTokens}
            onChange={handleSettingChange}
            margin="normal"
            inputProps={{ min: 100, max: 4000, step: 100 }}
          />
          
          <TextField
            fullWidth
            label="Temperatura"
            type="number"
            name="temperature"
            value={settings.temperature}
            onChange={handleSettingChange}
            margin="normal"
            inputProps={{ min: 0, max: 1, step: 0.1 }}
            helperText="Valores mais baixos são mais determinísticos, valores mais altos são mais criativos"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Personalidade</InputLabel>
            <Select
              name="personalityLevel"
              value={settings.personalityLevel}
              onChange={handleSettingChange}
              label="Personalidade"
            >
              <MenuItem value="formal">Formal</MenuItem>
              <MenuItem value="equilibrado">Equilibrado</MenuItem>
              <MenuItem value="amigavel">Amigável</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
            Estas configurações determinam como a LUZ IA irá interagir com os usuários. Ajuste-as para encontrar o equilíbrio ideal entre precisão e criatividade nas respostas.
          </Typography>
          
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSettings}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Salvar Configurações
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderKnowledgeBase = () => (
    <>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Base de Conhecimento
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RefreshIcon />}
              onClick={handleResetKnowledgeBase}
              sx={{ mr: 1 }}
            >
              Reprocessar
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddFileDialogOpen}
            >
              Adicionar Arquivo
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {knowledgeBase.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            Nenhum arquivo na base de conhecimento
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={3}>
          <List>
            {knowledgeBase.map((file) => (
              <React.Fragment key={file.id}>
                <ListItem>
                  <ListItemIcon>
                    {file.type === 'pdf' && <PsychologyIcon />}
                    {(file.type === 'document' || file.type === 'docx') && <QuestionAnswerIcon />}
                    {(file.type === 'text' || file.type === 'txt') && <ChatBubbleIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {file.description} • {file.size} • Adicionado em: {file.uploaded}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip 
                            size="small" 
                            label={file.status === 'processed' ? 'Processado' : 'Processando'} 
                            color={file.status === 'processed' ? 'success' : 'warning'}
                          />
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleDeleteFile(file.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Diálogo para upload de arquivo */}
      <Dialog open={openAddFileDialog} onClose={handleAddFileDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Arquivo à Base de Conhecimento</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="textSecondary" paragraph>
              Adicione documentos à base de conhecimento da LUZ IA para melhorar suas respostas. 
              Os formatos suportados são PDF, DOCX e TXT.
            </Typography>
            
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2, py: 1.5 }}
            >
              {fileToUpload ? fileToUpload.name : 'Selecionar Arquivo'}
              <input
                type="file"
                hidden
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelection}
              />
            </Button>
            
            <TextField
              fullWidth
              label="Descrição do Arquivo"
              multiline
              rows={3}
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              margin="normal"
              placeholder="Descreva brevemente o conteúdo deste arquivo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddFileDialogClose} color="inherit">Cancelar</Button>
          <Button
            onClick={handleUploadFile}
            color="primary"
            variant="contained"
            disabled={uploadingFile || !fileToUpload}
            startIcon={uploadingFile ? <CircularProgress size={20} /> : null}
          >
            {uploadingFile ? 'Enviando...' : 'Enviar Arquivo'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const renderConversationHistory = () => (
    <>
      <Paper elevation={3} sx={{ mb: 3 }}>
        <List>
          {conversations.length === 0 ? (
            <ListItem>
              <ListItemText primary="Nenhuma conversa encontrada" />
            </ListItem>
          ) : (
            conversations.map((conv) => (
              <React.Fragment key={conv.id}>
                <ListItem button onClick={() => handleViewConversation(conv)}>
                  <ListItemIcon>
                    <ChatBubbleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">{conv.user}</Typography>
                        <Typography variant="body2" color="textSecondary">{conv.date}</Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          {conv.preview}
                        </Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                          <Chip size="small" label={conv.topic} />
                          <Typography variant="body2" color="textSecondary">
                            {conv.messages} mensagens
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
      
      {/* Diálogo para visualizar conversa */}
      <Dialog open={openConversationDialog} onClose={handleCloseConversationDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Conversa com {selectedConversation?.user}
          <Typography variant="body2" color="textSecondary">
            {selectedConversation?.date} • {selectedConversation?.messages} mensagens • {selectedConversation?.topic}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            Os detalhes completos da conversa seriam exibidos aqui...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConversationDialog} color="primary">Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const renderMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Estatísticas Gerais</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body1">Total de Conversas:</Typography>
            <Typography variant="body1" fontWeight="bold">{metrics.totalConversations}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body1">Total de Mensagens:</Typography>
            <Typography variant="body1" fontWeight="bold">{metrics.totalMessages}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body1">Média de Mensagens por Conversa:</Typography>
            <Typography variant="body1" fontWeight="bold">{metrics.averageMessagesPerConversation}</Typography>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Usuários Mais Ativos</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <List dense>
            {metrics.mostActiveUsers.map((user, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={user.name}
                  secondary={`${user.conversations} conversas`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Tópicos Populares</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {metrics.popularTopics.map((topic, index) => (
              <Chip
                key={index}
                label={`${topic.topic}: ${topic.count}`}
                color="primary"
                variant={index === 0 ? "filled" : "outlined"}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Gerenciamento da LUZ IA
      </Typography>
      
      {renderTabs()}
      
      {loading && tabValue !== 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 && renderSettings()}
          {tabValue === 1 && renderKnowledgeBase()}
          {tabValue === 2 && renderConversationHistory()}
          {tabValue === 3 && renderMetrics()}
        </>
      )}
    </Box>
  );
};

export default LuzIAManagement;
