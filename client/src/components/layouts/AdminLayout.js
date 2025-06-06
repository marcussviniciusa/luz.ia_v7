import React, { useState, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem,
  Button,
  useMediaQuery, 
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  Memory as MemoryIcon, 
  Spa as SpaIcon, 
  ContentPaste as ContentIcon, 
  BarChart as BarChartIcon, 
  Person as PersonIcon, 
  Logout as LogoutIcon, 
  Home as HomeIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { SnackbarContext } from '../../contexts/SnackbarContext';
import styled from '@emotion/styled';

const drawerWidth = 260;

// Estilização do fundo verde escuro texturizado para admin
const AdminBg = styled.div`
  background-color: #0c2816; // Verde mais escuro para área admin
  background-image: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%);
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(255,255,255,.05)' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.3;
  }
`;

// Elemento dourado para realçar a navegação ativa
const GoldAccent = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, #FFD700, #D6B800);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
`;

function AdminLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { showSuccess } = useContext(SnackbarContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Estilos simplificados para o layout
  const mainContentStyle = {
    flexGrow: 1,
    width: { md: `calc(100% - ${drawerWidth}px)` },
    ml: { md: `${drawerWidth}px` },
    p: 3, // Padding uniforme em todos os lados
    pt: { xs: 8, sm: 9 }, // Padding extra no topo para compensar o AppBar
    minHeight: '100vh',
  };
  
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    showSuccess('Você saiu do sistema com sucesso');
    navigate('/login');
  };
  
  // Verificar se o usuário é admin
  if (user && user.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Usuários', icon: <PeopleIcon />, path: '/admin/users' },
    // Item temporariamente desativado
    // { text: 'Conteúdo', icon: <ContentIcon />, path: '/admin/content' },
    { text: 'LUZ IA', icon: <MemoryIcon />, path: '/admin/luz-ia' },
    { text: 'Práticas Guiadas', icon: <SpaIcon />, path: '/admin/praticas' },
    { text: 'Estatísticas', icon: <BarChartIcon />, path: '/admin/stats' }
  ];
  
  // Drawer content (sidebar)
  const drawer = (
    <AdminBg sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ overflow: 'auto', flex: 1, color: 'text.light', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: 2,
          mb: 2 
        }}>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 'bold', 
              color: theme.palette.secondary.main,
              textAlign: 'center',
              mb: 1
            }}
          >
            Administração
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center'
            }}
          >
            Ecossistema Mente Merecedora
          </Typography>
        </Box>
        
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.text} disablePadding sx={{ my: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    position: 'relative',
                    bgcolor: isActive ? 'rgba(0,0,0,0.3)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.4)',
                    },
                  }}
                >
                  {isActive && <GoldAccent />}
                  <ListItemIcon sx={{ color: isActive ? theme.palette.secondary.main : 'rgba(255,255,255,0.7)' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: 14,
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />
        
        <Box sx={{ px: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ 
              borderRadius: 2,
              py: 1,
              borderColor: 'rgba(255, 215, 0, 0.5)',
              '&:hover': {
                borderColor: theme.palette.secondary.main,
                backgroundColor: 'rgba(255, 215, 0, 0.1)'
              }
            }}
          >
            Área do Usuário
          </Button>
        </Box>
      </Box>
    </AdminBg>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* AppBar superior */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#0c2816', // Verde escuro para o header admin
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>Admin:</Box>
            {location.pathname === '/admin' ? 'Dashboard' : 
             location.pathname === '/admin/users' ? 'Usuários' :
             location.pathname === '/admin/content' ? 'Conteúdo' :
             location.pathname === '/admin/luzia' ? 'LUZ IA' :
             location.pathname === '/admin/practices' ? 'Práticas' :
             location.pathname === '/admin/stats' ? 'Estatísticas' : 'Admin'}
          </Typography>
          <Box>
            <IconButton
              edge="end"
              aria-label="perfil do administrador"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              size="small"
              sx={{ ml: 2 }}
            >
              <Avatar
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: '#0c2816', // Verde escuro para avatar do admin
                  border: `2px solid ${theme.palette.secondary.main}`
                }}
                alt={user?.name || 'Admin'}
                src={user?.profileImage ? `/api/perfil/foto/${user.profileImage}` : undefined}
              >
                {user?.name?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Menu do perfil */}
      <Menu
        anchorEl={anchorEl}
        id="profile-menu"
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            mt: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 2
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user?.name || 'Admin'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || ''}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 'bold', mt: 0.5 }}>
            Administrador
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Meu Perfil</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { navigate('/dashboard'); handleMenuClose(); }}>
          <ListItemIcon>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Área do Usuário</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Sidebar - Versão mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Sidebar - Versão desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            height: '100vh',
            border: 'none',
            backgroundColor: 'transparent'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      
      {/* Área de conteúdo principal */}
      <Box component="main" sx={mainContentStyle}>
        <Outlet /> {/* Renderiza as rotas filhas */}
      </Box>
    </Box>
  );
}

export default AdminLayout;
