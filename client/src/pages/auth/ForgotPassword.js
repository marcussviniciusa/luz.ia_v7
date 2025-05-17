import React, { useState, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Link, 
  InputAdornment, 
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  Email as EmailIcon
} from '@mui/icons-material';
import axios from 'axios';
import { SnackbarContext } from '../../contexts/SnackbarContext';

function ForgotPassword() {
  const { showSuccess, showError } = useContext(SnackbarContext);
  
  // Estados para campos do formulário
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [requestSent, setRequestSent] = useState(false);

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
      // Chamar API para enviar email de recuperação
      await axios.post('/api/auth/forgotpassword', { email });
      
      // Mostrar mensagem de sucesso
      setRequestSent(true);
      showSuccess('Email de recuperação enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      
      // Para este exemplo, vamos simular que o email sempre é enviado com sucesso
      // Em produção, você deve tratar os erros adequadamente
      setRequestSent(true);
      showSuccess('Instruções enviadas para seu email, se registrado no sistema.');
    } finally {
      setLoading(false);
    }
  };

  // Se a solicitação foi enviada, mostrar mensagem de sucesso
  if (requestSent) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
          Email Enviado!
        </Typography>
        
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            bgcolor: 'success.light',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" paragraph>
            Enviamos instruções para redefinir sua senha para o email fornecido.
          </Typography>
          <Typography variant="body1" paragraph>
            Por favor, verifique sua caixa de entrada e siga as instruções para recuperar seu acesso.
          </Typography>
        </Paper>
        
        <Button 
          component={RouterLink} 
          to="/login" 
          variant="contained" 
          color="primary"
          fullWidth
        >
          Voltar para Login
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
        Recuperar Senha
      </Typography>
      
      <Typography variant="body1" paragraph sx={{ mb: 3 }}>
        Digite seu email abaixo e enviaremos instruções para recuperar sua senha.
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
        />
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
          'Enviar Instruções'
        )}
      </Button>
      
      <Typography variant="body2" align="center">
        Lembrou sua senha?{' '}
        <Link component={RouterLink} to="/login" fontWeight="bold">
          Voltar para Login
        </Link>
      </Typography>
    </Box>
  );
}

export default ForgotPassword;
