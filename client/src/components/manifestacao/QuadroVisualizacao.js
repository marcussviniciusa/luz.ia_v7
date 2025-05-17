import React, { useState, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Fab,
  Tooltip,
  Zoom,
  Slide,
  Grow,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon
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

const VisualCard = styled(Card)(({ theme }) => ({
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

const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.light}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
}));

function QuadroVisualizacao({ quadros = [] }) {
  const theme = useTheme();
  const { showSuccess, showError } = useContext(SnackbarContext);
  
  // Estados
  const [openDialog, setOpenDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentQuadro, setCurrentQuadro] = useState(null);
  const [localQuadros, setLocalQuadros] = useState(quadros);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    afirmacao: ''
  });
  
  // Abrir modal para criar novo quadro
  const handleOpenCreate = () => {
    setFormData({
      titulo: '',
      descricao: '',
      afirmacao: ''
    });
    setSelectedFile(null);
    setImagePreview('');
    setCurrentQuadro(null);
    setOpenDialog(true);
  };
  
  // Abrir modal para editar quadro existente
  const handleOpenEdit = (quadro) => {
    setFormData({
      titulo: quadro.titulo || '',
      descricao: quadro.descricao || '',
      afirmacao: quadro.afirmacao || ''
    });
    setSelectedFile(null);
    setImagePreview(quadro.imagemUrl || '');
    setCurrentQuadro(quadro);
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
  
  // Gerenciar seleção de arquivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Função para clicar no input de arquivo
  const triggerFileInput = () => {
    document.getElementById('quadro-imagem').click();
  };
  
  // Enviar formulário
  const handleSubmit = async () => {
    // Validar campos obrigatórios
    if (!formData.titulo) {
      showError('Por favor, adicione um título para o quadro.');
      return;
    }
    
    if (!imagePreview && !selectedFile) {
      showError('Por favor, selecione uma imagem para o quadro.');
      return;
    }
    
    setFormLoading(true);
    
    try {
      // Preparar FormData para upload
      const formPayload = new FormData();
      
      // Adicionar campos de texto (importante: todos os valores devem ser strings)
      formPayload.append('titulo', formData.titulo || '');
      formPayload.append('descricao', formData.descricao || '');
      formPayload.append('afirmacao', formData.afirmacao || '');
      
      // Adicionar campo de tipo explicitamente (sempre precisa existir)
      formPayload.append('tipo', 'quadro');
      
      // Log para debug
      console.log('FormData criado com os seguintes campos:');
      for (let pair of formPayload.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      // Apenas adicionar arquivo se um novo foi selecionado
      if (selectedFile) {
        formPayload.append('imagem', selectedFile);
      }
      
      let response;
      
      if (currentQuadro) {
        // Editar quadro existente usando a rota principal
        response = await axios.put(`/api/manifestacao/${currentQuadro._id}`, formPayload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          // Atualizar lista de quadros
          setLocalQuadros(prev => 
            prev.map(q => 
              q._id === currentQuadro._id ? response.data.data : q
            )
          );
          
          showSuccess('Quadro atualizado com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao atualizar quadro.');
        }
      } else {
        // Criar novo quadro usando a rota principal
        response = await axios.post('/api/manifestacao', formPayload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          // Adicionar novo quadro à lista
          setLocalQuadros(prev => [...prev, response.data.data]);
          
          showSuccess('Quadro criado com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao criar quadro.');
        }
      }
      
      // Fechar modal
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar quadro:', error);
      showError('Ocorreu um erro ao salvar seu quadro. Tente novamente mais tarde.');
    } finally {
      setFormLoading(false);
    }
  };
  
  // Excluir quadro
  const handleDelete = async (quadroId) => {
    if (window.confirm('Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita.')) {
      try {
        // Usar a rota principal para excluir o quadro
        const response = await axios.delete(`/api/manifestacao/${quadroId}`);
        
        if (response.data.success) {
          // Remover quadro da lista
          setLocalQuadros(prev => prev.filter(q => q._id !== quadroId));
          
          showSuccess('Quadro excluído com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao excluir quadro.');
        }
      } catch (error) {
        console.error('Erro ao excluir quadro:', error);
        showError('Ocorreu um erro ao excluir seu quadro. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <Box>
      {/* Descrição */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quadro de Visualização
        </Typography>
        <Typography variant="body1" paragraph>
          Crie seu quadro de visualização digital com imagens e afirmações que representam seus desejos e objetivos.
          Visualize diariamente para programar sua mente subconsciente e atrair aquilo que deseja manifestar.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dica: Escolha imagens que despertem emoções positivas e escreva afirmações no tempo presente.
        </Typography>
      </Paper>
      
      {/* Lista de quadros */}
      {localQuadros.length === 0 ? (
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
          <ImageIcon sx={{ fontSize: 60, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Você ainda não possui quadros de visualização
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Crie seu primeiro quadro clicando no botão abaixo.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Criar Primeiro Quadro
          </Button>
        </Paper>
      ) : (
        <Box>
          <Grid container spacing={3}>
            {localQuadros.map((quadro) => (
              <Grid item xs={12} sm={6} md={4} key={quadro._id}>
                <Grow in={true} timeout={500}>
                  <VisualCard>
                    <CardMedia
                      component="img"
                      height="200"
                      image={(quadro.imagens && quadro.imagens.length > 0 && quadro.imagens[0].path) ? quadro.imagens[0].path : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTk5OTk5IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5RdWFkcm8gZGUgVmlzdWFsaXphw6fDo288L3RleHQ+PC9zdmc+'}
                      alt={quadro.titulo}
                      onError={(e) => {
                        // Tratar erro de carregamento da imagem
                        console.error(`Erro ao carregar imagem do quadro ${quadro._id}`);
                        console.log('URL da imagem com erro:', e.target.src);
                        // Usar uma imagem em base64 como fallback
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmZjk5OTkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmZmZmIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW0gbsOjbyBkaXNwb27DrXZlbDwvdGV4dD48L3N2Zz4=';
                      }}
                      sx={{ bgcolor: 'rgba(0, 0, 0, 0.08)' }} // Fundo claro para imagens que não carregarem
                    />
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {quadro.titulo}
                      </Typography>
                      
                      {quadro.descricao && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {quadro.descricao}
                        </Typography>
                      )}
                      
                      {/* Exibir a primeira afirmação do array afirmacoes ou o campo afirmacao diretamente (compatibilidade) */}
                      {(quadro.afirmacoes && quadro.afirmacoes.length > 0) ? (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontStyle: 'italic', 
                            color: theme.palette.primary.main,
                            fontWeight: 'medium',
                            mt: 1
                          }}
                        >
                          "{quadro.afirmacoes[0].texto}"
                        </Typography>
                      ) : quadro.afirmacao ? (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontStyle: 'italic', 
                            color: theme.palette.primary.main,
                            fontWeight: 'medium',
                            mt: 1
                          }}
                        >
                          "{quadro.afirmacao}"
                        </Typography>
                      ) : null}
                    </CardContent>
                    
                    <Box sx={{ p: 2, mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Editar">
                        <IconButton 
                          color="primary"
                          onClick={() => handleOpenEdit(quadro)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Excluir">
                        <IconButton 
                          color="error"
                          onClick={() => handleDelete(quadro._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </VisualCard>
                </Grow>
              </Grid>
            ))}
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
              {currentQuadro ? 'Editar Quadro' : 'Novo Quadro de Visualização'}
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
              <TextField
                fullWidth
                label="Afirmação Positiva (opcional)"
                name="afirmacao"
                value={formData.afirmacao}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={2}
                placeholder="Ex: Eu sou merecedor(a) de abundância e prosperidade."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Imagem do Quadro
              </Typography>
              
              <input
                accept="image/*"
                id="quadro-imagem"
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              {!imagePreview ? (
                <UploadBox onClick={triggerFileInput}>
                  <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body1" gutterBottom>
                    Clique para selecionar uma imagem
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Formatos suportados: JPG, PNG, GIF
                  </Typography>
                </UploadBox>
              ) : (
                <Box sx={{ position: 'relative', mt: 2 }}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      width: '100%', 
                      borderRadius: theme.shape.borderRadius,
                      maxHeight: '300px',
                      objectFit: 'cover'
                    }} 
                  />
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8,
                    display: 'flex',
                    gap: 1
                  }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={triggerFileInput}
                    >
                      Alterar
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview('');
                      }}
                    >
                      Remover
                    </Button>
                  </Box>
                </Box>
              )}
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

export default QuadroVisualizacao;
