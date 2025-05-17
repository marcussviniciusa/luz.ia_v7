import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  CircularProgress,
  Slider,
  Tabs,
  Tab,
  Divider,
  useTheme,
  Grow,
  Pagination
} from '@mui/material';
import { 
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Spa as SpaIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  AccessTime as AccessTimeIcon, 
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon
} from '@mui/icons-material';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { SnackbarContext } from '../contexts/SnackbarContext';

// Componentes estilizados
const PraticaCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 2,
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.12)',
  },
}));

const PlayerBox = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center'
}));

const ProgressBar = styled(Box)(({ theme, value = 0 }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${value}%`,
    backgroundColor: theme.palette.primary.main,
    transition: 'width 1s linear',
  },
}));

const AudioSeekSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.primary.main,
  height: 4,
  '& .MuiSlider-thumb': {
    width: 12,
    height: 12,
    transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
    },
  },
  '& .MuiSlider-rail': {
    opacity: 0.28,
  },
}));

// Categorias de práticas
const categorias = [
  { id: 'todas', label: 'Todas' },
  { id: 'meditacao', label: 'Meditação' },
  { id: 'afirmacoes', label: 'Afirmações' },
  { id: 'visualizacao', label: 'Visualização' },
  { id: 'relaxamento', label: 'Relaxamento' },
  { id: 'respiracao', label: 'Respiração' }
];

function PraticasGuiadas() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { showSuccess, showError } = useContext(SnackbarContext);
  const audioRef = useRef(null);
  
  // Estados
  const [praticas, setPraticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPratica, setSelectedPratica] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.7);
  const [activeCategory, setActiveCategory] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;
  
  // Carregar práticas guiadas
  useEffect(() => {
    const fetchPraticas = async () => {
      try {
        const params = {
          page,
          limit: itemsPerPage,
          ...(activeCategory !== 'todas' ? { categoria: activeCategory } : {}),
          ...(searchTerm ? { search: searchTerm } : {})
        };
        
        const response = await axios.get('/api/praticas', { params });
        
        if (response.data.success) {
          setPraticas(response.data.data);
          setTotalPages(Math.ceil(response.data.total / itemsPerPage));
        } else {
          showError('Erro ao carregar práticas guiadas.');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar práticas:', error);
        showError('Não foi possível carregar as práticas guiadas. Tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    fetchPraticas();
  }, [showError, activeCategory, searchTerm, page]);
  
  // Configurar audio player
  useEffect(() => {
    if (audioRef.current) {
      // Manipuladores de eventos de áudio
      const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
      };
      
      const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        // Registrar conclusão da prática
        if (selectedPratica) {
          registrarPraticaConcluida(selectedPratica._id);
        }
      };
      
      // Definir volume inicial
      audioRef.current.volume = volume;
      
      // Adicionar event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', handleEnded);
      
      // Limpar event listeners
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [selectedPratica]);
  
  // Registrar prática concluída
  const registrarPraticaConcluida = async (praticaId) => {
    try {
      await axios.post(`/api/praticas/${praticaId}/concluir`);
      
      // Atualizar status de conclusão na lista local
      setPraticas(prevPraticas => 
        prevPraticas.map(p => 
          p._id === praticaId ? { ...p, concluida: true } : p
        )
      );
    } catch (error) {
      console.error('Erro ao registrar prática concluída:', error);
    }
  };
  
  // Função para iniciar uma prática
  const iniciarPratica = (pratica) => {
    setSelectedPratica(pratica);
    
    // Reiniciar estado do player
    setCurrentTime(0);
    setDuration(0);
    
    // Iniciar reprodução após carregar metadados
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('Erro ao reproduzir áudio:', error);
            showError('Não foi possível reproduzir o áudio. Tente novamente.');
          });
      }
    }, 100);
  };
  
  // Alternar entre play e pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play()
          .catch(error => {
            console.error('Erro ao reproduzir áudio:', error);
            showError('Não foi possível reproduzir o áudio. Tente novamente.');
          });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Alternar mudo
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = previousVolume;
        setVolume(previousVolume);
      } else {
        setPreviousVolume(volume);
        audioRef.current.volume = 0;
        setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };
  
  // Ajustar volume
  const handleVolumeChange = (event, newValue) => {
    if (audioRef.current) {
      const volumeValue = newValue / 100;
      audioRef.current.volume = volumeValue;
      setVolume(volumeValue);
      setIsMuted(volumeValue === 0);
    }
  };
  
  // Buscar posição de tempo
  const handleSeek = (event, newValue) => {
    if (audioRef.current) {
      const seekTime = (newValue / 100) * duration;
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  // Favoritar prática
  const toggleFavorite = async (praticaId) => {
    try {
      const response = await axios.post(`/api/praticas/${praticaId}/favoritar`);
      
      if (response.data.success) {
        // Atualizar status de favorito na lista local
        setPraticas(prevPraticas => 
          prevPraticas.map(p => 
            p._id === praticaId ? { ...p, favorita: !p.favorita } : p
          )
        );
        
        showSuccess(response.data.message || 'Status de favorito atualizado!');
      } else {
        showError(response.data.message || 'Erro ao favoritar prática.');
      }
    } catch (error) {
      console.error('Erro ao favoritar prática:', error);
      showError('Ocorreu um erro ao favoritar a prática. Tente novamente mais tarde.');
    }
  };
  
  // Formatar tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calcular porcentagem de progresso
  const calculateProgress = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };
  
  // Alterar categoria
  const handleCategoryChange = (event, newValue) => {
    setActiveCategory(newValue);
    setPage(1); // Resetar para primeira página
  };
  
  // Alterar página
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Pesquisar
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Resetar para primeira página
  };
  
  return (
    <Box sx={{ pb: 10 }}> {/* Espaço para o player */}
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Práticas Guiadas
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Acesse meditações guiadas e exercícios para elevar seu estado vibracional.
        </Typography>
      </Box>
      
      {/* Filtros e Pesquisa */}
      <Paper elevation={1} sx={{ mb: 4, borderRadius: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Tabs
                value={activeCategory}
                onChange={handleCategoryChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              >
                {categorias.map(categoria => (
                  <Tab 
                    key={categoria.id} 
                    value={categoria.id} 
                    label={categoria.label}
                    sx={{
                      '&.Mui-selected': {
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                      },
                    }}
                  />
                ))}
              </Tabs>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box component="form" onSubmit={handleSearch}>
                <TextField
                  fullWidth
                  placeholder="Pesquisar práticas..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit" edge="end">
                        <SearchIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Lista de Práticas */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : praticas.length === 0 ? (
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
          <SpaIcon sx={{ fontSize: 60, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Nenhuma prática encontrada
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchTerm 
              ? `Não encontramos práticas para "${searchTerm}". Tente outra busca.` 
              : `Não há práticas disponíveis na categoria "${categorias.find(c => c.id === activeCategory)?.label || activeCategory}".`
            }
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {praticas.map((pratica) => (
              <Grid item xs={12} sm={6} md={4} key={pratica._id}>
                <Grow in={true} timeout={300}>
                  <PraticaCard>
                    <CardMedia
                      component="img"
                      height="180"
                      image={pratica.imagemUrl || '/static/images/pratica-default.jpg'}
                      alt={pratica.titulo}
                    />
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {pratica.titulo}
                        </Typography>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pratica._id);
                          }}
                          color="secondary"
                        >
                          {pratica.favorita ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {pratica.descricao}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {Math.floor(pratica.duracao / 60)} minutos
                        </Typography>
                        
                        <Box sx={{ ml: 'auto' }}>
                          <Chip 
                            label={pratica.categoria} 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                      {pratica.concluida && (
                        <Chip 
                          icon={<SpaIcon fontSize="small" />}
                          label="Concluída" 
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                      
                      <Box sx={{ ml: 'auto' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => iniciarPratica(pratica)}
                        >
                          Iniciar
                        </Button>
                      </Box>
                    </CardActions>
                  </PraticaCard>
                </Grow>
              </Grid>
            ))}
          </Grid>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}
      
      {/* Player de Áudio */}
      {selectedPratica && (
        <PlayerBox>
          <ProgressBar value={calculateProgress()} />
          
          <audio 
            ref={audioRef} 
            src={selectedPratica.audioUrl}
            preload="auto"
          />
          
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} sm={3} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={selectedPratica.imagemUrl || '/static/images/pratica-default.jpg'}
                  alt={selectedPratica.titulo}
                  sx={{ width: 50, height: 50, mr: 2 }}
                />
                <Box>
                  <Typography variant="subtitle1" noWrap sx={{ maxWidth: 180 }}>
                    {selectedPratica.titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPratica.categoria}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <IconButton 
                    onClick={togglePlayPause}
                    color="primary"
                    sx={{ 
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                      width: 40,
                      height: 40
                    }}
                  >
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1, minWidth: 45, textAlign: 'right' }}>
                    {formatTime(currentTime)}
                  </Typography>
                  
                  <AudioSeekSlider
                    value={(currentTime / duration) * 100 || 0}
                    onChange={handleSeek}
                    aria-labelledby="audio-progress-slider"
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1, minWidth: 45 }}>
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={3} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <IconButton onClick={toggleMute} size="small">
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                
                <Slider
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  aria-labelledby="volume-slider"
                  sx={{ width: 100, ml: 1, mr: 2 }}
                />
                
                <IconButton 
                  size="small" 
                  onClick={() => {
                    setSelectedPratica(null);
                    setIsPlaying(false);
                    if (audioRef.current) {
                      audioRef.current.pause();
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </PlayerBox>
      )}
    </Box>
  );
}

export default PraticasGuiadas;
