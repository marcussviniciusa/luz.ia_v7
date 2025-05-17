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
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon 
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { SnackbarContext } from '../../contexts/SnackbarContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const { showSuccess, showError } = useContext(SnackbarContext);
  
  // Estados para campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validar nome
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }

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
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    // Validar confirmação de senha
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
      isValid = false;
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'As senhas não coincidem';
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
      // Chamar função de registro do contexto
      const result = await register({
        name,
        email,
        password
      });
      
      if (result.success) {
        // Registro bem-sucedido
        setRegistrationSuccess(true);
        showSuccess('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.');
      } else {
        // Exibir mensagem de erro
        showError(result.message || 'Erro ao realizar cadastro. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      showError('Ocorreu um erro ao tentar fazer o cadastro. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Se o registro foi bem-sucedido, mostrar mensagem de sucesso
  if (registrationSuccess) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
          Cadastro Realizado!
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
            Seu cadastro foi recebido com sucesso! 
          </Typography>
          <Typography variant="body1" paragraph>
            Agora é necessário aguardar a aprovação do administrador para acessar o sistema.
            Você receberá uma notificação por email quando sua conta for aprovada.
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
        Criar Conta
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="name"
          label="Nome Completo"
          name="name"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="primary" />
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
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
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
          autoComplete="new-password"
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
          sx={{ mb: 2 }}
        />
        
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirmar Senha"
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Ao se cadastrar, você concorda com nossos termos de uso e política de privacidade.
      </Typography>
      
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
          'Cadastrar'
        )}
      </Button>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="body2" align="center">
        Já tem uma conta?{' '}
        <Link component={RouterLink} to="/login" fontWeight="bold">
          Faça login
        </Link>
      </Typography>
    </Box>
  );
}

export default Register;
