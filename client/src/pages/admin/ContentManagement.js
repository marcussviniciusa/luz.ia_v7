import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Article as ArticleIcon,
  Book as BookIcon,
  CloudUpload as CloudUploadIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import axios from 'axios';
import { SnackbarContext } from '../../contexts/SnackbarContext';

// Componente principal
const ContentManagement = () => {
  const { showSuccess, showError } = useContext(SnackbarContext);
  const [tabValue, setTabValue] = useState(0);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    type: 'article',
    category: 'manifestacao',
    imageUrl: '',
    contentUrl: '',
    featured: false
  });
  const [fileUpload, setFileUpload] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchContents();
  }, [tabValue]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      // Implementação real com chamada à API
      const type = getContentTypeFromTab();
      
      // Preparar a query string para filtrar por tipo se necessário
      const queryParams = type !== 'all' ? `?type=${type}` : '';
      
      // Buscar conteúdo da API
      const response = await axios.get(`/api/contents${queryParams}`);
      
      if (response.data && response.data.data) {
        setContents(response.data.data);
      } else {
        setContents([]);
      }
    } catch (error) {
      console.error('Erro ao buscar conteúdos:', error);
      showError('Erro ao buscar conteúdos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeFromTab = () => {
    switch (tabValue) {
      case 0: return 'all';
      case 1: return 'article';
      case 2: return 'video';
      case 3: return 'ebook';
      case 4: return 'gallery';
      default: return 'all';
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'article': return <ArticleIcon />;
      case 'video': return <VideoLibraryIcon />;
      case 'ebook': return <BookIcon />;
      case 'gallery': return <ImageIcon />;
      default: return <ArticleIcon />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'manifestacao': return 'Manifestação';
      case 'praticas': return 'Práticas Guiadas';
      case 'diario': return 'Diário Quântico';
      case 'desenvolvimento': return 'Desenvolvimento Pessoal';
      default: return category;
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenAddDialog = () => {
    setContentForm({
      title: '',
      description: '',
      type: getContentTypeFromTab() === 'all' ? 'article' : getContentTypeFromTab(),
      category: 'manifestacao',
      imageUrl: '',
      contentUrl: '',
      featured: false
    });
    setImagePreview(null);
    setFileUpload(null);
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenEditDialog = (content) => {
    setSelectedContent(content);
    setContentForm({
      title: content.title,
      description: content.description,
      type: content.type,
      category: content.category,
      imageUrl: content.imageUrl,
      contentUrl: content.contentUrl || '',
      featured: content.featured || false
    });
    setImagePreview(content.imageUrl);
    setFileUpload(null);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleOpenDeleteDialog = (content) => {
    setSelectedContent(content);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContentForm({
      ...contentForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileUpload(file);
      
      // Converter para base64 para preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

    // Adicionar novo conteúdo
    const handleAddContent = async () => {
      try {
        setLoading(true);
        
        // Preparar os dados para envio à API
        const contentData = {
          ...contentForm
        };
        
        // Se tiver uma imagem em base64, adicioná-la aos dados
        if (fileUpload && imagePreview) {
          contentData.imageBase64 = imagePreview;
          contentData.imageName = fileUpload.name;
        }
        
        // Enviar para a API
        const response = await axios.post('/api/contents', contentData);
        
        if (response.data.success) {
          // Atualizar a lista de conteúdos
          fetchContents();
          
          // Fechar o diálogo e mostrar mensagem de sucesso
          showSuccess('Conteúdo adicionado com sucesso!');
          handleCloseAddDialog();
          
          // Resetar o formulário
          setContentForm({
            title: '',
            description: '',
            type: 'article',
            category: 'manifestacao',
            imageUrl: '',
            contentUrl: '',
            featured: false
          });
          setImagePreview(null);
          setFileUpload(null);
        }
      } catch (error) {
        console.error('Erro ao adicionar conteúdo:', error);
        showError(error.response?.data?.error || 'Erro ao adicionar conteúdo');
      } finally {
        setLoading(false);
      }
    };
    
    // Atualizar conteúdo existente
    const handleEditContent = async () => {
      try {
        setLoading(true);
        
        if (!selectedContent || !selectedContent._id) {
          showError('Conteúdo inválido para edição');
          return;
        }
        
        // Preparar os dados para envio à API
        const contentData = {
          ...contentForm
        };
        
        // Se tiver uma imagem em base64, adicioná-la aos dados
        if (fileUpload && imagePreview) {
          contentData.imageBase64 = imagePreview;
          contentData.imageName = fileUpload.name;
        }
        
        // Enviar para a API
        const response = await axios.put(`/api/contents/${selectedContent._id}`, contentData);
        
        if (response.data.success) {
          // Atualizar a lista de conteúdos
          fetchContents();
          
          // Fechar o diálogo e mostrar mensagem de sucesso
          showSuccess('Conteúdo atualizado com sucesso!');
          handleCloseEditDialog();
        }
      } catch (error) {
        console.error('Erro ao atualizar conteúdo:', error);
        showError(error.response?.data?.error || 'Erro ao atualizar conteúdo');
      } finally {
        setLoading(false);
      }
    };
    
    // Excluir conteúdo
    const handleDeleteContent = async () => {
      try {
        setLoading(true);
        
        if (!selectedContent || !selectedContent._id) {
          showError('Conteúdo inválido para exclusão');
          return;
        }
        
        // Enviar para a API
        const response = await axios.delete(`/api/contents/${selectedContent._id}`);
        
        if (response.data.success) {
          // Atualizar a lista de conteúdos
          fetchContents();
          
          // Fechar o diálogo e mostrar mensagem de sucesso
          showSuccess('Conteúdo removido com sucesso!');
          handleCloseDeleteDialog();
        }
      } catch (error) {
        console.error('Erro ao remover conteúdo:', error);
        showError(error.response?.data?.error || 'Erro ao remover conteúdo');
      } finally {
        setLoading(false);
      }
    };

      return (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Gerenciamento de Conteúdo
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              Novo Conteúdo
            </Button>
          </Box>
          
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Todos" />
              <Tab label="Artigos" />
              <Tab label="Vídeos" />
              <Tab label="E-books" />
              <Tab label="Galerias" />
            </Tabs>
          </Paper>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : contents.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="subtitle1" color="textSecondary">
                Nenhum conteúdo encontrado. Adicione um novo!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {contents.map((content) => (
                <Grid item xs={12} sm={6} md={4} key={content._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {content.imageUrl && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={content.imageUrl}
                        alt={content.title}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getContentTypeIcon(content.type)}
                        <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                          {content.type === 'article' ? 'Artigo' : 
                          content.type === 'video' ? 'Vídeo' : 
                          content.type === 'ebook' ? 'E-book' : 'Galeria'}
                        </Typography>
                      </Box>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {content.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {content.description.length > 100 
                          ? `${content.description.substring(0, 100)}...` 
                          : content.description}
                      </Typography>
                      <Chip 
                        label={getCategoryLabel(content.category)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      {content.featured && (
                        <Chip 
                          label="Destaque" 
                          size="small" 
                          color="secondary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(content)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(content)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* Diálogo para adicionar conteúdo */}
          <Dialog 
            open={openAddDialog} 
            onClose={handleCloseAddDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Adicionar Novo Conteúdo</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <TextField
                    name="title"
                    label="Título"
                    fullWidth
                    margin="dense"
                    value={contentForm.title}
                    onChange={handleFormChange}
                    required
                  />
                  <TextField
                    name="description"
                    label="Descrição"
                    fullWidth
                    margin="dense"
                    multiline
                    rows={4}
                    value={contentForm.description}
                    onChange={handleFormChange}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          name="type"
                          value={contentForm.type}
                          onChange={handleFormChange}
                          label="Tipo"
                        >
                          <MenuItem value="article">Artigo</MenuItem>
                          <MenuItem value="video">Vídeo</MenuItem>
                          <MenuItem value="ebook">E-book</MenuItem>
                          <MenuItem value="gallery">Galeria</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Categoria</InputLabel>
                        <Select
                          name="category"
                          value={contentForm.category}
                          onChange={handleFormChange}
                          label="Categoria"
                        >
                          <MenuItem value="manifestacao">Manifestação</MenuItem>
                          <MenuItem value="praticas">Práticas Guiadas</MenuItem>
                          <MenuItem value="diario">Diário Quântico</MenuItem>
                          <MenuItem value="desenvolvimento">Desenvolvimento Pessoal</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  {(contentForm.type === 'video' || contentForm.type === 'ebook') && (
                    <TextField
                      name="contentUrl"
                      label="URL do Conteúdo"
                      fullWidth
                      margin="dense"
                      value={contentForm.contentUrl}
                      onChange={handleFormChange}
                      helperText={`URL do ${contentForm.type === 'video' ? 'vídeo' : 'e-book'}`}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>Destaque:</Typography>
                    <input
                      type="checkbox"
                      name="featured"
                      checked={contentForm.featured}
                      onChange={handleFormChange}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, mb: 2, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Prévia da imagem
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Carregar Imagem
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAddDialog} color="inherit">Cancelar</Button>
              <Button 
                onClick={handleAddContent} 
                color="primary" 
                variant="contained"
                disabled={loading || !contentForm.title || !contentForm.description}
              >
                {loading ? <CircularProgress size={24} /> : 'Adicionar'}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Diálogo para editar conteúdo */}
          <Dialog 
            open={openEditDialog} 
            onClose={handleCloseEditDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Editar Conteúdo</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <TextField
                    name="title"
                    label="Título"
                    fullWidth
                    margin="dense"
                    value={contentForm.title}
                    onChange={handleFormChange}
                    required
                  />
                  <TextField
                    name="description"
                    label="Descrição"
                    fullWidth
                    margin="dense"
                    multiline
                    rows={4}
                    value={contentForm.description}
                    onChange={handleFormChange}
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          name="type"
                          value={contentForm.type}
                          onChange={handleFormChange}
                          label="Tipo"
                        >
                          <MenuItem value="article">Artigo</MenuItem>
                          <MenuItem value="video">Vídeo</MenuItem>
                          <MenuItem value="ebook">E-book</MenuItem>
                          <MenuItem value="gallery">Galeria</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Categoria</InputLabel>
                        <Select
                          name="category"
                          value={contentForm.category}
                          onChange={handleFormChange}
                          label="Categoria"
                        >
                          <MenuItem value="manifestacao">Manifestação</MenuItem>
                          <MenuItem value="praticas">Práticas Guiadas</MenuItem>
                          <MenuItem value="diario">Diário Quântico</MenuItem>
                          <MenuItem value="desenvolvimento">Desenvolvimento Pessoal</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                  {(contentForm.type === 'video' || contentForm.type === 'ebook') && (
                    <TextField
                      name="contentUrl"
                      label="URL do Conteúdo"
                      fullWidth
                      margin="dense"
                      value={contentForm.contentUrl}
                      onChange={handleFormChange}
                      helperText={`URL do ${contentForm.type === 'video' ? 'vídeo' : 'e-book'}`}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>Destaque:</Typography>
                    <input
                      type="checkbox"
                      name="featured"
                      checked={contentForm.featured}
                      onChange={handleFormChange}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, mb: 2, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Prévia da imagem
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Carregar Nova Imagem
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog} color="inherit">Cancelar</Button>
              <Button 
                onClick={handleEditContent} 
                color="primary" 
                variant="contained"
                disabled={loading || !contentForm.title || !contentForm.description}
              >
                {loading ? <CircularProgress size={24} /> : 'Salvar'}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Diálogo de confirmação de exclusão */}
          <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza que deseja excluir o conteúdo "{selectedContent?.title}"? Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog} color="inherit">Cancelar</Button>
              <Button 
                onClick={handleDeleteContent} 
                color="error" 
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Excluir'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      );
    };
    
    export default ContentManagement;