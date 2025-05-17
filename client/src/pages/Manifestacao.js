import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Divider,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  Image as ImageIcon, 
  FormatListBulleted as FormatListCheckedIcon,
  Flare as FlareIcon,
  Add as AddIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { SnackbarContext } from '../contexts/SnackbarContext';
import { styled } from '@mui/material/styles';
import QuadroVisualizacao from '../components/manifestacao/QuadroVisualizacao';
import ListaManifestacao from '../components/manifestacao/ListaManifestacao';
import SimbolosManifestacao from '../components/manifestacao/SimbolosManifestacao';

// Estilos personalizados
const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.secondary.main,
    height: 3,
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 'bold',
    fontSize: '1rem',
    minHeight: 60,
  },
  '& .Mui-selected': {
    color: theme.palette.secondary.main,
  },
}));

// Componente principal
function Manifestacao() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { showError } = useContext(SnackbarContext);
  
  // Estados
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [manifestacoesData, setManifestacoesData] = useState({
    quadros: [],
    listas: [],
    simbolos: []
  });
  
  // Carregar dados de manifestação
  useEffect(() => {
    const fetchManifestacaoData = async () => {
      try {
        // Obter token do localStorage
        const token = localStorage.getItem('token');
        
        // Configurar headers com token de autorização
        const config = {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        };
        
        // Buscar todos os dados de manifestação de uma vez só usando a rota principal
        const response = await axios.get('/api/manifestacao', config);
        
        if (response.data.success) {
          // Filtrar os dados por tipo
          const todas = response.data.data || [];
          const quadros = todas.filter(item => item.tipo === 'quadro');
          const listas = todas.filter(item => item.tipo === 'checklist');
          const simbolos = todas.filter(item => item.tipo === 'simbolo');
          
          setManifestacoesData({ quadros, listas, simbolos });
        } else {
          setManifestacoesData({ quadros: [], listas: [], simbolos: [] });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados de manifestação:', error);
        showError('Não foi possível carregar os dados de manifestação. Verifique se está autenticado.');
        setLoading(false);
      }
    };
    
    fetchManifestacaoData();
  }, [showError]);
  
  // Mudança de aba
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ferramentas de Manifestação
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Visualize, planeje e materialize seus desejos e objetivos.
        </Typography>
      </Box>
      
      {/* Abas */}
      <Paper elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
        <StyledTabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          centered
        >
          <Tab 
            icon={<ImageIcon />} 
            label="Quadro de Visualização" 
            iconPosition="start"
          />
          <Tab 
            icon={<FormatListCheckedIcon />} 
            label="Lista de Manifestação" 
            iconPosition="start"
          />
          <Tab 
            icon={<FlareIcon />} 
            label="Símbolos Pessoais" 
            iconPosition="start"
          />
        </StyledTabs>
      </Paper>
      
      {/* Conteúdo das abas */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Quadro de Visualização */}
          {activeTab === 0 && (
            <QuadroVisualizacao quadros={manifestacoesData.quadros} />
          )}
          
          {/* Lista de Manifestação */}
          {activeTab === 1 && (
            <ListaManifestacao listas={manifestacoesData.listas} />
          )}
          
          {/* Símbolos Pessoais */}
          {activeTab === 2 && (
            <SimbolosManifestacao simbolos={manifestacoesData.simbolos} />
          )}
        </Box>
      )}
    </Box>
  );
}

export default Manifestacao;
