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
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Chat as ChatIcon, 
  Book as BookIcon, 
  Spa as SpaIcon, 
  BarChart as BarChartIcon, 
  Stars as StarsIcon, 
  Person as PersonIcon, 
  Logout as LogoutIcon, 
  Settings as SettingsIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { SnackbarContext } from '../../contexts/SnackbarContext';
import styled from '@emotion/styled';

const drawerWidth = 260;

// Estilização do fundo verde escuro texturizado (estilo admin)
const GreenTexturedBackground = styled.div`
  background-color: ${props => props.theme.palette.background.emerald};
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

function DashboardLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { showSuccess } = useContext(SnackbarContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
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
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'LUZ IA', icon: <ChatIcon />, path: '/luz-ia' },
    { text: 'Diário Quântico', icon: <BookIcon />, path: '/diario-quantico' },
    { text: 'Manifestação', icon: <StarsIcon />, path: '/manifestacao' },
    { text: 'Práticas Guiadas', icon: <SpaIcon />, path: '/praticas' },
    { text: 'Meu Progresso', icon: <BarChartIcon />, path: '/analytics' }
  ];
  
  // Drawer content (sidebar)
  const drawer = (
    <GreenTexturedBackground theme={theme}>
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column', color: 'text.light', minHeight: '100vh' }}>
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
            Ecossistema Mente Merecedora
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center'
            }}
          >
            Jornada de Transformação
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
                    bgcolor: isActive ? 'rgba(0,0,0,0.2)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.3)',
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
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.5)', 
              textAlign: 'center',
              fontSize: '0.75rem',
              mb: 1
            }}
          >
            Transforme sua mente, transforme sua vida
          </Typography>
        </Box>
      </Box>
    </GreenTexturedBackground>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#FFFFFF',
          color: theme.palette.text.primary,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Ecossistema Mente Merecedora'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              edge="end"
              aria-label="perfil do usuário"
              aria-haspopup="true"
              color="inherit"
            >
              <Avatar
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: theme.palette.primary.main,
                  border: `2px solid ${theme.palette.secondary.main}`
                }}
                alt={user?.name || 'Usuário'}
                src={user?.profileImage ? `/api/perfil/foto/${user.profileImage}` : undefined}
              >
                {user?.name?.charAt(0) || 'U'}
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
            {user?.name || 'Usuário'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || ''}
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Meu Perfil</ListItemText>
        </MenuItem>
        
        {user?.role === 'admin' && (
          <MenuItem onClick={() => { navigate('/admin'); handleMenuClose(); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Administração</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Sidebar / Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
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
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              height: '100%',
              minHeight: '100vh'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default
        }}
      >
        <Toolbar /> {/* Espaçamento para o AppBar */}
        <Outlet /> {/* Renderiza as rotas filhas */}
      </Box>
    </Box>
  );
}

export default DashboardLayout;
