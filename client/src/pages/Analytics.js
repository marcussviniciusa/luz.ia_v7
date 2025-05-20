import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarTodayIcon,
  Psychology as PsychologyIcon,
  Spa as SpaIcon,
  Chat as ChatIcon,
  Stars as StarsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { SnackbarContext } from '../contexts/SnackbarContext';
import { styled } from '@mui/material/styles';

// Importar componentes de gráficos
// Nota: Você precisará instalar o react-chartjs-2 e chart.js
// npm install react-chartjs-2 chart.js
import { 
  Line, 
  Bar, 
  Pie, 
  Radar,
  Doughnut 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Componentes estilizados
const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 'medium',
    fontSize: '0.9rem',
    minHeight: 48,
  },
  '& .Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
  },
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const CircularProgressWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

function Analytics() {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { showError } = useContext(SnackbarContext);
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'
  
  // Carregar dados de análise
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`/api/analytics/me?timeRange=${timeRange}`);
        
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          showError('Erro ao carregar dados de análise.');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados de análise:', error);
        showError('Não foi possível carregar os dados de análise. Tente novamente mais tarde.');
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [showError, timeRange]);
  
  // Mudança de aba
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Mudança de intervalo de tempo
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };
  
  // Dados para gráfico de atividade geral
  const getActivityData = () => {
    if (!stats || !stats.atividadeDiaria) return null;
    
    return {
      labels: stats.atividadeDiaria.labels,
      datasets: [
        {
          label: 'Atividade Diária',
          data: stats.atividadeDiaria.data,
          fill: true,
          backgroundColor: `rgba(76, 175, 80, 0.2)`,
          borderColor: theme.palette.primary.main,
          tension: 0.3,
          pointBackgroundColor: theme.palette.primary.main,
          pointRadius: 3,
        }
      ]
    };
  };
  
  // Dados para gráfico de progresso emocional
  const getEmotionalData = () => {
    if (!stats || !stats.progressoEmocional) return null;
    
    return {
      labels: stats.progressoEmocional.labels,
      datasets: [
        {
          label: 'Bem-estar Emocional',
          data: stats.progressoEmocional.data,
          fill: true,
          backgroundColor: `rgba(33, 150, 243, 0.2)`,
          borderColor: '#2196F3',
          tension: 0.3,
          pointBackgroundColor: '#2196F3',
          pointRadius: 3,
        }
      ]
    };
  };
  
  // Dados para gráfico de uso por recurso
  const getResourceUsageData = () => {
    if (!stats || !stats.usoPorRecurso) return null;
    
    return {
      labels: stats.usoPorRecurso.labels,
      datasets: [
        {
          data: stats.usoPorRecurso.data,
          backgroundColor: [
            '#4CAF50', // Verde - Diário
            '#2196F3', // Azul - LUZ IA
            '#9C27B0', // Roxo - Práticas
            '#FF9800', // Laranja - Manifestação
          ],
          borderWidth: 1,
        }
      ]
    };
  };
  
  // Dados para gráfico de radar de áreas de desenvolvimento
  const getDevelopmentAreasData = () => {
    if (!stats || !stats.areaDesenvolvimento) return null;
    
    return {
      labels: stats.areaDesenvolvimento.labels,
      datasets: [
        {
          label: 'Áreas de Desenvolvimento',
          data: stats.areaDesenvolvimento.data,
          backgroundColor: 'rgba(156, 39, 176, 0.2)',
          borderColor: '#9C27B0',
          pointBackgroundColor: '#9C27B0',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#9C27B0'
        }
      ]
    };
  };
  
  // Renderizar gráficos com base na aba ativa
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!stats) {
      return (
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
          <PsychologyIcon sx={{ fontSize: 60, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Sem dados suficientes
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Continue usando o ecossistema para gerar dados de análise e acompanhar seu progresso.
          </Typography>
        </Paper>
      );
    }
    
    // Visão Geral
    if (activeTab === 0) {
      return (
        <Box>
          {/* Estatísticas resumidas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '50%',
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      mr: 2
                    }}
                  >
                    <CalendarTodayIcon sx={{ color: '#4CAF50' }} />
                  </Box>
                  <Typography variant="h6" component="h3">
                    Dias Ativos
                  </Typography>
                </Box>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  {stats.totalDiasAtivos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.sequenciaAtual > 0 ? 
                    `Sequência atual: ${stats.sequenciaAtual} dias` : 
                    'Acesse hoje para iniciar uma sequência!'
                  }
                </Typography>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '50%',
                      bgcolor: 'rgba(33, 150, 243, 0.1)',
                      mr: 2
                    }}
                  >
                    <ChatIcon sx={{ color: '#2196F3' }} />
                  </Box>
                  <Typography variant="h6" component="h3">
                    Conversas
                  </Typography>
                </Box>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  {stats.totalConversas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.conversasRecentes > 0 ? 
                    `${stats.conversasRecentes} nos últimos 7 dias` : 
                    'Converse com a LUZ IA para insights'
                  }
                </Typography>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '50%',
                      bgcolor: 'rgba(156, 39, 176, 0.1)',
                      mr: 2
                    }}
                  >
                    <SpaIcon sx={{ color: '#9C27B0' }} />
                  </Box>
                  <Typography variant="h6" component="h3">
                    Práticas
                  </Typography>
                </Box>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  {stats.totalPraticas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de {Math.round(stats.minutosPratica || 0)} minutos de práticas guiadas
                </Typography>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                      mr: 2
                    }}
                  >
                    <StarsIcon sx={{ color: '#FF9800' }} />
                  </Box>
                  <Typography variant="h6" component="h3">
                    Progresso
                  </Typography>
                </Box>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  {stats.progressoGeral}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Na sua jornada de transformação
                </Typography>
              </StatsCard>
            </Grid>
          </Grid>
          
          {/* Gráficos principais */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <StatsCard>
                <Typography variant="h6" gutterBottom>
                  Atividade Diária
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Seu nível de engajamento com o ecossistema ao longo do tempo
                </Typography>
                
                <Box sx={{ height: 300, mt: 1 }}>
                  {getActivityData() && (
                    <Line 
                      data={getActivityData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              display: true,
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                          }
                        }
                      }}
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button 
                    variant={timeRange === 'week' ? 'contained' : 'outlined'} 
                    size="small"
                    onClick={() => handleTimeRangeChange('week')}
                    sx={{ mx: 1 }}
                  >
                    Semana
                  </Button>
                  <Button 
                    variant={timeRange === 'month' ? 'contained' : 'outlined'} 
                    size="small"
                    onClick={() => handleTimeRangeChange('month')}
                    sx={{ mx: 1 }}
                  >
                    Mês
                  </Button>
                  <Button 
                    variant={timeRange === 'year' ? 'contained' : 'outlined'} 
                    size="small"
                    onClick={() => handleTimeRangeChange('year')}
                    sx={{ mx: 1 }}
                  >
                    Ano
                  </Button>
                </Box>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <StatsCard>
                <Typography variant="h6" gutterBottom>
                  Uso por Recurso
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Distribuição do seu tempo entre as funcionalidades
                </Typography>
                
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {getResourceUsageData() && (
                    <Doughnut 
                      data={getResourceUsageData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          }
                        },
                        cutout: '70%'
                      }}
                    />
                  )}
                </Box>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StatsCard>
                <Typography variant="h6" gutterBottom>
                  Progresso Emocional
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Baseado nas suas entradas no Diário Quântico
                </Typography>
                
                <Box sx={{ height: 300, mt: 1 }}>
                  {getEmotionalData() && (
                    <Line 
                      data={getEmotionalData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          }
                        },
                        scales: {
                          y: {
                            min: 0,
                            max: 5,
                            grid: {
                              display: true,
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                          }
                        }
                      }}
                    />
                  )}
                </Box>
              </StatsCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StatsCard>
                <Typography variant="h6" gutterBottom>
                  Áreas de Desenvolvimento
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Seu progresso em diferentes dimensões
                </Typography>
                
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {getDevelopmentAreasData() && (
                    <Radar 
                      data={getDevelopmentAreasData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          }
                        },
                        scales: {
                          r: {
                            angleLines: {
                              display: true,
                              color: 'rgba(0, 0, 0, 0.1)',
                            },
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                            pointLabels: {
                              font: {
                                size: 10
                              }
                            },
                            suggestedMin: 0,
                            suggestedMax: 10
                          }
                        }
                      }}
                    />
                  )}
                </Box>
              </StatsCard>
            </Grid>
          </Grid>
        </Box>
      );
    }
    
    // Diário Quântico
    if (activeTab === 1) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Análise Detalhada do Diário Quântico
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Em desenvolvimento. Aqui serão exibidos insights detalhados sobre suas entradas no diário.
          </Typography>
        </Box>
      );
    }
    
    // Práticas Guiadas
    if (activeTab === 2) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Análise Detalhada das Práticas Guiadas
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Em desenvolvimento. Aqui serão exibidos insights detalhados sobre suas práticas guiadas.
          </Typography>
        </Box>
      );
    }
    
    // LUZ IA
    if (activeTab === 3) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Análise Detalhada das Conversas com LUZ IA
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Em desenvolvimento. Aqui serão exibidos insights detalhados sobre suas conversas com a LUZ IA.
          </Typography>
        </Box>
      );
    }
    
    // Manifestação
    if (activeTab === 4) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Análise Detalhada das Ferramentas de Manifestação
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Em desenvolvimento. Aqui serão exibidos insights detalhados sobre seu uso das ferramentas de manifestação.
          </Typography>
        </Box>
      );
    }
    
    return null;
  };
  
  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Análise de Progresso
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Acompanhe seu progresso e obtenha insights sobre sua jornada de transformação.
        </Typography>
      </Box>
      
      {/* Abas */}
      <Paper elevation={1} sx={{ mb: 4, borderRadius: 3 }}>
        <StyledTabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Visão Geral" />
          <Tab label="Diário Quântico" />
          <Tab label="Práticas Guiadas" />
          <Tab label="LUZ IA" />
          <Tab label="Manifestação" />
        </StyledTabs>
      </Paper>
      
      {/* Conteúdo */}
      {renderContent()}
    </Box>
  );
}

export default Analytics;
