import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress 
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Book as BookIcon,
  Psychology as PsychologyIcon,
  SelfImprovement as SelfImprovementIcon
} from '@mui/icons-material';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalContent: 0,
    totalPraticas: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Normalmente faríamos uma chamada à API aqui
        // const response = await axios.get('/api/admin/stats');
        // setStats(response.data);
        
        // Para fins de demonstração, usamos dados simulados
        setTimeout(() => {
          setStats({
            totalUsers: 157,
            pendingUsers: 12,
            totalContent: 45,
            totalPraticas: 23
          });
          
          setRecentActivities([
            { id: 1, type: 'user', action: 'Nova conta criada', user: 'Maria Silva', date: '15 maio, 2025' },
            { id: 2, type: 'content', action: 'Nova prática adicionada', user: 'Admin', date: '14 maio, 2025' },
            { id: 3, type: 'luzia', action: 'Base de conhecimento atualizada', user: 'Admin', date: '13 maio, 2025' }
          ]);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Painel Administrativo
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ 
                p: 2, 
                borderTop: '4px solid #1B5E20',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="textSecondary">Usuários Totais</Typography>
                  <PeopleIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>{stats.totalUsers}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 'auto' }}>
                  {stats.pendingUsers} usuários pendentes
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ 
                p: 2, 
                borderTop: '4px solid #4CAF50',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="textSecondary">Conteúdos</Typography>
                  <BookIcon sx={{ color: '#4CAF50' }} />
                </Box>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>{stats.totalContent}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 'auto' }}>
                  Artigos e recursos
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ 
                p: 2, 
                borderTop: '4px solid #8D6E63',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="textSecondary">LUZ IA</Typography>
                  <PsychologyIcon sx={{ color: '#8D6E63' }} />
                </Box>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>7.3k</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 'auto' }}>
                  Interações este mês
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={3} sx={{ 
                p: 2, 
                borderTop: '4px solid #FFD700',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="textSecondary">Práticas Guiadas</Typography>
                  <SelfImprovementIcon sx={{ color: '#FFD700' }} />
                </Box>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>{stats.totalPraticas}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 'auto' }}>
                  Áudios e exercícios
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Atividades Recentes" 
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ backgroundColor: 'primary.light', color: 'white' }}
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {recentActivities.map((activity) => (
                      <React.Fragment key={activity.id}>
                        <ListItem>
                          <ListItemIcon>
                            {activity.type === 'user' && <PeopleIcon />}
                            {activity.type === 'content' && <BookIcon />}
                            {activity.type === 'luzia' && <PsychologyIcon />}
                            {activity.type === 'praticas' && <SelfImprovementIcon />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={activity.action} 
                            secondary={`${activity.user} • ${activity.date}`}
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardHeader 
                  title="Visão Geral do Sistema" 
                  titleTypographyProps={{ variant: 'h6' }}
                  sx={{ backgroundColor: 'primary.light', color: 'white' }}
                />
                <Divider />
                <CardContent>
                  <Typography variant="body1" paragraph>
                    O Portal Mente Merecedora está funcionando normalmente.
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Última atualização: 15 maio, 2025, 14:23
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Versão do sistema: 7.2.1
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status do servidor: Online
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AdminDashboard;
