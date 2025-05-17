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
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Fab,
  Tooltip,
  useTheme,
  Avatar,
  Grow,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flare as FlareIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
  ColorLens as ColorLensIcon
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

const SimboloCard = styled(Card)(({ theme }) => ({
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

const ColorCircle = styled(Box)(({ theme, color }) => ({
  width: '25px',
  height: '25px',
  borderRadius: '50%',
  backgroundColor: color || '#e0e0e0',
  cursor: 'pointer',
  border: '2px solid white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  }
}));

function SimbolosManifestacao({ simbolos = [] }) {
  const theme = useTheme();
  const { showSuccess, showError } = useContext(SnackbarContext);
  
  // Estados
  const [openDialog, setOpenDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentSimbolo, setCurrentSimbolo] = useState(null);
  const [localSimbolos, setLocalSimbolos] = useState(simbolos);
  
  // Cores sugeridas
  const suggestedColors = [
    '#4CAF50', // Verde
    '#2196F3', // Azul
    '#9C27B0', // Roxo
    '#F44336', // Vermelho
    '#FF9800', // Laranja
    '#FFEB3B', // Amarelo
    '#795548', // Marrom
    '#607D8B'  // Azul acinzentado
  ];
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    significado: '',
    cor: '#4CAF50',
    palavrasChave: ''
  });
  
  // Abrir modal para criar novo símbolo
  const handleOpenCreate = () => {
    setFormData({
      nome: '',
      significado: '',
      cor: '#4CAF50',
      palavrasChave: ''
    });
    setSelectedFile(null);
    setImagePreview('');
    setCurrentSimbolo(null);
    setOpenDialog(true);
  };
  
  // Abrir modal para editar símbolo existente
  const handleOpenEdit = (simbolo) => {
    setFormData({
      nome: simbolo.nome || '',
      significado: simbolo.significado || '',
      cor: simbolo.cor || '#4CAF50',
      palavrasChave: simbolo.palavrasChave ? simbolo.palavrasChave.join(', ') : ''
    });
    setSelectedFile(null);
    setImagePreview(simbolo.imagemUrl || '');
    setCurrentSimbolo(simbolo);
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
    document.getElementById('simbolo-imagem').click();
  };
  
  // Selecionar cor
  const handleSelectColor = (cor) => {
    setFormData(prev => ({
      ...prev,
      cor
    }));
  };
  
  // Enviar formulário
  const handleSubmit = async () => {
    // Validar campos obrigatórios
    if (!formData.nome) {
      showError('Por favor, adicione um nome para o símbolo.');
      return;
    }
    
    if (!imagePreview && !selectedFile) {
      showError('Por favor, selecione uma imagem para o símbolo.');
      return;
    }
    
    setFormLoading(true);
    
    try {
      // Transformar palavras-chave em array
      const palavrasChaveArray = formData.palavrasChave
        .split(',')
        .map(palavra => palavra.trim())
        .filter(palavra => palavra.length > 0);
      
      // Preparar FormData para upload
      const formPayload = new FormData();
      formPayload.append('nome', formData.nome);
      formPayload.append('significado', formData.significado);
      formPayload.append('cor', formData.cor);
      formPayload.append('palavrasChave', JSON.stringify(palavrasChaveArray));
      
      // Apenas adicionar arquivo se um novo foi selecionado
      if (selectedFile) {
        formPayload.append('imagem', selectedFile);
      }
      
      let response;
      
      if (currentSimbolo) {
        // Editar símbolo existente usando a rota principal
        // Adicionar o tipo 'simbolo' explicitamente no payload mesmo para atualizações
        formPayload.append('tipo', 'simbolo');
        
        response = await axios.put(`/api/manifestacao/${currentSimbolo._id}`, formPayload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          // Atualizar lista de símbolos
          setLocalSimbolos(prev => 
            prev.map(s => 
              s._id === currentSimbolo._id ? response.data.data : s
            )
          );
          
          showSuccess('Símbolo atualizado com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao atualizar símbolo.');
        }
      } else {
        // Criar novo símbolo usando a rota principal
        // Adicionar o tipo 'simbolo' explicitamente no payload
        formPayload.append('tipo', 'simbolo');
        
        response = await axios.post('/api/manifestacao', formPayload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          // Adicionar novo símbolo à lista
          setLocalSimbolos(prev => [...prev, response.data.data]);
          
          showSuccess('Símbolo criado com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao criar símbolo.');
        }
      }
      
      // Fechar modal
      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar símbolo:', error);
      showError('Ocorreu um erro ao salvar seu símbolo. Tente novamente mais tarde.');
    } finally {
      setFormLoading(false);
    }
  };
  
  // Excluir símbolo
  const handleDelete = async (simboloId) => {
    if (window.confirm('Tem certeza que deseja excluir este símbolo? Esta ação não pode ser desfeita.')) {
      try {
        // Usar a rota principal para excluir o símbolo
        const response = await axios.delete(`/api/manifestacao/${simboloId}`);
        
        if (response.data.success) {
          // Remover símbolo da lista
          setLocalSimbolos(prev => prev.filter(s => s._id !== simboloId));
          
          showSuccess('Símbolo excluído com sucesso!');
        } else {
          showError(response.data.message || 'Erro ao excluir símbolo.');
        }
      } catch (error) {
        console.error('Erro ao excluir símbolo:', error);
        showError('Ocorreu um erro ao excluir seu símbolo. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <Box>
      {/* Descrição */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>
          Símbolos Pessoais
        </Typography>
        <Typography variant="body1" paragraph>
          Crie e personalize símbolos representativos para suas intenções e desejos.
          Símbolos são poderosas ferramentas para programar seu subconsciente e focar suas intenções.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dica: Escolha imagens que tenham um significado especial para você e atribua um poder específico a cada símbolo.
        </Typography>
      </Paper>
      
      {/* Lista de símbolos */}
      {localSimbolos.length === 0 ? (
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
          <FlareIcon sx={{ fontSize: 60, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Você ainda não possui símbolos pessoais
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Crie seu primeiro símbolo clicando no botão abaixo.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Criar Primeiro Símbolo
          </Button>
        </Paper>
      ) : (
        <Box>
          <Grid container spacing={3}>
            {localSimbolos.map((simbolo) => (
              <Grid item xs={12} sm={6} md={4} key={simbolo._id}>
                <Grow in={true} timeout={500}>
                  <SimboloCard>
                    <Box sx={{ position: 'relative', textAlign: 'center', pt: 3 }}>
                      <Avatar
                        src={simbolo.imagemUrl}
                        alt={simbolo.nome}
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          mx: 'auto',
                          border: `4px solid ${simbolo.cor || theme.palette.primary.main}`,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                        }}
                      />
                    </Box>
                    <CardContent sx={{ textAlign: 'center', pt: 3 }}>
                      <Typography variant="h5" gutterBottom>
                        {simbolo.nome}
                      </Typography>
                      
                      {simbolo.significado && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {simbolo.significado}
                        </Typography>
                      )}
                      
                      {simbolo.palavrasChave && simbolo.palavrasChave.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mt: 2 }}>
                          {simbolo.palavrasChave.map((palavra, index) => (
                            <Chip
                              key={index}
                              label={palavra}
                              size="small"
                              sx={{ 
                                bgcolor: `${simbolo.cor}22`, 
                                borderColor: simbolo.cor,
                                color: simbolo.cor,
                                borderWidth: 1,
                                borderStyle: 'solid'
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                    
                    <Box sx={{ p: 2, mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton 
                          color="primary"
                          onClick={() => handleOpenEdit(simbolo)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Excluir">
                        <IconButton 
                          color="error"
                          onClick={() => handleDelete(simbolo._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </SimboloCard>
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
              {currentSimbolo ? 'Editar Símbolo' : 'Novo Símbolo Pessoal'}
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
                label="Nome do Símbolo"
                name="nome"
                value={formData.nome}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Significado (opcional)"
                name="significado"
                value={formData.significado}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                multiline
                rows={4}
                placeholder="O que este símbolo representa para você?"
              />
              
              <TextField
                fullWidth
                label="Palavras-chave (separadas por vírgula)"
                name="palavrasChave"
                value={formData.palavrasChave}
                onChange={handleFormChange}
                variant="outlined"
                margin="normal"
                placeholder="Ex: abundância, prosperidade, sucesso"
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Cor do Símbolo
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {suggestedColors.map((cor) => (
                    <Tooltip title={cor} key={cor}>
                      <Box 
                        onClick={() => handleSelectColor(cor)}
                        sx={{ 
                          transform: formData.cor === cor ? 'scale(1.2)' : 'scale(1)',
                          outline: formData.cor === cor ? `2px solid ${theme.palette.primary.main}` : 'none',
                          outlineOffset: 2,
                          borderRadius: '50%'
                        }}
                      >
                        <ColorCircle color={cor} />
                      </Box>
                    </Tooltip>
                  ))}
                  
                  <Tooltip title="Cor personalizada">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={formData.cor}
                        onChange={(e) => handleSelectColor(e.target.value)}
                        style={{ 
                          width: '25px', 
                          height: '25px',
                          border: 'none',
                          padding: 0,
                          background: 'none',
                          cursor: 'pointer'
                        }}
                      />
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Imagem do Símbolo
              </Typography>
              
              <input
                accept="image/*"
                id="simbolo-imagem"
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
                <Box sx={{ position: 'relative', mt: 2, textAlign: 'center' }}>
                  <Avatar 
                    src={imagePreview} 
                    alt="Preview" 
                    sx={{ 
                      width: 150, 
                      height: 150,
                      mx: 'auto',
                      border: `4px solid ${formData.cor}`,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                    }} 
                  />
                  <Box sx={{ 
                    mt: 2,
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'center'
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
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Dicas para escolher um símbolo:
                </Typography>
                <ul style={{ paddingLeft: '20px', color: theme.palette.text.secondary }}>
                  <li>Escolha imagens com significado pessoal</li>
                  <li>Prefira símbolos simples e com forte impacto visual</li>
                  <li>Considere símbolos universais relacionados ao que deseja manifestar</li>
                  <li>A cor escolhida deve reforçar a intenção do símbolo</li>
                </ul>
              </Box>
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

export default SimbolosManifestacao;
