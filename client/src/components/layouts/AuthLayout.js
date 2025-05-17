import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Link, 
  useTheme 
} from '@mui/material';
import styled from '@emotion/styled';

// Estilização do fundo verde texturizado
const GreenBackground = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.palette.background.emerald};
  background-image: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.1) 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(255,255,255,.075)' fill-rule='evenodd'/%3E%3C/svg%3E");
    opacity: 0.3;
  }
`;

// Elemento decorativo dourado
const GoldDecoration = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, #FFD700, #D6B800);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
`;

// Layout para as telas de autenticação (login, registro, etc)
function AuthLayout() {
  const theme = useTheme();

  return (
    <GreenBackground theme={theme}>
      <Container maxWidth="sm" sx={{ zIndex: 2 }}>
        {/* Logo e título */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: 4,
          mt: -4
        }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: theme.palette.secondary.main,
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              mb: 1
            }}
          >
            Portal Mente Merecedora
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 'normal',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              opacity: 0.9
            }}
          >
            Jornada de Transformação Pessoal
          </Typography>
        </Box>
        
        {/* Container do conteúdo */}
        <Paper
          elevation={4}
          sx={{
            position: 'relative',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            mb: 4,
            overflow: 'hidden'
          }}
        >
          <GoldDecoration />
          <Outlet />
        </Paper>
        
        {/* Rodapé */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              '& a': {
                color: theme.palette.secondary.light,
                textDecoration: 'none',
                fontWeight: 'bold',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }
            }}
          >
            &copy; {new Date().getFullYear()} Portal Mente Merecedora. Todos os direitos reservados.
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Link component={RouterLink} to="/login" color="inherit" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Login
            </Link>
            <Link component={RouterLink} to="/register" color="inherit" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Cadastro
            </Link>
          </Box>
        </Box>
      </Container>
    </GreenBackground>
  );
}

export default AuthLayout;
