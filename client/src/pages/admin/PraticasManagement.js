import React, { useState, useEffect, useContext } from 'react';
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
  Chip
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
  const [currentPratica, setCurrentPratica] = useState({
    titulo: '',
    descricao: '',
    categoria: 'meditacao',
    duracao: 10,
    audioUrl: '',
    imagemUrl: '',
    publico: true
  });
  const [file, setFile] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categorias] = useState(['meditacao', 'respiracao', 'relaxamento', 'sono', 'visualizacao', 'outros']);
  
  const { showSuccess, showError } = useContext(SnackbarContext);

  useEffect(() => {
    fetchPraticas();
  }, []);

  const fetchPraticas = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/praticas');
      setPraticas(res.data.data);
      setLoading(false);
    } catch (error) {
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
      audioUrl: '',
      imagemUrl: '',
      publico: true
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
    setFile(e.target.files[0]);
  };

  const handleImagemChange = (e) => {
    setImagem(e.target.files[0]);
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
    const formData = new FormData();
    
    Object.keys(currentPratica).forEach(key => {
      formData.append(key, currentPratica[key]);
    });
    
    if (file) {
      formData.append('audioFile', file);
    }
    
    if (imagem) {
      formData.append('imagemFile', imagem);
    }

    try {
      setLoading(true);
      if (editMode) {
        await axios.put(`/api/praticas/${currentPratica._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        showSuccess('Prática guiada atualizada com sucesso');
      } else {
        await axios.post('/api/praticas', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        showSuccess('Prática guiada adicionada com sucesso');
      }
      setLoading(false);
      setOpen(false);
      fetchPraticas();
    } catch (error) {
      showError('Erro ao salvar prática guiada');
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Duração (min)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {praticas.length > 0 ? (
              praticas.map((pratica) => (
                <TableRow key={pratica._id}>
                  <TableCell>{pratica.titulo}</TableCell>
                  <TableCell>
                    <Chip 
                      label={pratica.categoria} 
                      color="primary" 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{pratica.duracao}</TableCell>
                  <TableCell>
                    <Chip 
                      label={pratica.publico ? 'Público' : 'Privado'} 
                      color={pratica.publico ? 'success' : 'default'} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => window.open(pratica.audioUrl, '_blank')}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEdit(pratica)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(pratica._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhuma prática guiada cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mt: 2, py: 1.5 }}
              >
                Upload de Áudio
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {(file || currentPratica.audioUrl) && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {file ? file.name : 'Arquivo de áudio já existente'}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mt: 2, py: 1.5 }}
              >
                Upload de Imagem
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImagemChange}
                />
              </Button>
              {(imagem || currentPratica.imagemUrl) && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {imagem ? imagem.name : 'Imagem já existente'}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="publico-label">Visibilidade</InputLabel>
                <Select
                  labelId="publico-label"
                  name="publico"
                  value={currentPratica.publico}
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
