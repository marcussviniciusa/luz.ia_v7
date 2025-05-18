import React, { useState, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Fab,
  Tooltip,
  Divider,
  Card,
  CardContent,
  CardActions,
  useTheme,
  Collapse,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  FormatListBulleted as FormatListCheckedIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import { SnackbarContext } from '../../contexts/SnackbarContext';

// Componentes estilizados
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

const ListaCard = styled(Card)(({ theme }) => ({
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
}));

const ProgressBar = styled(Box)(({ theme, value = 0 }) => ({
  position: 'relative',
  height: '6px',
  width: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  borderRadius: '3px',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${value}%`,
    backgroundColor: value === 100 ? theme.palette.success.main : theme.palette.primary.main,
    transition: 'width 0.5s ease',
  },
}));

function ListaManifestacao({ listas = [] }) {
  const theme = useTheme();
  const { showSuccess, showError } = useContext(SnackbarContext);
  
  // Estados
  const [openDialog, setOpenDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [currentLista, setCurrentLista] = useState(null);
  const [localListas, setLocalListas] = useState(listas);
  const [expandedId, setExpandedId] = useState(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    itens: []
  });
  
  // Estado para item temporário
  const [novoItem, setNovoItem] = useState('');
  
  // Abrir modal para criar nova lista
  const handleOpenCreate = () => {
    setFormData({
      titulo: '',
      descricao: '',
      itens: []
    });
    setNovoItem('');
    setCurrentLista(null);
    setOpenDialog(true);
  };
  
  // Abrir modal para editar lista existente
  const handleOpenEdit = (lista) => {
    setFormData({
      titulo: lista.titulo || '',
      descricao: lista.descricao || '',
      itens: lista.passos ? lista.passos.map(p => ({
        texto: p.descricao,
        completo: p.concluido
      })) : []
    });
    setNovoItem('');
    setCurrentLista(lista);
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
  
  // Adicionar novo item à lista
  const handleAddItem = () => {
    if (!novoItem.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, { texto: novoItem.trim(), completo: false }]
    }));
    
    setNovoItem('');
  };
  
  // Remover item da lista
  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };
  
  // Alternar estado de completude do item
  const handleToggleItemStatus = (index) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map((item, i) => 
        i === index ? { ...item, completo: !item.completo } : item
      )
    }));
  };
  
  // Enviar formulário
  const handleSubmit = async () => {
    // Validação
    if (!formData.titulo) {
      showError('Por favor, adicione um título');
      return;
    }
    
    setFormLoading(true);
    
    // Dados para enviar
    const listaData = {
      titulo: formData.titulo,
      descricao: formData.descricao,
      tipo: 'checklist',
      // Converter itens para formato compatível com o modelo de passos
      passos: formData.itens.map(item => ({
        descricao: item.texto,
        concluido: item.completo
      }))
    };
    
    try {
      // Obter token
      const token = localStorage.getItem('token');
      
      // Configuração de autorização
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      };
      
      let response;
      
      if (currentLista) {
        // Atualizar lista existente
        response = await axios.put(`/api/manifestacao/${currentLista._id}`, listaData, config);
        
        if (response.data.success) {
          // Atualizar lista de manifestações
          setLocalListas(prev => 
            prev.map(l => 
              l._id === currentLista._id ? response.data.data : l
            )
          );
          showSuccess('Lista atualizada com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao atualizar lista.');
        }
      } else {
        // Criar nova lista
        response = await axios.post('/api/manifestacao', listaData, config);
        
        if (response.data.success) {
          // Adicionar nova lista
          setLocalListas(prev => [...prev, response.data.data]);
          
          showSuccess('Lista criada com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao criar lista.');
        }
      }
      
      // Fechar modal
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar lista:', error);
      showError('Ocorreu um erro ao salvar sua lista. Tente novamente mais tarde.');
    } finally {
      setFormLoading(false);
    }
  };
  
  // Excluir lista
  const handleDelete = async (listaId) => {
    if (window.confirm('Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita.')) {
      try {
        // Usar a rota principal para excluir a lista
        const response = await axios.delete(`/api/manifestacao/${listaId}`);
        
        if (response.data.success) {
          // Remover lista
          setLocalListas(prev => prev.filter(l => l._id !== listaId));
          
          showSuccess('Lista excluída com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao excluir lista.');
        }
      } catch (error) {
        console.error('Erro ao excluir lista:', error);
        showError('Ocorreu um erro ao excluir sua lista. Tente novamente mais tarde.');
      }
    }
  };
  
  // Atualizar status de passo
  const handleUpdatePassoStatus = async (listaId, passoIndex, novoStatus) => {
    try {
      // Encontrar lista
      const listaAtual = localListas.find(l => l._id === listaId);
      
      if (!listaAtual || !listaAtual.passos || !listaAtual.passos[passoIndex]) {
        console.error('Passo não encontrado');
        return;
      }
      
      // IMPORTANTE: Atualizar visualmente a interface ANTES de chamar a API
      // para fornecer feedback imediato ao usuário
      setLocalListas(prev => 
        prev.map(lista => {
          if (lista._id === listaId) {
            const novosPassos = [...lista.passos];
            novosPassos[passoIndex] = { 
              ...novosPassos[passoIndex], 
              concluido: novoStatus 
            };
            return { ...lista, passos: novosPassos };
          }
          return lista;
        })
      );
      
      // Criar dados para atualizar o passo
      const passoData = {
        descricao: listaAtual.passos[passoIndex].descricao,
        concluido: novoStatus,
        dataLimite: listaAtual.passos[passoIndex].dataLimite
      };
      
      // Chamar a API para persistir a mudança no servidor
      const response = await axios.put(`/api/manifestacao/${listaId}/passo/${listaAtual.passos[passoIndex]._id}`, passoData);
      
      // Se a API falhar, reverter a mudança visual
      if (!response.data.success) {
        showError(response.data.message || 'Erro ao atualizar item.');
        
        // Reverter a alteração feita anteriormente
        setLocalListas(prev => 
          prev.map(lista => {
            if (lista._id === listaId) {
              const novosPassos = [...lista.passos];
              novosPassos[passoIndex] = { 
                ...novosPassos[passoIndex], 
                concluido: !novoStatus // Volta ao estado anterior
              };
              return { ...lista, passos: novosPassos };
            }
            return lista;
          })
        );
      }
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error);
      showError('Ocorreu um erro ao atualizar o item. Tente novamente mais tarde.');
    }
  };
  
  // Calcular progresso
  const calcularProgresso = (passos) => {
    if (!passos || passos.length === 0) return 0;
    
    const completados = passos.filter(passo => passo.concluido).length;
    return Math.round((completados / passos.length) * 100);
  };
  
  // Alternar expansão da lista
  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  return (
    <Box>
      {/* Descrição */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Lista de Manifestação
        </Typography>
        <Typography variant="body1" paragraph>
          Crie listas com afirmações, objetivos e passos para sua manifestação.
          Acompanhe seu progresso e celebre cada conquista alcançada.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dica: Divida seus objetivos em passos menores e específicos. Celebre cada etapa concluída.
        </Typography>
      </Paper>
      
      {/* Lista de manifestações */}
      {localListas.length === 0 ? (
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
          <FormatListCheckedIcon sx={{ fontSize: 60, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Você ainda não possui listas de manifestação
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Crie sua primeira lista clicando no botão abaixo.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Criar Primeira Lista
          </Button>
        </Paper>
      ) : (
        <Box>
          <Grid container spacing={3}>
            {localListas.map((lista) => {
              const progresso = calcularProgresso(lista.passos);
              const isExpanded = expandedId === lista._id;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={lista._id}>
                  <ListaCard>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {lista.titulo}
                        </Typography>
                        
                        <Chip 
                          label={`${progresso}%`}
                          color={progresso === 100 ? "success" : "primary"}
                          size="small"
                          variant={progresso === 100 ? "filled" : "outlined"}
                        />
                      </Box>
                      
                      <ProgressBar value={progresso} />
                      
                      {lista.descricao && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                          {lista.descricao}
                        </Typography>
                      )}
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <List dense>
                        {/* Mostrar 3 primeiros itens, ou todos se expandido */}
                        {(lista.passos ? lista.passos
                          .slice(0, isExpanded ? lista.passos.length : 3)
                          : []).map((passo, index) => (
                            <ListItem
                              key={index}
                              dense
                              button
                              onClick={() => handleUpdatePassoStatus(lista._id, index, !passo.concluido)}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {passo.concluido ? (
                                  <CheckCircleIcon color="success" />
                                ) : (
                                  <RadioButtonUncheckedIcon color="action" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={passo.descricao}
                                primaryTypographyProps={{
                                  style: {
                                    textDecoration: passo.concluido ? 'line-through' : 'none',
                                    color: passo.concluido ? theme.palette.text.secondary : 'inherit'
                                  }
                                }}
                              />
                            </ListItem>
                          ))}
                        
                        {/* Botão para expandir/colapsar se houver mais de 3 itens */}
                        {lista.passos && lista.passos.length > 3 && (
                          <ListItem 
                            button 
                            onClick={() => handleToggleExpand(lista._id)}
                            sx={{ justifyContent: 'center', py: 0 }}
                          >
                            <Typography 
                              variant="body2" 
                              color="primary"
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                fontSize: '0.8rem'
                              }}
                            >
                              {isExpanded ? (
                                <>Mostrar menos <ExpandLessIcon fontSize="small" /></>
                              ) : (
                                <>Ver todos os {lista.itens.length} itens <ExpandMoreIcon fontSize="small" /></>
                              )}
                            </Typography>
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                    
                    <Box sx={{ flexGrow: 1 }} />
                    
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                      <Tooltip title="Editar">
                        <IconButton 
                          color="primary"
                          onClick={() => handleOpenEdit(lista)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Excluir">
                        <IconButton 
                          color="error"
                          onClick={() => handleDelete(lista._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </ListaCard>
                </Grid>
              );
            })}
          </Grid>
          
          {/* Botão flutuante para adicionar */}
          <StyledFab 
            color="primary" 
            aria-label="add"
            onClick={handleOpenCreate}
          >
            <AddIcon />
          </StyledFab>
        </Box>
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
              {currentLista ? 'Editar Lista' : 'Nova Lista de Manifestação'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                name="titulo"
                value={formData.titulo}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição (opcional)"
                name="descricao"
                value={formData.descricao}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Itens da Lista
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Novo Item"
                  value={novoItem}
                  onChange={(e) => setNovoItem(e.target.value)}
                  variant="outlined"
                  placeholder="Ex: Eu sou grato por toda abundância em minha vida"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                />
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleAddItem}
                  disabled={!novoItem.trim()}
                  sx={{ ml: 1, whiteSpace: 'nowrap' }}
                >
                  Adicionar
                </Button>
              </Box>
              
              <Paper variant="outlined" sx={{ maxHeight: '300px', overflow: 'auto' }}>
                <List>
                  {formData.itens.length === 0 ? (
                    <ListItem>
                      <ListItemText
                        primary="Nenhum item adicionado"
                        primaryTypographyProps={{ color: 'text.secondary', align: 'center' }}
                      />
                    </ListItem>
                  ) : (
                    formData.itens.map((item, index) => (
                      <ListItem key={index} divider={index < formData.itens.length - 1}>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={item.completo}
                            onChange={() => handleToggleItemStatus(index)}
                            color="primary"
                          />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.texto}
                          primaryTypographyProps={{
                            style: {
                              textDecoration: item.completo ? 'line-through' : 'none'
                            }
                          }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteIcon color="error" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))
                  )}
                </List>
              </Paper>
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
    </Box>
  );
}

export default ListaManifestacao;
