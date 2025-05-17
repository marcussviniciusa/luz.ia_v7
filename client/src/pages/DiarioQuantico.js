import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  CircularProgress, 
  Divider,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Rating
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Celebration as CelebrationIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  Psychology as PsychologyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Today as TodayIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AuthContext } from '../contexts/AuthContext';
import { SnackbarContext } from '../contexts/SnackbarContext';
import { styled } from '@mui/material/styles';

// Componentes estilizados
const DiaryCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 2,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },
}));

const EmotionRating = styled(Rating)(({ theme }) => ({
  '& .MuiRating-iconFilled': {
    color: theme.palette.primary.main,
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.18)',
  },
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
}));

function DiarioQuantico() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useContext(SnackbarContext);

  // Estados
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEntries: 0,
    currentStreak: 0,
    emotionalProgress: 0,
    entriesLast30Days: 0,
    consistencyRate: 0
  });

  // Estados do formulário
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD simples
    estadoEmocional: '',
    avaliacaoEmocional: 3,
    pensamentosPredominantes: '',
    vitoriasDoDia: '',
    gratidoes: '',
    objetivos: '',
    observacoes: ''
  });

  // Opções para estado emocional
  const estadosEmocionais = [
    'Radiante',
    'Feliz',
    'Satisfeito',
    'Neutro',
    'Ansioso',
    'Triste',
    'Frustrado',
    'Estressado',
    'Outro'
  ];

  // Carregar entradas do diário
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        // Buscar entradas
        const response = await axios.get('/api/diario');
        
        if (response.data.success) {
          setEntries(response.data.data);
        } else {
          showError('Erro ao carregar entradas do diário.');
        }
        
        // Buscar estatísticas
        const statsResponse = await axios.get('/api/diario/stats');
        if (statsResponse.data.success) {
          // Garantir que temos todos os valores mesmo se o backend não enviar algum
          setStats({
            totalEntries: 0,
            currentStreak: 0,
            emotionalProgress: 0,
            entriesLast30Days: 0,
            consistencyRate: 0,
            ...statsResponse.data.data
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar entradas do diário:', error);
        showError('Não foi possível carregar suas entradas. Tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    fetchEntries();
  }, [showError]);
  
  // Abrir modal de criação
  const handleOpenCreate = () => {
    // Resetar formulário
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      estadoEmocional: '',
      avaliacaoEmocional: 3,
      pensamentosPredominantes: '',
      vitoriasDoDia: '',
      gratidoes: '',
      objetivos: '',
      observacoes: ''
    });
    
    setActiveEntry(null);
    setIsEditing(false);
    setOpenDialog(true);
  };
  
  // Abrir modal de edição
  const handleOpenEdit = (entry) => {
    setFormData({
      date: format(new Date(entry.date), 'yyyy-MM-dd'),
      estadoEmocional: entry.estadoEmocional || '',
      avaliacaoEmocional: entry.avaliacaoEmocional || 3,
      pensamentosPredominantes: entry.pensamentosPredominantes || '',
      vitoriasDoDia: entry.pequenasVitorias || '',         // Mapeado do banco de dados
      gratidoes: entry.gratidao || '',                     // Mapeado do banco de dados
      objetivos: entry.objetivosProximoDia || '',          // Mapeado do banco de dados
      observacoes: entry.insights || ''                     // Mapeado do banco de dados
    });
    
    setActiveEntry(entry);
    setIsEditing(true);
    setOpenDialog(true);
  };
  
  // Fechar modal
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Gerenciar alterações do formulário
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gerenciar alteração de rating
  const handleRatingChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      avaliacaoEmocional: newValue
    }));
  };
  
  // Enviar formulário
  const handleSubmit = async () => {
    // Validar campos obrigatórios
    if (!formData.estadoEmocional) {
      showError('Por favor, informe seu estado emocional.');
      return;
    }

    if (!formData.vitoriasDoDia) {
      showError('Por favor, registre suas pequenas vitórias do dia.');
      return;
    }

    if (!formData.objetivos) {
      showError('Por favor, defina seus objetivos para o próximo dia.');
      return;
    }
    
    setFormLoading(true);
    
    try {
      // Criar um objeto Date a partir da data selecionada no formulário
      // Definimos a hora para meio-dia (12:00) para evitar problemas de fuso horário
      const dateParts = formData.date.split('-'); // formato YYYY-MM-DD
      // Criamos uma data com os componentes individuais
      // Meses em JavaScript são indexados de 0-11, por isso subtraímos 1 do mês
      const selectedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);
      
      // Mapear os campos do formulário para os nomes esperados pelo backend
      const mappedData = {
        date: selectedDate, // Objeto Date com hora 12:00
        estadoEmocional: formData.estadoEmocional,
        pensamentosPredominantes: formData.pensamentosPredominantes,
        pequenasVitorias: formData.vitoriasDoDia,          // Mapear vitoriasDoDia para pequenasVitorias
        objetivosProximoDia: formData.objetivos,           // Mapear objetivos para objetivosProximoDia
        gratidao: formData.gratidoes,                      // Mapear gratidoes para gratidao
        insights: formData.observacoes,                    // Mapear observacoes para insights
        avaliacaoEmocional: formData.avaliacaoEmocional    // Adicionar avaliacao emocional (estrelas)
      };

      let response;
      
      if (isEditing && activeEntry) {
        // Editar entrada existente
        response = await axios.put(`/api/diario/${activeEntry._id}`, mappedData);
        
        if (response.data.success) {
          // Atualizar lista de entradas
          setEntries(prev => 
            prev.map(entry => 
              entry._id === activeEntry._id ? response.data.data : entry
            )
          );
          
          showSuccess('Entrada atualizada com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao atualizar entrada.');
        }
      } else {
        // Criar nova entrada
        response = await axios.post('/api/diario', mappedData);
        
        if (response.data.success) {
          // Adicionar nova entrada à lista
          setEntries(prev => [response.data.data, ...prev]);
          
          // Atualizar estatísticas
          const statsResponse = await axios.get('/api/diario/stats');
          if (statsResponse.data.success) {
            setStats({
              totalEntries: 0,
              currentStreak: 0,
              emotionalProgress: 0,
              entriesLast30Days: 0,
              consistencyRate: 0,
              ...statsResponse.data.data
            });
          }
          
          showSuccess('Entrada criada com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao criar entrada.');
        }
      }
      
      // Fechar modal
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      showError('Ocorreu um erro ao salvar sua entrada. Tente novamente mais tarde.');
    } finally {
      setFormLoading(false);
    }
  };
  
  // Excluir entrada
  const handleDelete = async (entryId) => {
    if (window.confirm('Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.')) {
      try {
        const response = await axios.delete(`/api/diario/${entryId}`);
        
        if (response.data.success) {
          // Remover entrada da lista
          setEntries(prev => prev.filter(entry => entry._id !== entryId));
          
          // Atualizar estatísticas
          const statsResponse = await axios.get('/api/diario/stats');
          if (statsResponse.data.success) {
            setStats({
              totalEntries: 0,
              currentStreak: 0,
              emotionalProgress: 0,
              entriesLast30Days: 0,
              consistencyRate: 0,
              ...statsResponse.data.data
            });
          }
          
          showSuccess('Entrada excluída com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao excluir entrada.');
        }
      } catch (error) {
        console.error('Erro ao excluir entrada:', error);
        showError('Ocorreu um erro ao excluir sua entrada. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Diário Quântico
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Registre seus pensamentos, emoções e celebre suas pequenas vitórias diárias.
        </Typography>
      </Box>
      
      {/* Estatísticas */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Total de Entradas
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TodayIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {stats.totalEntries || 0}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Sequência Atual
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CelebrationIcon color="secondary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {stats.currentStreak || 0} dias
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Progresso Emocional
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmojiEmotionsIcon sx={{ mr: 1, fontSize: 28, color: '#4caf50' }} />
                <Typography variant="h4" sx={{ color: stats.emotionalProgress >= 0 ? '#4caf50' : '#f44336' }} fontWeight="bold">
                  {stats.emotionalProgress > 0 ? '+' : ''}{stats.emotionalProgress || 0}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Lista de entradas */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : entries.length === 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderRadius: 3,
            border: '1px dashed rgba(0,0,0,0.1)'
          }}
        >
          <PsychologyIcon sx={{ fontSize: 60, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Você ainda não possui entradas no Diário Quântico
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Comece a registrar seus pensamentos, emoções e vitórias clicando no botão abaixo.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Criar Primeira Entrada
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {entries.map((entry) => (
            <Grid item xs={12} sm={6} md={4} key={entry._id}>
              <DiaryCard>
                <CardContent>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {/* Exibir a data no formato DD/MM/YYYY */}
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </Typography>
                    
                    <Box>
                      <EmotionRating
                        value={entry.avaliacaoEmocional || 3}
                        readOnly
                        icon={<StarIcon fontSize="inherit" />}
                        emptyIcon={<StarBorderIcon fontSize="inherit" />}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Estado Emocional:
                    </Typography>
                    <Typography variant="body1">
                      {entry.estadoEmocional}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pensamentos Predominantes:
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {entry.pensamentosPredominantes || 'Nenhum registro'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Vitórias do Dia:
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {entry.pequenasVitorias || 'Nenhum registro'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Objetivos para o Próximo Dia:
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {entry.objetivosProximoDia || 'Nenhum registro'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Gratidão:
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {entry.gratidao || 'Nenhum registro'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Insights:
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {entry.insights || 'Nenhum registro'}
                    </Typography>
                  </Box>
                </CardContent>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Tooltip title="Editar">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenEdit(entry)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Excluir">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(entry._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </DiaryCard>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Modal de criação/edição */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {isEditing ? 'Editar Entrada' : 'Nova Entrada'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="estado-emocional-label">
                  Estado Emocional
                </InputLabel>
                <Select
                  labelId="estado-emocional-label"
                  name="estadoEmocional"
                  value={formData.estadoEmocional}
                  onChange={handleFormChange}
                  label="Estado Emocional"
                  startAdornment={
                    <InputAdornment position="start">
                      <EmojiEmotionsIcon color="primary" />
                    </InputAdornment>
                  }
                >
                  {estadosEmocionais.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      {estado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Avaliação do seu estado emocional:
                </Typography>
                <EmotionRating
                  name="avaliacaoEmocional"
                  value={formData.avaliacaoEmocional}
                  onChange={handleRatingChange}
                  icon={<StarIcon fontSize="large" />}
                  emptyIcon={<StarBorderIcon fontSize="large" />}
                  size="large"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pensamentos Predominantes"
                name="pensamentosPredominantes"
                value={formData.pensamentosPredominantes}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={3}
                placeholder="Descreva seus pensamentos predominantes do dia..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PsychologyIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vitórias do Dia"
                name="vitoriasDoDia"
                value={formData.vitoriasDoDia}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={3}
                placeholder="Registre suas pequenas ou grandes conquistas..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CelebrationIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Gratidões"
                name="gratidoes"
                value={formData.gratidoes}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={3}
                placeholder="Por quais coisas você é grato hoje?"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Objetivos"
                name="objetivos"
                value={formData.objetivos}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={2}
                placeholder="Quais são seus objetivos para amanhã?"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações Adicionais"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={2}
                placeholder="Alguma observação adicional que deseja registrar?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            disabled={formLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {formLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Botão flutuante para adicionar */}
      {!loading && entries.length > 0 && (
        <StyledFab 
          color="primary" 
          aria-label="add"
          onClick={handleOpenCreate}
        >
          <AddIcon />
        </StyledFab>
      )}
    </Box>
  );
}

export default DiarioQuantico;
