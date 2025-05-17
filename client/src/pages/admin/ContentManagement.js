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
      // Na implementação real, faríamos uma chamada à API:
      // const response = await axios.get(\`/api/admin/contents?type=$\{getContentTypeFromTab()}\`);
      // setContents(response.data);
      
      // Simulação para demonstração
      setTimeout(() => {
        const mockContents = [
          {
            id: 1,
            title: 'Manifestando Prosperidade',
            description: 'Aprenda técnicas avançadas para manifestar prosperidade em sua vida',
            type: 'article',
            category: 'manifestacao',
            imageUrl: 'https://via.placeholder.com/300x150?text=Prosperidade',
            createdAt: '2025-04-15',
            featured: true
          },
          {
            id: 2,
            title: 'Meditação para Iniciantes',
            description: 'Um guia passo a passo para começar sua prática de meditação',
            type: 'article',
            category: 'praticas',
            imageUrl: 'https://via.placeholder.com/300x150?text=Meditação',
            createdAt: '2025-03-21',
            featured: false
          },
          {
            id: 3,
            title: 'Como usar o Diário Quântico',
            description: 'Tire o máximo proveito do Diário Quântico com estas dicas',
            type: 'article',
            category: 'diario',
            imageUrl: 'https://via.placeholder.com/300x150?text=Diário',
            createdAt: '2025-05-02',
            featured: false
          },
          {
            id: 4,
            title: 'Lei da Atração na Prática',
            description: 'Exemplos práticos de como aplicar a Lei da Atração no dia a dia',
            type: 'video',
            category: 'manifestacao',
            imageUrl: 'https://via.placeholder.com/300x150?text=Lei+da+Atração',
            contentUrl: 'https://example.com/video1.mp4',
            createdAt: '2025-02-18',
            featured: true
          },
          {
            id: 5,
            title: 'Galeria de Símbolos para Manifestação',
            description: 'Coleção de símbolos poderosos para suas práticas de manifestação',
            type: 'gallery',
            category: 'manifestacao',
            imageUrl: 'https://via.placeholder.com/300x150?text=Símbolos',
            createdAt: '2025-04-25',
            featured: false
          },
          {
            id: 6,
            title: 'E-book: Desbloqueando seu Potencial',
            description: 'E-book completo sobre como desbloquear seu potencial interno',
            type: 'ebook',
            category: 'desenvolvimento',
            imageUrl: 'https://via.placeholder.com/300x150?text=E-book',
            contentUrl: 'https://example.com/ebook1.pdf',
            createdAt: '2025-01-30',
            featured: true
          }
        ];
        
        // Filtrar conteúdo com base na aba atual
        const contentType = getContentTypeFromTab();
        const filteredContents = contentType === 'all' 
          ? mockContents 
          : mockContents.filter(content => content.type === contentType);
          
        setContents(filteredContents);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Erro ao buscar conteúdos:', error);
      showError('Erro ao carregar lista de conteúdos');
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
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedContent(null);
  };

  const handleOpenDeleteDialog = (content) => {
    setSelectedContent(content);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedContent(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileUpload(file);
    
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddContent = async () => {
    try {
      setLoading(true);
      // Na implementação real, faríamos upload da imagem e envio do formulário:
      // const formData = new FormData();
      // if (fileUpload) formData.append('image', fileUpload);
      // formData.append('content', JSON.stringify(contentForm));
      // await axios.post('/api/admin/contents', formData);
      
      // Simulação para demonstração
      setTimeout(() => {
        const newContent = {
          id: Date.now(),
          ...contentForm,
          imageUrl: imagePreview || 'https://via.placeholder.com/300x150',
          createdAt: new Date().toISOString().split('T')[0]
        };
        
        setContents(prev => [newContent, ...prev]);
        showSuccess('Conteúdo adicionado com sucesso');
        handleCloseAddDialog();
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Erro ao adicionar conteúdo:', error);
      showError('Erro ao adicionar conteúdo');
      setLoading(false);
    }
  };

  const handleEditContent = async () => {
    try {
      setLoading(true);
      // Na implementação real, faríamos upload da imagem e atualização do conteúdo:
      // const formData = new FormData();
      // if (fileUpload) formData.append('image', fileUpload);
      // formData.append('content', JSON.stringify(contentForm));
      // await axios.put(\`/api/admin/contents/$\{selectedContent.id}\`, formData);
      
      // Simulação para demonstração
      setTimeout(() => {
        const updatedContents = contents.map(content => {
          if (content.id === selectedContent.id) {
            return {
              ...content,
              ...contentForm,
              imageUrl: imagePreview || content.imageUrl
            };
          }
          return content;
        });
        
        setContents(updatedContents);
        showSuccess('Conteúdo atualizado com sucesso');
        handleCloseEditDialog();
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Erro ao atualizar conteúdo:', error);
      showError('Erro ao atualizar conteúdo');
      setLoading(false);
    }
  };

  const handleDeleteContent = async () => {
    try {
      setLoading(true);
      // Na implementação real, faríamos uma chamada à API:
      // await axios.delete(\`/api/admin/contents/$\{selectedContent.id}\`);
      
      // Simulação para demonstração
      setTimeout(() => {
        const updatedContents = contents.filter(content => content.id !== selectedContent.id);
        setContents(updatedContents);
        showSuccess('Conteúdo removido com sucesso');
        handleCloseDeleteDialog();
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao remover conteúdo:', error);
      showError('Erro ao remover conteúdo');
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
          variant="fullWidth"
        >
          <Tab label="Todos" />
          <Tab label="Artigos" />
          <Tab label="Vídeos" />
          <Tab label="E-books" />
          <Tab label="Galerias" />
        </Tabs>
      </Paper>
      
      {loading && contents.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : contents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Nenhum conteúdo encontrado
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Clique em "Novo Conteúdo" para adicionar
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {contents.map((content) => (
            <Grid item xs={12} sm={6} md={4} key={content.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="150"
                  image={content.imageUrl}
                  alt={content.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      icon={getContentTypeIcon(content.type)} 
                      label={content.type.charAt(0).toUpperCase() + content.type.slice(1)} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    {content.featured && (
                      <Chip label="Destaque" size="small" color="secondary" />
                    )}
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {content.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {content.description}
                  </Typography>
                  <Box sx={{ mt: 'auto' }}>
                    <Chip 
                      label={getCategoryLabel(content.category)} 
                      size="small" 
                      color="default" 
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="textSecondary">
                      Criado em: {content.createdAt}
                    </Typography>
                  </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => handleOpenEditDialog(content)}
                    title="Editar"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleOpenDeleteDialog(content)}
                    title="Excluir"
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
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Adicionar Novo Conteúdo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={7}>
              <TextField
                name="title"
                label="Título"
                fullWidth
                margin="dense"
                value={contentForm.title}
                onChange={handleFormChange}
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
            disabled={loading || !contentForm.title}
          >
            {loading ? <CircularProgress size={24} /> : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para editar conteúdo */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Editar Conteúdo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={7}>
              <TextField
                name="title"
                label="Título"
                fullWidth
                margin="dense"
                value={contentForm.title}
                onChange={handleFormChange}
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
            disabled={loading || !contentForm.title}
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
