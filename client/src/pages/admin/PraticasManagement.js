import React, { useState, useEffect, useContext } from 'react';
import AudioPlayer from './AudioPlayer';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import axios from 'axios';
import { SnackbarContext } from '../../contexts/SnackbarContext';

const PraticasManagement = () => {
  const [praticas, setPraticas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false);
  const [currentAudioTitle, setCurrentAudioTitle] = useState('');
  const [currentAudioPath, setCurrentAudioPath] = useState('');
  const [currentPratica, setCurrentPratica] = useState({
    titulo: '',
    descricao: '',
    categoria: 'meditacao',
    duracao: 10,
    audioPath: '',
    imagemCapa: '',
    ativa: true
  });
  const [file, setFile] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({
    uploading: false,
    audioUploaded: false,
    imageUploaded: false,
    error: null
  });
  const [loading, setLoading] = useState(false);
  const [categorias] = useState([
    'meditacao',       // Meditações guiadas
    'visualizacao',    // Exercícios de visualização
    'reprogramacao',   // Reprogramação emocional
    'cubo',            // Exercício do Cubo
    'escada',          // Exercício da Escada
    'animais',         // Exercício do Cavalo e Vaca
    'zoomout',         // Técnica de Zoom Out
    'alpha',           // Técnica de estado Alpha
    'outro'            // Outros tipos de prática
  ]);
  
  const { showSuccess, showError } = useContext(SnackbarContext);

  useEffect(() => {
    fetchPraticas();
  }, []);

  const fetchPraticas = async () => {
    try {
      console.log('Carregando práticas guiadas...');
      setLoading(true);
      
      // Buscar práticas guiadas tradicionais - incluindo todas para admins
      const resPraticas = await axios.get('/api/praticas?all=true');
      const praticasData = resPraticas.data.data || [];
      console.log('Práticas tradicionais carregadas:', praticasData.length);
      
      // Buscar conteúdos da categoria 'praticas'
      const resContent = await axios.get('/api/contents?category=praticas');
      const contentsData = resContent.data.data || [];
      console.log('Conteúdos carregados:', contentsData.length);
      
      // Mapear conteúdos para o formato de práticas para exibição consistente
      const mappedContents = contentsData.map(content => ({
        _id: content._id,
        titulo: content.title,
        descricao: content.description,
        categoria: 'content', // Categoria especial para identificar conteúdos
        tipo: content.type,
        contentUrl: content.contentUrl || '',
        imageUrl: content.imageUrl || '',
        isContent: true, // Marcador para identificar que é um conteúdo, não uma prática tradicional
        createdAt: content.createdAt,
        featured: content.featured,
        status: content.status
      }));
      
      // Combinar os dois tipos de dados
      const combinedData = [...praticasData, ...mappedContents];
      console.log('Total de itens combinados:', combinedData.length);
      
      // Ordenar por data de criação (mais recentes primeiro)
      combinedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setPraticas(combinedData);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar práticas:', error);
      showError('Erro ao carregar práticas guiadas');
      setLoading(false);
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
    setEditMode(false);
    setCurrentPratica({
      titulo: '',
      descricao: '',
      categoria: 'meditacao',
      duracao: 10,
      audioPath: '',
      imagemCapa: '',
      ativa: true
    });
    setFile(null);
    setImagem(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPratica({ ...currentPratica, [name]: value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      console.log('Arquivo de áudio selecionado:', selectedFile.name, selectedFile.type, selectedFile.size);
      // Verificar se o arquivo é válido
      if (selectedFile.size === 0) {
        alert('O arquivo de áudio selecionado está vazio. Por favor, selecione outro arquivo.');
        setFile(null);
      }
    }
  };

  const handleImagemChange = (e) => {
    const selectedFile = e.target.files[0];
    setImagem(selectedFile);
    if (selectedFile) {
      console.log('Arquivo de imagem selecionado:', selectedFile.name, selectedFile.type, selectedFile.size);
      // Verificar se o arquivo é válido
      if (selectedFile.size === 0) {
        alert('O arquivo de imagem selecionado está vazio. Por favor, selecione outro arquivo.');
        setImagem(null);
      }
    }
  };
  
  // Upload de arquivo direto - função auxiliar
  const uploadAudioFile = async (praticaId, audioFile) => {
    if (!audioFile) return null;
    
    console.log('Iniciando upload de áudio para prática', praticaId);
    console.log('Detalhes do arquivo:', {
      nome: audioFile.name,
      tipo: audioFile.type,
      tamanho: audioFile.size
    });
    
    // Criar FormData apenas para o áudio
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    
    try {
      const response = await axios.put(`/api/praticas/${praticaId}/uploads`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload de áudio concluído com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro no upload de áudio:', error);
      showError('Erro ao enviar arquivo de áudio');
      return null;
    }
  };

  const handleEdit = (pratica) => {
    setCurrentPratica(pratica);
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta prática guiada?')) {
      try {
        await axios.delete(`/api/praticas/${id}`);
        setPraticas(praticas.filter(pratica => pratica._id !== id));
        showSuccess('Prática guiada excluída com sucesso');
      } catch (error) {
        showError('Erro ao excluir prática guiada');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Para debug - garantir que todos os estados estão corretos
    console.log('Estado do arquivo de áudio:', file);
    console.log('Estado do arquivo de imagem:', imagem);
    console.log('Estado da prática atual:', currentPratica);
  
    // Validar campos obrigatórios
    if (!currentPratica.titulo || !currentPratica.descricao) {
      showError('Por favor, preencha o título e a descrição');
      return;
    }
    
    // É fundamental verificar se os arquivos selecionados são instâncias válidas de File
    if (file) {
      console.log('Detalhes do arquivo de áudio:');
      console.log('- Nome:', file.name);
      console.log('- Tipo:', file.type);
      console.log('- Tamanho:', file.size);
      console.log('- É instância de File?', file instanceof File);
    }
    
    if (imagem) {
      console.log('Detalhes do arquivo de imagem:');
      console.log('- Nome:', imagem.name);
      console.log('- Tipo:', imagem.type);
      console.log('- Tamanho:', imagem.size);
      console.log('- É instância de File?', imagem instanceof File);
    }
  
    try {
      setLoading(true);
      let response;
      
      // Criar um objeto com os campos corretos que correspondem ao modelo no backend
      const praticaData = {
        titulo: currentPratica.titulo,
        descricao: currentPratica.descricao,
        categoria: currentPratica.categoria || 'meditacao',
        duracao: currentPratica.duracao || 0,
        ativa: currentPratica.ativa !== undefined ? currentPratica.ativa : true
      };
      
      console.log('Enviando dados para o servidor:', praticaData);
      
      if (editMode) {
        // Para edição, usamos JSON diretamente sem FormData
        response = await axios.put(`/api/praticas/${currentPratica._id}`, praticaData);
        showSuccess('Prática guiada atualizada com sucesso');
      } else {
        // Para criação, usamos JSON diretamente sem FormData
        response = await axios.post('/api/praticas', praticaData);
        console.log('Resposta do servidor:', response.data);
        showSuccess('Prática guiada adicionada com sucesso');
      }
      
      // Verificar se temos arquivos para upload separadamente
      if (file || imagem) {
        try {
          const praticaId = response.data.data._id;
          console.log('ID da prática para upload:', praticaId);
          
          // Marcador de status de upload
          setUploadStatus({
            uploading: true,
            audioUploaded: false,
            imageUploaded: false,
            error: null
          });
          
          let finalPratica = response.data.data;
          
          // Upload do arquivo de áudio usando a função auxiliar
          if (file) {
            const audioUploadResult = await uploadAudioFile(praticaId, file);
            
            if (audioUploadResult && audioUploadResult.data) {
              console.log('Prática atualizada com áudio:', audioUploadResult.data);
              finalPratica = audioUploadResult.data;
            }
          }
          
          // Upload do arquivo de imagem
          if (imagem) {
            console.log('Iniciando upload do arquivo de imagem...');
            const imagemFormData = new FormData();
            imagemFormData.append('imagemFile', imagem);
            
            try {
              const imagemResponse = await axios.put(`/api/praticas/${praticaId}/uploads`, imagemFormData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
              
              if (imagemResponse.data && imagemResponse.data.data) {
                console.log('Resposta do upload de imagem:', imagemResponse.data);
                finalPratica = imagemResponse.data.data;
              }
            } catch (imageError) {
              console.error('Erro no upload de imagem:', imageError);
              showError('Erro ao enviar imagem');
            }
          }
          
          // Buscar a prática atualizada para garantir que temos os dados mais recentes
          try {
            const updatedPraticaResponse = await axios.get(`/api/praticas/${praticaId}`);
            const updatedPratica = updatedPraticaResponse.data.data;
            
            console.log('Prática final após todos os uploads:', updatedPratica);
            finalPratica = updatedPratica;
            
            // Se estivermos editando uma prática que coincide com a prática atualmente em reprodução
            if (currentAudioTitle === currentPratica.titulo && updatedPratica.audioPath) {
              console.log('Atualizando caminho de áudio para reprodução:', updatedPratica.audioPath);
              setCurrentAudioPath(updatedPratica.audioPath);
            }
          } catch (getError) {
            console.error('Erro ao buscar prática atualizada:', getError);
          }
          
          // Atualizar a lista de práticas com os dados finais
          if (finalPratica) {
            setPraticas(prevPraticas => 
              prevPraticas.map(p => 
                p._id === praticaId ? finalPratica : p
              )
            );
          }
          
          // Atualizar status de upload
          setUploadStatus({
            uploading: false,
            audioUploaded: !!file,
            imageUploaded: !!imagem,
            error: null
          });
          
          console.log('Uploads concluídos para a prática ID:', praticaId);
          
          // Recarregar todas as práticas para garantir dados sincronizados
          fetchPraticas();
          
          showSuccess('Uploads concluídos com sucesso');
        } catch (uploadError) {
          console.error('Erro detalhado durante upload:', uploadError);
          
          setUploadStatus({
            uploading: false,
            audioUploaded: false,
            imageUploaded: false,
            error: uploadError.response?.data?.error || 'Erro ao fazer upload de arquivos'
          });
          
          showError(`Erro ao fazer upload: ${uploadError.response?.data?.error || uploadError.message}`);
        }
      }
      
      setLoading(false);
      setOpen(false);
      
      // Limpar o formulário
      setCurrentPratica({
        titulo: '',
        descricao: '',
        categoria: 'meditacao',
        duracao: 10,
        audioPath: '',
        imagemCapa: '',
        ativa: true
      });
      setFile(null);
      setImagem(null);
      
    } catch (error) {
      console.error('Erro ao criar/atualizar prática:', error);
      showError(`Erro: ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gerenciamento de Práticas Guiadas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          Nova Prática
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Práticas
              </Typography>
              <Typography variant="h3">{praticas.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Categorias
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {categorias.map((cat) => (
                  <Chip 
                    key={cat} 
                    label={cat} 
                    color="primary" 
                    variant="outlined" 
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Práticas Públicas
              </Typography>
              <Typography variant="h3">
                {praticas.filter(p => p.publico).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Origem</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {praticas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Nenhuma prática ou conteúdo encontrado</TableCell>
              </TableRow>
            ) : (
              praticas.map((pratica) => (
                <TableRow key={pratica._id}>
                  <TableCell>{pratica.titulo}</TableCell>
                  <TableCell>
                    {pratica.isContent ? (
                      <Chip 
                        label={pratica.tipo === 'video' ? 'Vídeo' : pratica.tipo === 'article' ? 'Artigo' : pratica.tipo} 
                        color="secondary" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        label={pratica.categoria.charAt(0).toUpperCase() + pratica.categoria.slice(1)} 
                        color="primary" 
                        size="small" 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {pratica.isContent ? (
                      <Chip label="Conteúdo" color="info" size="small" />
                    ) : (
                      <Chip label="Prática Guiada" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {pratica.isContent ? (
                      <Chip 
                        label={pratica.status === 'published' ? 'Publicado' : pratica.status === 'draft' ? 'Rascunho' : 'Arquivado'} 
                        color={pratica.status === 'published' ? 'success' : pratica.status === 'draft' ? 'warning' : 'default'} 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        label={pratica.ativa ? 'Público' : 'Privado'} 
                        color={pratica.ativa ? 'success' : 'default'} 
                        size="small" 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {pratica.isContent ? (
                      <>
                        <IconButton color="primary" onClick={() => window.open(`/admin/content?edit=${pratica._id}`, '_blank')}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="success" onClick={() => window.open(pratica.contentUrl, '_blank')} disabled={!pratica.contentUrl}>
                          <PlayArrowIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton 
                          color="primary" 
                          onClick={async () => {
                            console.log('Reproduzindo áudio interno para:', pratica.titulo);
                            console.log('Caminho do áudio inicial:', pratica.audioPath);
                            
                            // Passo adicional: buscar a prática atualizada do servidor
                            try {
                              console.log('Buscando dados atualizados da prática ID:', pratica._id);
                              const response = await axios.get(`/api/praticas/${pratica._id}`);
                              const updatedPratica = response.data.data;
                              
                              console.log('Prática atualizada obtida do servidor:', updatedPratica);
                              console.log('Caminho do áudio atualizado:', updatedPratica.audioPath);
                              
                              // Definir o título atual do áudio sendo reproduzido
                              setCurrentAudioTitle(updatedPratica.titulo);
                              
                              // Garantir que o caminho do áudio seja válido e não esteja vazio
                              if (updatedPratica.audioPath && updatedPratica.audioPath.trim() !== '') {
                                console.log('Usando caminho de áudio do servidor:', updatedPratica.audioPath);
                                setCurrentAudioPath(updatedPratica.audioPath);
                              } else {
                                console.log('Nenhum caminho de áudio válido encontrado, usando fallback');
                                setCurrentAudioPath('');
                              }
                            } catch (error) {
                              console.error('Erro ao buscar prática atualizada:', error);
                              setCurrentAudioTitle(pratica.titulo);
                              setCurrentAudioPath(pratica.audioPath || '');
                            }
                            
                            setAudioPlayerOpen(true);
                          }}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                        <IconButton color="primary" onClick={() => handleEdit(pratica)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(pratica._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Reprodutor de áudio interno */}
      <AudioPlayer 
        open={audioPlayerOpen} 
        onClose={() => setAudioPlayerOpen(false)} 
        title={currentAudioTitle}
        audioPath={currentAudioPath} 
      />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Editar Prática Guiada' : 'Nova Prática Guiada'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Título"
                name="titulo"
                value={currentPratica.titulo}
                onChange={handleInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="categoria-label">Categoria</InputLabel>
                <Select
                  labelId="categoria-label"
                  name="categoria"
                  value={currentPratica.categoria}
                  onChange={handleInputChange}
                  label="Categoria"
                >
                  {categorias.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Duração (minutos)"
                name="duracao"
                type="number"
                value={currentPratica.duracao}
                onChange={handleInputChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="descricao"
                value={currentPratica.descricao}
                onChange={handleInputChange}
                required
                multiline
                rows={4}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Áudio da Prática
              </Typography>
              <Box mb={2}>
                <TextField
                  type="file"
                  variant="outlined"
                  fullWidth
                  onChange={handleFileChange}
                  inputProps={{
                    accept: 'audio/*'
                  }}
                />
                {uploadStatus.uploading && file && (
                  <Box display="flex" alignItems="center" mt={1}>
                    <CircularProgress size={20} />
                    <Typography variant="caption" ml={1}>
                      Enviando arquivo de áudio...
                    </Typography>
                  </Box>
                )}
                {uploadStatus.audioUploaded && (
                  <Typography variant="caption" color="success.main" mt={1}>
                    Áudio enviado com sucesso!
                  </Typography>
                )}
                {uploadStatus.error && file && (
                  <Typography variant="caption" color="error" mt={1}>
                    Erro ao enviar áudio: {uploadStatus.error}
                  </Typography>
                )}
                {editMode && currentPratica.audioPath && (
                  <Typography variant="caption" color="primary" mt={1}>
                    Áudio atual: {currentPratica.audioPath.split('/').pop()}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Imagem de Capa
              </Typography>
              <Box mb={2}>
                <TextField
                  type="file"
                  variant="outlined"
                  fullWidth
                  onChange={handleImagemChange}
                  inputProps={{
                    accept: 'image/*'
                  }}
                />
                {uploadStatus.uploading && imagem && (
                  <Box display="flex" alignItems="center" mt={1}>
                    <CircularProgress size={20} />
                    <Typography variant="caption" ml={1}>
                      Enviando imagem...
                    </Typography>
                  </Box>
                )}
                {uploadStatus.imageUploaded && (
                  <Typography variant="caption" color="success.main" mt={1}>
                    Imagem enviada com sucesso!
                  </Typography>
                )}
                {uploadStatus.error && imagem && (
                  <Typography variant="caption" color="error" mt={1}>
                    Erro ao enviar imagem: {uploadStatus.error}
                  </Typography>
                )}
                {editMode && currentPratica.imagemCapa && (
                  <Typography variant="caption" color="primary" mt={1}>
                    Imagem atual: {currentPratica.imagemCapa.split('/').pop()}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="ativa-label">Visibilidade</InputLabel>
                <Select
                  labelId="ativa-label"
                  name="ativa"
                  value={currentPratica.ativa}
                  onChange={handleInputChange}
                  label="Visibilidade"
                >
                  <MenuItem value={true}>Público</MenuItem>
                  <MenuItem value={false}>Privado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PraticasManagement;
