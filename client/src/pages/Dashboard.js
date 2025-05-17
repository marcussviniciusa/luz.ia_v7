import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Divider,
  Avatar,
  IconButton,
  Skeleton,
  useTheme
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Book as BookIcon, 
  Spa as SpaIcon, 
  Stars as StarsIcon,
  SelfImprovement as SelfImprovementIcon,
  Today as TodayIcon,
  Celebration as CelebrationIcon,
  ArrowForward as ArrowForwardIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { SnackbarContext } from '../contexts/SnackbarContext';
import styled from '@emotion/styled';

// Componente para destacar com gradiente dourado
const GoldGradient = styled.span`
  background: linear-gradient(90deg, #FFD700, #F9A825);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
`;

// Componente de cartão com efeito de hover
const FeatureCard = styled(Card)`
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  height: 100%;
  border-radius: 12px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #FFD700, #F9A825);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

// Componente de avatar destacado para ícones
const FeatureAvatar = styled(Avatar)`
  background: linear-gradient(135deg, ${props => props.bgcolor || '#1B5E20'}, ${props => props.bglight || '#2E7D32'});
  margin-bottom: 16px;
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showError } = useContext(SnackbarContext);
  
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayPractice, setTodayPractice] = useState(null);
  const [milestone, setMilestone] = useState(null);

  // Carregar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obter estatísticas gerais
        const statsResponse = await axios.get('/api/analytics/me');
        
        // Obter atividade recente
        const activityResponse = await axios.get('/api/analytics/me/recent-activity');
        
        // Obter marcos (milestones)
        const milestonesResponse = await axios.get('/api/analytics/me/milestones');
        
        // Buscar práticas em destaque
        const practicasResponse = await axios.get('/api/praticas?destaque=true');
        
        setStats(statsResponse.data.data);
        setRecentActivity(activityResponse.data.data);
        
        // Definir um marco não-visto aleatório
        const alcancados = milestonesResponse.data.data.alcancados;
        if (alcancados && alcancados.length > 0) {
          const randomIndex = Math.floor(Math.random() * alcancados.length);
          setMilestone(alcancados[randomIndex]);
        }
        
        // Selecionar uma prática em destaque
        const praticas = practicasResponse.data.data;
        if (praticas && praticas.length > 0) {
          const randomIndex = Math.floor(Math.random() * praticas.length);
          setTodayPractice(praticas[randomIndex]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        showError('Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showError]);

  // Principais funcionalidades
  const features = [
    {
      id: 'luz-ia',
      title: 'LUZ IA',
      description: 'Converse com a Inteligência Artificial para insights, reflexões e desenvolvimento pessoal.',
      icon: <ChatIcon fontSize="large" />,
      color: '#0288D1',
      lightColor: '#03A9F4',
      path: '/luz-ia'
    },
    {
      id: 'diario',
      title: 'Diário Quântico',
      description: 'Registre seus pensamentos, emoções e celebre suas pequenas vitórias diárias.',
      icon: <BookIcon fontSize="large" />,
      color: '#7B1FA2',
      lightColor: '#9C27B0',
      path: '/diario-quantico'
    },
    {
      id: 'manifestacao',
      title: 'Manifestação',
      description: 'Crie seu quadro de visualização digital e defina seus objetivos com clareza.',
      icon: <StarsIcon fontSize="large" />,
      color: '#F9A825',
      lightColor: '#FFC107',
      path: '/manifestacao'
    },
    {
      id: 'praticas',
      title: 'Práticas Guiadas',
      description: 'Acesse meditações guiadas e exercícios para elevar seu estado vibracional.',
      icon: <SpaIcon fontSize="large" />,
      color: '#388E3C',
      lightColor: '#4CAF50',
      path: '/praticas'
    }
  ];

  return (
    <Box>
      {/* Cabeçalho de boas-vindas */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bem-vinda, <GoldGradient>{user?.name?.split(' ')[0] || 'Jornada'}</GoldGradient>!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Que ótimo ter você no Portal Mente Merecedora. O que gostaria de explorar hoje?
        </Typography>
      </Box>

      {/* Principais funcionalidades */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.id}>
            <FeatureCard>
              <CardContent sx={{ pt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <FeatureAvatar bgcolor={feature.color} bglight={feature.lightColor}>
                  {feature.icon}
                </FeatureAvatar>
                <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => navigate(feature.path)}
                  endIcon={<ArrowForwardIcon />}
                >
                  Acessar
                </Button>
              </CardActions>
            </FeatureCard>
          </Grid>
        ))}
      </Grid>

      {/* Seção de Destaques e Estatísticas */}
      <Grid container spacing={3}>
        {/* Coluna da Esquerda */}
        <Grid item xs={12} md={4}>
          {/* Prática Recomendada */}
          <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SelfImprovementIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2" fontWeight="bold">
                Prática Sugerida
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading || !todayPractice ? (
              <>
                <Skeleton variant="rectangular" height={40} sx={{ mb: 2, borderRadius: 1 }} />
                <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
                <Skeleton variant="text" height={24} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={36} width={120} sx={{ borderRadius: 1 }} />
              </>
            ) : (
              <>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {todayPractice.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {todayPractice.descricao}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Duração: {Math.floor(todayPractice.duracao / 60)} minutos
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="small"
                  onClick={() => navigate(`/praticas/${todayPractice._id}`)}
                >
                  Praticar Agora
                </Button>
              </>
            )}
          </Paper>

          {/* Marco Alcançado */}
          {milestone && (
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'rgba(255, 215, 0, 0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CelebrationIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                <Typography variant="h6" component="h2" fontWeight="bold">
                  Marco Alcançado!
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {milestone.titulo}
              </Typography>
              <Typography variant="body2" paragraph>
                {milestone.descricao}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {milestone.data ? `Alcançado em: ${new Date(milestone.data).toLocaleDateString('pt-BR')}` : ''}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Coluna Central - Atividade Recente */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TodayIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2" fontWeight="bold">
                Atividade Recente
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Skeleton variant="text" height={24} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" height={20} width="60%" />
                </Box>
              ))
            ) : recentActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Você ainda não tem atividades registradas. Comece explorando as ferramentas!
              </Typography>
            ) : (
              <Box>
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < 4 ? '1px solid #eee' : 'none' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {activity.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(activity.date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            
            <Button 
              variant="text" 
              color="primary" 
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/analytics')}
              sx={{ mt: 1 }}
            >
              Ver Mais
            </Button>
          </Paper>
        </Grid>

        {/* Coluna da Direita */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BarChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2" fontWeight="bold">
                Seu Progresso
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <Box key={index} sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" height={24} />
                    <Skeleton variant="text" height={20} width="60%" />
                  </Box>
                </Box>
              ))
            ) : (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Entradas no Diário
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#7B1FA2', mr: 2 }}>
                      <BookIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {stats?.totalDiarioEntries || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stats?.streak > 0 ? `${stats.streak} dias consecutivos` : 'Comece seu registro diário'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Práticas Concluídas
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#388E3C', mr: 2 }}>
                      <SpaIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {stats?.totalPraticas || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total de práticas realizadas
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Conversas com LUZ IA
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#0288D1', mr: 2 }}>
                      <ChatIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {stats?.totalConversations || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Conversas realizadas
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Button 
                  fullWidth
                  variant="outlined" 
                  color="primary" 
                  onClick={() => navigate('/analytics')}
                  sx={{ mt: 2 }}
                >
                  Ver Estatísticas Completas
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
