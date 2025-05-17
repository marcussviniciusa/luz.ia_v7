import React, { useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Link, 
  InputAdornment, 
  IconButton,
  CircularProgress
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon 
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { SnackbarContext } from '../../contexts/SnackbarContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { showError } = useContext(SnackbarContext);
  
  // Estados para campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validar email
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
      isValid = false;
    }

    // Validar senha
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulário
    if (!validateForm()) {
      return;
    }
    
    // Iniciar loading
    setLoading(true);
    
    try {
      // Chamar função de login do contexto
      const result = await login(email, password);
      
      if (result.success) {
        // Login bem-sucedido, redirecionar para o dashboard
        navigate('/dashboard');
      } else {
        // Exibir mensagem de erro
        showError(result.message || 'Erro ao realizar login. Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      showError('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
        Bem-vinda de volta
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!errors.email}
          helperText={errors.email}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="primary" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password}
          helperText={errors.password}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Link component={RouterLink} to="/forgot-password" variant="body2">
          Esqueceu sua senha?
        </Link>
      </Box>
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        size="large"
        disabled={loading}
        sx={{ 
          mt: 2, 
          mb: 3,
          py: 1.5,
          position: 'relative'
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" sx={{ position: 'absolute' }} />
        ) : (
          'Entrar'
        )}
      </Button>
      
      <Typography variant="body2" align="center">
        Ainda não tem uma conta?{' '}
        <Link component={RouterLink} to="/register" fontWeight="bold">
          Cadastre-se aqui
        </Link>
      </Typography>
    </Box>
  );
}

export default Login;
