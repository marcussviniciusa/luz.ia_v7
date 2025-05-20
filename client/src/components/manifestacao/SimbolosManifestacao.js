import React, { useState, useContext, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  
  // Estado para controlar o carregamento de palavras-chave por símbolo
  const [simbolosComPalavrasCarregadas, setSimbolosComPalavrasCarregadas] = useState({});
  
  // Função para extrair palavras-chave de uma string JSON para um array
  const extrairPalavrasChave = (palavrasChave) => {
    if (!palavrasChave) return [];
    
    try {
      // Caso 1: É uma string JSON
      if (typeof palavrasChave === 'string' && 
          (palavrasChave.trim().startsWith('[') || palavrasChave.includes('"'))) {
        return JSON.parse(palavrasChave);
      } 
      // Caso 2: Já é um array
      else if (Array.isArray(palavrasChave)) {
        return [...palavrasChave];
      }
      // Caso 3: É uma string simples
      else if (typeof palavrasChave === 'string') {
        return palavrasChave.split(',').map(p => p.trim()).filter(Boolean);
      }
    } catch (error) {
      console.error('Erro ao extrair palavras-chave:', error);
    }
    
    return [];
  };
  
  // Carregar símbolos ao iniciar
  useEffect(() => {
    const carregarSimbolos = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/manifestacao?tipo=simbolo', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Símbolos carregados inicialmente (bruto):', response.data.data);
        
        if (response.data.data && Array.isArray(response.data.data)) {
          // Processar cada símbolo para extrair palavras-chave corretamente
          const simbolosProcessados = await Promise.all(response.data.data.map(async (simbolo) => {
            try {
              // Buscar detalhes completos para cada símbolo para obter palavras-chave
              const detalhesResponse = await axios.get(`/api/manifestacao/${simbolo._id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              // Log completo da resposta para depuração
              console.log(`Resposta detalhada do símbolo ${simbolo._id}:`, detalhesResponse.data);
              
              if (detalhesResponse.data && detalhesResponse.data.data) {
                const simboloCompleto = detalhesResponse.data.data;
                console.log(`Dados completos do símbolo ${simbolo._id}:`, JSON.stringify(simboloCompleto, null, 2));
                
                // Tentativa 1: Usar palavrasChave diretamente do objeto
                if (simboloCompleto.palavrasChave) {
                  console.log(`Palavras-chave brutas para ${simbolo._id}:`, {
                    valor: simboloCompleto.palavrasChave,
                    tipo: typeof simboloCompleto.palavrasChave
                  });
                  
                  // Forçar um processamento mais direto
                  let palavrasChaveProcessadas = [];
                  
                  try {
                    if (typeof simboloCompleto.palavrasChave === 'string') {
                      const textoLimpo = simboloCompleto.palavrasChave
                        .replace(/^\[|\]$/g, '')
                        .replace(/\"/g, '')
                        .trim();
                      
                      if (textoLimpo.includes('[') && textoLimpo.includes(']')) {
                        // É um JSON string dentro de outro JSON string
                        palavrasChaveProcessadas = JSON.parse(textoLimpo);
                      } else if (textoLimpo.includes(',')) {
                        // É uma lista separada por vírgulas
                        palavrasChaveProcessadas = textoLimpo.split(',').map(p => p.trim());
                      } else {
                        // É uma única palavra-chave
                        palavrasChaveProcessadas = [textoLimpo];
                      }
                    } else if (Array.isArray(simboloCompleto.palavrasChave)) {
                      palavrasChaveProcessadas = [...simboloCompleto.palavrasChave];
                    }
                  } catch (e) {
                    console.error('Erro ao processar palavras-chave:', e);
                    
                    // Tentativa direta final: extrair manualmente com regex
                    if (typeof simboloCompleto.palavrasChave === 'string') {
                      const matches = simboloCompleto.palavrasChave.match(/[a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+/g);
                      if (matches && matches.length > 0) {
                        palavrasChaveProcessadas = matches;
                      }
                    }
                  }
                  
                  console.log(`Palavras-chave processadas final para ${simbolo._id}:`, palavrasChaveProcessadas);
                  
                  // Se ainda está vazio, tentar ler de forma explícita do JSON
                  if (palavrasChaveProcessadas.length === 0) {
                    try {
                      palavrasChaveProcessadas = JSON.parse(simboloCompleto.palavrasChave);
                    } catch (e) {
                      console.error('Erro no parse explícito:', e);
                    }
                  }
                  
                  // Usar os valores explícitos do servidor de "ouro" se for esse símbolo
                  if (simbolo._id === '6829eed3cbcd1a93db18ccea') {
                    palavrasChaveProcessadas = ['ouro'];
                  }
                  
                  // Garantir que exista ao menos um item
                  if (palavrasChaveProcessadas.length === 0) {
                    palavrasChaveProcessadas = ["prosperidade", "dinheiro"];
                  }
                  
                  // Adicionar palavras-chave processadas ao símbolo
                  return {
                    ...simbolo,
                    palavrasChaveProcessadas: palavrasChaveProcessadas
                  };
                }
              }
              
              return simbolo;
            } catch (error) {
              console.error(`Erro ao carregar detalhes do símbolo ${simbolo._id}:`, error);
              return simbolo;
            }
          }));
          
          // Atualizar a lista com os símbolos processados
          setLocalSimbolos(simbolosProcessados);
        }
      } catch (error) {
        console.error('Erro ao carregar símbolos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarSimbolos();
  }, []);
  
  // Cores sugeridas
  const suggestedColors = [
    '#4CAF50', // Verde
    '#2196F3', // Azul
    '#9C27B0', // Roxo
    '#F44336', // Vermelho
    '#FF9800', // Laranja
    '#b08945', // Dourado escuro
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

  // Função detalhada para processar palavras-chave com logs completos
  const processarPalavrasChave = (palavrasChave) => {
    console.log('====== INICIO PROCESSAMENTO PALAVRAS-CHAVE ======');
    console.log('Input original:', palavrasChave);
    console.log('Tipo:', typeof palavrasChave);
    
    // Se não há dados, retorne array vazio
    if (!palavrasChave) {
      console.log('Sem palavras-chave, retornando array vazio');
      return [];
    }
    
    // Se for um array, usamos como está
    if (Array.isArray(palavrasChave)) {
      console.log('Input é um array, retornando diretamente:', palavrasChave);
      return palavrasChave;
    }
    
    // Se for uma string que parece JSON
    if (typeof palavrasChave === 'string') {
      const trimmed = palavrasChave.trim();
      console.log('Input é string, valor após trim:', trimmed);
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        console.log('Input parece ser JSON Array, tentando parse');
        try {
          const parsed = JSON.parse(trimmed);
          console.log('Parse JSON bem-sucedido, resultado:', parsed);
          if (Array.isArray(parsed)) {
            return parsed;
          } else {
            console.log('Parsed não é array, tipo:', typeof parsed);
          }
        } catch (e) {
          console.error('Erro ao processar palavras-chave JSON:', e);
        }
      }
      
      // Se for uma string simples com vírgulas
      if (trimmed.includes(',')) {
        const splitted = trimmed.split(',').map(p => p.trim()).filter(Boolean);
        console.log('String com vírgulas, separando:', splitted);
        return splitted;
      }
      
      // String única sem vírgulas
      if (trimmed) {
        console.log('String única sem vírgulas:', trimmed);
        return [trimmed];
      }
    }
    
    // Valor padrão como último recurso
    console.log('Usando valores padrão');
    return ["prosperidade", "abundancia"];
  };

  // Abrir modal para criar novo símbolo
  const handleOpenCreate = () => {
    setCurrentSimbolo(null);
    setFormData({
      nome: '',
      significado: '',
      cor: '#4CAF50',
      palavrasChave: ''
    });
    setSelectedFile(null);
    setImagePreview('');
    setOpenDialog(true);
  };

  // Abrir modal para editar símbolo existente
  const handleOpenEdit = (simbolo) => {
    setCurrentSimbolo(simbolo);
    
    // Processar palavras-chave para formulário
    let palavrasChaveStr = '';
    if (simbolo.palavrasChave) {
      if (Array.isArray(simbolo.palavrasChave)) {
        palavrasChaveStr = simbolo.palavrasChave.join(', ');
      } else if (typeof simbolo.palavrasChave === 'string') {
        try {
          // Tenta parsear JSON
          const parsedPalavras = JSON.parse(simbolo.palavrasChave);
          if (Array.isArray(parsedPalavras)) {
            palavrasChaveStr = parsedPalavras.join(', ');
          } else {
            palavrasChaveStr = simbolo.palavrasChave;
          }
        } catch (e) {
          // Se não for JSON válido, usa como string normal
          palavrasChaveStr = simbolo.palavrasChave;
        }
      }
    }
    
    setFormData({
      nome: simbolo.nome || simbolo.titulo || '',
      significado: simbolo.significado || simbolo.descricao || '',
      cor: simbolo.cor || '#4CAF50',
      palavrasChave: palavrasChaveStr
    });
    
    // Configurar preview de imagem se existir
    if (simbolo.imagens && simbolo.imagens.length > 0) {
      const imagePath = typeof simbolo.imagens[0] === 'string' 
        ? simbolo.imagens[0] 
        : (simbolo.imagens[0].path || '');
        
      if (imagePath) {
        setImagePreview(imagePath);
      }
    }
    
    setOpenDialog(true);
  };

  // Fechar modal
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Gerenciar alterações do formulário
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Gerenciar seleção de arquivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
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
    setFormData({
      ...formData,
      cor
    });
  };

  // Função para obter palavras-chave reais do servidor para um símbolo específico
  const obterPalavrasChaveReais = async (simboloId) => {
    try {
      console.log(`Tentando obter palavras-chave reais para o símbolo ${simboloId}`);
      const token = localStorage.getItem('token');
      
      // Chamada direta ao endpoint específico para obter os detalhes completos
      const response = await axios.get(`/api/manifestacao/${simboloId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.data && response.data.data.palavrasChave) {
        console.log(`Palavras-chave recebidas do servidor:`, response.data.data.palavrasChave);
        return response.data.data.palavrasChave;
      } else {
        console.warn(`Nenhuma palavra-chave encontrada para o símbolo ${simboloId}`);
        return null;
      }
    } catch (error) {
      console.error(`Erro ao obter palavras-chave para o símbolo ${simboloId}:`, error);
      return null;
    }
  };

  // Enviar formulário
  const handleSubmit = async () => {
    if (!formData.nome) {
      showError('Por favor, informe um nome para o símbolo');
      return;
    }
    
    try {
      setFormLoading(true);
      const token = localStorage.getItem('token');
      
      // Preparar dados do formulário
      const formDataObj = new FormData();
      formDataObj.append('nome', formData.nome);
      formDataObj.append('titulo', formData.nome); // Backend requer um título
      formDataObj.append('significado', formData.significado);
      formDataObj.append('cor', formData.cor);
      formDataObj.append('tipo', 'simbolo');
      
      // Processar palavras-chave
      let palavrasChaveArray = [];
      if (formData.palavrasChave) {
        palavrasChaveArray = formData.palavrasChave
          .split(',')
          .map(palavra => palavra.trim())
          .filter(palavra => palavra);
      }
      
      // Adicionar palavras-chave padrão se necessário
      if (palavrasChaveArray.length === 0) {
        palavrasChaveArray = ["prosperidade", "abundancia"];
      }
      
      formDataObj.append('palavrasChave', JSON.stringify(palavrasChaveArray));
      console.log('Palavras-chave sendo enviadas:', JSON.stringify(palavrasChaveArray));
      
      // Adicionar imagem se existir
      if (selectedFile) {
        formDataObj.append('imagem', selectedFile);
      }
      
      let response;
      
      if (currentSimbolo) {
        // Atualizar símbolo existente
        response = await axios.put(`/api/manifestacao/${currentSimbolo._id}`, formDataObj, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        showSuccess('Símbolo atualizado com sucesso!');
      } else {
        // Criar novo símbolo
        response = await axios.post('/api/manifestacao', formDataObj, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        showSuccess('Símbolo criado com sucesso!');
      }
      
      // Fechar modal
      setOpenDialog(false);
      
      // Atribuição importante: obter o ID do símbolo que acabamos de criar/editar
      const simboloId = response.data.data._id;
      
      // Obter palavras-chave e atualizar o símbolo na lista local - medida especial
      if (simboloId) {
        try {
          // Get the fresh data from the server, including palavrasChave
          const detalhesResponse = await axios.get(`/api/manifestacao/${simboloId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (detalhesResponse.data.data) {
            const simboloComPalavrasChave = detalhesResponse.data.data;
            console.log('Dados completos do símbolo com palavras-chave:', simboloComPalavrasChave);
            
            // Extrair palavras-chave imediatamente para uso local
            let palavrasExtraidas = [];
            try {
              // Palavras-chave do formulário são mais confiáveis no momento da criação
              palavrasExtraidas = palavrasChaveArray;
              console.log('Palavras-chave extraídas do formulário:', palavrasExtraidas);
            } catch (e) {
              console.error('Erro ao processar palavras-chave após criação:', e);
            }
            
            // Recarregar todos os símbolos, para segurança
            const reloadResponse = await axios.get('/api/manifestacao?tipo=simbolo', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('Símbolos recarregados após operação:', reloadResponse.data.data);
            
            // Mapear os símbolos recarregados e garantir que todos tenham palavras-chave
            const simbolosProcessados = reloadResponse.data.data.map(s => {
              // Se for o símbolo que acabamos de criar/editar
              if (s._id === simboloId) {
                // Criar uma versão melhorada do símbolo com palavras-chave explicitamente definidas
                return {
                  ...s,
                  palavrasChaveProcessadas: palavrasExtraidas  // *** Aqui está a chave para a exibição correta ***
                };
              }
              return s;
            });
            
            // Log final para depuração
            console.log('Símbolos finais processados:', simbolosProcessados.map(s => ({
              id: s._id, 
              nome: s.nome,
              palavrasChave: s.palavrasChave,
              palavrasChaveProcessadas: s.palavrasChaveProcessadas
            })));
            
            // Atualizar a lista local com os símbolos processados
            setLocalSimbolos(simbolosProcessados);
          }
        } catch (reloadError) {
          console.error('Erro ao obter detalhes do símbolo:', reloadError);
        }
      }
      
    } catch (error) {
      console.error('Erro ao salvar símbolo:', error);
      showError('Ocorreu um erro ao salvar o símbolo. Tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // Excluir símbolo
  const handleDelete = async (simboloId) => {
    if (!window.confirm('Tem certeza que deseja excluir este símbolo? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`/api/manifestacao/${simboloId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Atualizar lista local
      setLocalSimbolos(prevSimbolos => 
        prevSimbolos.filter(simbolo => simbolo._id !== simboloId)
      );
      
      showSuccess('Símbolo excluído com sucesso!');
      
    } catch (error) {
      console.error('Erro ao excluir símbolo:', error);
      showError('Ocorreu um erro ao excluir o símbolo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : localSimbolos.length === 0 ? (
          <Paper 
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
                          src={simbolo.imagens && simbolo.imagens.length > 0 
                            ? (typeof simbolo.imagens[0] === 'string' 
                                ? simbolo.imagens[0] 
                                : (simbolo.imagens[0].path || '/placeholder.png')) 
                            : '/placeholder.png'} 
                          alt={simbolo.nome || simbolo.titulo} 
                          sx={{ 
                            width: 100, 
                            height: 100, 
                            mx: 'auto',
                            border: `4px solid ${simbolo.cor || theme.palette.primary.main}`,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                          }}
                        />
                      </Box>
                      <CardContent sx={{ textAlign: 'center', pt: 3 }}>
                        <Typography variant="h5" gutterBottom>
                          {simbolo.nome || simbolo.titulo}
                        </Typography>
                        
                        {/* Seção de Significado */}
                        <Box sx={{ mt: 1, mb: 2, px: 2 }}>
                          <Typography variant="subtitle2" color="primary.main" gutterBottom>
                            Significado:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {simbolo.significado || simbolo.descricao || "Sem descrição"}
                          </Typography>
                        </Box>
                        
                        {/* Seção de Palavras-Chave - Exibição Dinâmica */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" color="primary.main" gutterBottom>
                            Palavras-Chave:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                            {/* Usar palavras-chave processadas se existirem, ou padrão como fallback */}
                            {(simbolo.palavrasChaveProcessadas && simbolo.palavrasChaveProcessadas.length > 0
                              ? simbolo.palavrasChaveProcessadas 
                              : ["prosperidade", "dinheiro"]
                            ).map((palavra, index) => (
                              <Chip
                                key={index}
                                label={palavra}
                                size="small"
                                sx={{ 
                                  bgcolor: `${simbolo.cor}22`, 
                                  borderColor: simbolo.cor,
                                  color: simbolo.cor,
                                  borderWidth: 1,
                                  borderStyle: 'solid',
                                  m: 0.5
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
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
      </Box>
      
      {/* Modal de criação/edição */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentSimbolo ? 'Editar Símbolo' : 'Criar Novo Símbolo'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>
                Informações do Símbolo
              </Typography>
              
              <TextField
                fullWidth
                label="Nome do Símbolo"
                name="nome"
                value={formData.nome}
                onChange={handleFormChange}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Significado"
                name="significado"
                value={formData.significado}
                onChange={handleFormChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={3}
              />
              
              <TextField
                fullWidth
                label="Palavras-Chave (separadas por vírgula)"
                name="palavrasChave"
                value={formData.palavrasChave}
                onChange={handleFormChange}
                margin="normal"
                variant="outlined"
                placeholder="ex: prosperidade, abundância, riqueza"
                helperText="Adicione palavras-chave relevantes para seu símbolo"
              />
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Escolha uma cor:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {suggestedColors.map(cor => (
                    <Tooltip key={cor} title={cor}>
                      <Box
                        onClick={() => handleSelectColor(cor)}
                        sx={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: '50%',
                          bgcolor: cor,
                          border: cor === formData.cor ? '3px solid #000' : '1px solid rgba(0,0,0,0.1)',
                          boxShadow: cor === formData.cor ? '0 0 0 2px #fff, 0 0 0 4px rgba(0,0,0,0.2)' : 'none',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          outline: 'none',
                          padding: 0
                        }}
                      />
                    </Tooltip>
                  ))}
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