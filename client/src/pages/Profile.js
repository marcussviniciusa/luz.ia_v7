import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  FormControl,
  FormHelperText,
  InputAdornment,
  Chip,
  useTheme
} from '@mui/material';
import { 
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { SnackbarContext } from '../contexts/SnackbarContext';
import { styled } from '@mui/material/styles';

// Componentes estilizados
const ProfilePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.primary.light}`,
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  cursor: 'pointer',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 14px rgba(0, 0, 0, 0.15)',
  },
}));

const UploadInput = styled('input')({
  display: 'none',
});

function Profile() {
  const theme = useTheme();
  const { user, updateProfile } = useContext(AuthContext);
  const { showSuccess, showError } = useContext(SnackbarContext);
  
  // Estados de modo de edição
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  
  // Estado de loading
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  
  // Estado do formulário
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatarPreview: null,
    avatarFile: null
  });
  
  // Estado do formulário de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estado de visibilidade da senha
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Erros de validação
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Atualizar dados do perfil quando o usuário mudar
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        bio: user.bio || '',
        avatarPreview: null,
        avatarFile: null
      });
    }
  }, [user]);
  
  // Função para lidar com alterações no formulário de perfil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Função para lidar com alterações no formulário de senha
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Função para lidar com seleção de arquivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        setProfileData(prev => ({
          ...prev,
          avatarPreview: reader.result,
          avatarFile: file
        }));
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Validar formulário de perfil
  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validar formulário de senha
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Senha atual é obrigatória';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'Nova senha é obrigatória';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Salvar alterações no perfil
  const handleSaveProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }
    
    setLoadingProfile(true);
    
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('bio', profileData.bio);
      
      if (profileData.avatarFile) {
        formData.append('avatar', profileData.avatarFile);
      }
      
      const response = await axios.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Atualizar dados do usuário no contexto de autenticação
        updateProfile(response.data.user);
        
        showSuccess('Perfil atualizado com sucesso!');
        setEditingProfile(false);
      } else {
        showError(response.data.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showError('Ocorreu um erro ao atualizar seu perfil. Tente novamente mais tarde.');
    } finally {
      setLoadingProfile(false);
    }
  };
  
  // Alterar senha
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    setLoadingPassword(true);
    
    try {
      const response = await axios.put('/api/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        showSuccess('Senha alterada com sucesso!');
        
        // Limpar formulário e sair do modo de edição
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setEditingPassword(false);
      } else {
        showError(response.data.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      if (error.response && error.response.data) {
        showError(error.response.data.message || 'Ocorreu um erro ao alterar sua senha');
      } else {
        showError('Ocorreu um erro ao alterar sua senha. Tente novamente mais tarde.');
      }
    } finally {
      setLoadingPassword(false);
    }
  };
  
  // Cancelar edição de perfil
  const handleCancelProfileEdit = () => {
    setProfileData({
      name: user?.name || '',
      bio: user?.bio || '',
      avatarPreview: null,
      avatarFile: null
    });
    
    setProfileErrors({});
    setEditingProfile(false);
  };
  
  // Cancelar edição de senha
  const handleCancelPasswordEdit = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    setPasswordErrors({});
    setEditingPassword(false);
  };

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Meu Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Gerencie suas informações pessoais e preferências.
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        {/* Seção de Perfil */}
        <Grid item xs={12} md={6}>
          <ProfilePaper elevation={2}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              mb: 3
            }}>
              <Typography variant="h6" gutterBottom>
                Informações Pessoais
              </Typography>
              
              {!editingProfile && (
                <Button 
                  startIcon={<EditIcon />} 
                  onClick={() => setEditingProfile(true)}
                >
                  Editar
                </Button>
              )}
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              mb: 4
            }}>
              {/* Avatar */}
              <Box sx={{ 
                mr: { xs: 0, sm: 4 }, 
                mb: { xs: 3, sm: 0 },
                textAlign: 'center'
              }}>
                <UploadInput
                  accept="image/*"
                  id="avatar-upload"
                  type="file"
                  onChange={handleFileChange}
                  disabled={!editingProfile}
                />
                <label htmlFor={editingProfile ? "avatar-upload" : null}>
                  <LargeAvatar
                    src={profileData.avatarPreview || user?.avatarUrl || '/static/images/avatar/default.jpg'}
                    alt={profileData.name}
                    sx={{
                      opacity: editingProfile ? 0.8 : 1,
                    }}
                  />
                  {editingProfile && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Clique para alterar
                    </Typography>
                  )}
                </label>
              </Box>
              
              {/* Formulário de Informações */}
              <Box sx={{ flexGrow: 1 }}>
                {editingProfile ? (
                  <Box component="form">
                    <TextField
                      fullWidth
                      label="Nome Completo"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      margin="normal"
                      error={!!profileErrors.name}
                      helperText={profileErrors.name}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Biografia"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      margin="normal"
                      multiline
                      rows={4}
                      placeholder="Conte um pouco sobre você..."
                    />
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancelProfileEdit}
                        disabled={loadingProfile}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={loadingProfile ? <CircularProgress size={20} /> : <SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loadingProfile}
                      >
                        {loadingProfile ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {user?.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
                      <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {user?.email}
                      </Typography>
                    </Box>
                    
                    <Chip 
                      label={user?.role === 'admin' ? 'Administrador' : 'Usuário'} 
                      color={user?.role === 'admin' ? 'secondary' : 'primary'}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      {user?.bio || 'Nenhuma biografia adicionada.'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Informações da Conta */}
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informações da Conta
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Membro desde: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Último acesso: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : '-'}
              </Typography>
            </Box>
          </ProfilePaper>
        </Grid>
        
        {/* Seção de Segurança */}
        <Grid item xs={12} md={6}>
          <ProfilePaper elevation={2}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              mb: 3
            }}>
              <Typography variant="h6" gutterBottom>
                Segurança e Acesso
              </Typography>
              
              {!editingPassword && (
                <Button 
                  startIcon={<EditIcon />} 
                  onClick={() => setEditingPassword(true)}
                >
                  Alterar Senha
                </Button>
              )}
            </Box>
            
            {editingPassword ? (
              <Box component="form">
                <TextField
                  fullWidth
                  label="Senha Atual"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword}
                  required
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
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Nova Senha"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword}
                  required
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
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Confirmar Nova Senha"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword}
                  required
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
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCancelPasswordEdit}
                    disabled={loadingPassword}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={loadingPassword ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleChangePassword}
                    disabled={loadingPassword}
                  >
                    {loadingPassword ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    Sua senha
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sua senha foi alterada pela última vez em: {user?.passwordUpdatedAt ? new Date(user.passwordUpdatedAt).toLocaleDateString('pt-BR') : 'Nunca'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" gutterBottom>
                    Dicas de segurança
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    • Use uma senha única que você não utiliza em outros sites
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    • Combine letras maiúsculas, minúsculas, números e símbolos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Altere sua senha regularmente para maior segurança
                  </Typography>
                </Box>
              </Box>
            )}
          </ProfilePaper>
        </Grid>
        
        {/* Seção de Preferências e Estatísticas */}
        <Grid item xs={12}>
          <ProfilePaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Estatísticas de Uso
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {user?.stats?.diarioEntries || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Entradas no Diário
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {user?.stats?.praticasCompleted || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Práticas Realizadas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {user?.stats?.conversationCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conversas com LUZ IA
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {user?.stats?.loginStreak || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dias Consecutivos
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </ProfilePaper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
