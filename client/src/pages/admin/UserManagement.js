import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  InputBase
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { SnackbarContext } from '../../contexts/SnackbarContext';
import axios from 'axios';

const UserManagement = () => {
  const { showSuccess, showError } = useContext(SnackbarContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Diálogos
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedUser, setEditedUser] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });
  
  // Estado para novo usuário
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'pendente'
  });
  
  // Estado para validação de email
  const [emailExists, setEmailExists] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Parâmetros de consulta para a API
      const queryParams = new URLSearchParams({
        page: page + 1, // API começa em 1, não em 0
        limit: rowsPerPage
      });
      
      // Adicionar parâmetros de filtro quando aplicável
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (filterStatus !== 'all') {
        queryParams.append('status', filterStatus);
      }
      
      // Chamada real à API
      const response = await axios.get(`/api/admin/users?${queryParams.toString()}`);
      
      // Verificar se a resposta contém os dados necessários (formato de resposta do advancedResults middleware)
      if (response.data && response.data.success) {
        // Format advancedResults response
        setUsers(response.data.data || []);
        if (response.data.pagination) {
          setTotalUsers(response.data.pagination.total);
        } else {
          setTotalUsers(response.data.count || 0);
        }
      } else {
        // Se a estrutura da resposta for diferente
        if (response.data) {
          // Formato alternativo - pode ser que os usuários estejam diretamente na resposta
          if (Array.isArray(response.data)) {
            setUsers(response.data);
            setTotalUsers(response.data.length);
          } else if (response.data.data && Array.isArray(response.data.data)) {
            setUsers(response.data.data);
            setTotalUsers(response.data.data.length);
          } else {
            console.warn('Resposta da API em formato inesperado:', response.data);
            setUsers([]);
            setTotalUsers(0);
          }
        } else {
          setUsers([]);
          setTotalUsers(0);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showError('Erro ao carregar lista de usuários: ' + (error.response?.data?.message || error.message));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setEditedUser({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialog(false);
    setSelectedUser(null);
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
    setSelectedUser(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      
      // Validar dados antes de enviar
      if (!editedUser.name || !editedUser.email) {
        showError('Nome e email são obrigatórios');
        setLoading(false);
        return;
      }
      
      // Enviar para a API
      await axios.put(`/api/admin/users/${selectedUser._id}`, editedUser);
      
      showSuccess('Usuário atualizado com sucesso');
      handleCloseEditDialog();
      fetchUsers(); // Recarregar a lista após atualização
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      showError('Erro ao atualizar usuário: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setCreateDialog(true);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'pendente'
    });
    setEmailExists(false);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialog(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'pendente'
    });
    setEmailExists(false);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Se o campo for email, limpar a flag de validação
    if (name === 'email') {
      setEmailExists(false);
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.get(`/api/admin/users/check-email?email=${encodeURIComponent(email)}`);
      return response.data.exists;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      // Em caso de erro, mostrar a mensagem mas permitir prosseguir
      showError('Erro ao verificar disponibilidade do email. Prosseguindo com o cadastro.');
      return false;
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validar campos obrigatórios
      if (!newUser.name || !newUser.email || !newUser.password) {
        showError('Nome, email e senha são obrigatórios');
        return;
      }
      
      setLoading(true);
      
      // Verificar se o email já existe
      const exists = await checkEmailExists(newUser.email);
      if (exists) {
        setEmailExists(true);
        showError('Este email já está sendo utilizado por outra conta');
        setLoading(false);
        return;
      }
      
      // Criar o usuário na API
      await axios.post('/api/admin/users', newUser);
      
      showSuccess('Usuário criado com sucesso');
      handleCloseCreateDialog();
      fetchUsers(); // Recarregar a lista após criação
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      showError('Erro ao criar usuário: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      
      // Enviar a solicitação de exclusão para a API
      await axios.delete(`/api/admin/users/${selectedUser._id}`);
      
      showSuccess('Usuário excluído com sucesso');
      handleCloseDeleteDialog();
      fetchUsers(); // Recarregar a lista após exclusão
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      showError('Erro ao excluir usuário: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      setLoading(true);
      
      // Chamar a API para aprovar o usuário
      await axios.put(`/api/admin/users/${userId}/approve`);
      
      showSuccess('Usuário aprovado com sucesso');
      fetchUsers(); // Recarregar a lista após aprovação
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      showError('Erro ao aprovar usuário: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  const rejectUser = async (userId) => {
    try {
      setLoading(true);
      
      // Chamar a API para rejeitar/desativar o usuário
      await axios.put(`/api/admin/users/${userId}/deactivate`);
      
      showSuccess('Usuário rejeitado com sucesso');
      fetchUsers(); // Recarregar a lista após rejeição
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      showError('Erro ao rejeitar usuário: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'aprovada':
        return <Chip label="Ativo" size="small" color="success" />;
      case 'pendente':
        return <Chip label="Pendente" size="small" color="warning" />;
      case 'desativada':
        return <Chip label="Desativado" size="small" color="error" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Gerenciamento de Usuários
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Gerenciamento de Usuários
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Novo Usuário
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
          <TextField
            placeholder="Buscar por nome ou email"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="aprovada">Ativos</MenuItem>
              <MenuItem value="pendente">Pendentes</MenuItem>
              <MenuItem value="desativada">Desativados</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: 'primary.light' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nome</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Função</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data de Criação</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">Nenhum usuário encontrado</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</TableCell>
                  <TableCell>{getStatusChip(user.status)}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {user.status === 'pendente' && (
                        <>
                          <IconButton 
                            size="small" 
                            color="success" 
                            onClick={() => approveUser(user._id)}
                            title="Aprovar"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => rejectUser(user._id)}
                            title="Rejeitar"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(user)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(user)}
                        title="Excluir"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>
      
      {/* Diálogo de Edição */}
      <Dialog open={editDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nome"
            name="name"
            fullWidth
            variant="outlined"
            value={editedUser.name}
            onChange={handleEditChange}
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            type="email"
            fullWidth
            variant="outlined"
            value={editedUser.email}
            onChange={handleEditChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Função</InputLabel>
            <Select
              name="role"
              value={editedUser.role}
              onChange={handleEditChange}
              label="Função"
            >
              <MenuItem value="user">Usuário</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={editedUser.status}
              onChange={handleEditChange}
              label="Status"
            >
              <MenuItem value="aprovada">Ativo</MenuItem>
              <MenuItem value="pendente">Pendente</MenuItem>
              <MenuItem value="desativada">Desativado</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleSaveEdit} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={deleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o usuário "{selectedUser?.name}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de Criação de Usuário */}
      <Dialog open={createDialog} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nome"
            name="name"
            fullWidth
            variant="outlined"
            value={newUser.name}
            onChange={handleNewUserChange}
            sx={{ mb: 2, mt: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={handleNewUserChange}
            sx={{ mb: 2 }}
            required
            error={emailExists}
            helperText={emailExists ? 'Este email já está sendo utilizado' : ''}
          />
          <TextField
            margin="dense"
            label="Senha"
            name="password"
            type="password"
            fullWidth
            variant="outlined"
            value={newUser.password}
            onChange={handleNewUserChange}
            sx={{ mb: 2 }}
            required
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Função</InputLabel>
            <Select
              name="role"
              value={newUser.role}
              onChange={handleNewUserChange}
              label="Função"
            >
              <MenuItem value="user">Usuário</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={newUser.status}
              onChange={handleNewUserChange}
              label="Status"
            >
              <MenuItem value="aprovada">Ativo</MenuItem>
              <MenuItem value="pendente">Pendente</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} color="inherit">Cancelar</Button>
          <Button 
            onClick={handleCreateUser} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
