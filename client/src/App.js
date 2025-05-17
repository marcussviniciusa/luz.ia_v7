import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SentimentDissatisfied as SentimentDissatisfiedIcon } from '@mui/icons-material';
import { ThemeProvider, CssBaseline, Box, Typography, Paper } from '@mui/material';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import theme from './theme';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// User Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import LuzIA from './pages/LuzIA';
import DiarioQuantico from './pages/DiarioQuantico';
import Manifestacao from './pages/Manifestacao';
import PraticasGuiadas from './pages/PraticasGuiadas';
import NotFound from './pages/NotFound';
import Analytics from './pages/Analytics';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ContentManagement from './pages/admin/ContentManagement';
import LuzIAManagement from './pages/admin/LuzIAManagement';
import PraticasManagement from './pages/admin/PraticasManagement';

// Protected Route Component
const ProtectedRoute = ({ element, requiredRole, ...rest }) => {
  const { isAuthenticated, user, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verificar status do usuário (apenas usuários aprovados podem acessar)
  if (user && user.status !== 'aprovada') {
    return <Navigate to="/pending" />;
  }

  // Verificar role (para rotas admin)
  if (requiredRole && user && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return element;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Rotas de autenticação */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/pending" element={<PendingApproval />} />
              </Route>

              {/* Rotas do dashboard do usuário */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="/luz-ia" element={<ProtectedRoute element={<LuzIA />} />} />
                <Route path="/diario-quantico" element={<ProtectedRoute element={<DiarioQuantico />} />} />
                <Route path="/manifestacao" element={<ProtectedRoute element={<Manifestacao />} />} />
                <Route path="/praticas" element={<ProtectedRoute element={<PraticasGuiadas />} />} />
                <Route path="/analytics" element={<ProtectedRoute element={<Analytics />} />} />
              </Route>

              {/* Rotas do dashboard de admin */}
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />} />
                <Route path="/admin/users" element={<ProtectedRoute element={<UserManagement />} requiredRole="admin" />} />
                <Route path="/admin/content" element={<ProtectedRoute element={<ContentManagement />} requiredRole="admin" />} />
                <Route path="/admin/luz-ia" element={<ProtectedRoute element={<LuzIAManagement />} requiredRole="admin" />} />
                <Route path="/admin/praticas" element={<ProtectedRoute element={<PraticasManagement />} requiredRole="admin" />} />
              </Route>

              {/* Redirecionamento padrão */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

// Componente para usuários pendentes de aprovação
const PendingApproval = () => {
  return (
    <Box sx={{ 
      p: 5, 
      maxWidth: '800px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.1)' }}>
        <SentimentDissatisfiedIcon sx={{ fontSize: 60, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
        
        <Typography variant="h4" component="h1" gutterBottom>
          Sua conta está aguardando aprovação
        </Typography>
        
        <Typography variant="body1" paragraph>
          Seu cadastro foi recebido e está em análise pela nossa equipe. 
          Assim que for aprovado, você receberá uma notificação por e-mail 
          e poderá acessar todas as funcionalidades do Portal Mente Merecedora.
        </Typography>
        
        <Typography variant="body1" color="primary" fontWeight="medium">
          Agradecemos sua paciência!
        </Typography>
      </Paper>
    </Box>
  );
};

export default App;
