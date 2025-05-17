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
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedUser, setEditedUser] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Na implementação real, faríamos uma chamada à API:
      // const response = await axios.get(\`/api/admin/users?page=$\{page}&limit=$\{rowsPerPage}&search=$\{searchTerm}&status=$\{filterStatus}\`);
      // setUsers(response.data.users);
      // setTotalUsers(response.data.total);
      
      // Dados simulados para demonstração
      setTimeout(() => {
        const mockUsers = [
          { id: 1, name: 'Maria Silva', email: 'maria@exemplo.com', role: 'user', status: 'active', createdAt: '2025-01-15' },
          { id: 2, name: 'João Santos', email: 'joao@exemplo.com', role: 'user', status: 'pending', createdAt: '2025-04-22' },
          { id: 3, name: 'Ana Oliveira', email: 'ana@exemplo.com', role: 'admin', status: 'active', createdAt: '2024-11-05' },
          { id: 4, name: 'Carlos Ferreira', email: 'carlos@exemplo.com', role: 'user', status: 'suspended', createdAt: '2025-03-18' },
          { id: 5, name: 'Patricia Lima', email: 'patricia@exemplo.com', role: 'user', status: 'active', createdAt: '2025-02-27' },
          { id: 6, name: 'Marcos Alves', email: 'marcos@exemplo.com', role: 'user', status: 'active', createdAt: '2025-01-30' },
          { id: 7, name: 'Juliana Costa', email: 'juliana@exemplo.com', role: 'user', status: 'pending', createdAt: '2025-05-01' },
          { id: 8, name: 'Roberto Pereira', email: 'roberto@exemplo.com', role: 'user', status: 'active', createdAt: '2025-04-10' },
          { id: 9, name: 'Fernanda Rocha', email: 'fernanda@exemplo.com', role: 'user', status: 'active', createdAt: '2025-03-05' },
          { id: 10, name: 'Eduardo Gomes', email: 'eduardo@exemplo.com', role: 'user', status: 'pending', createdAt: '2025-05-08' },
          { id: 11, name: 'Luciana Melo', email: 'luciana@exemplo.com', role: 'user', status: 'active', createdAt: '2025-02-15' },
          { id: 12, name: 'Gabriel Souza', email: 'gabriel@exemplo.com', role: 'user', status: 'suspended', createdAt: '2025-03-20' }
        ];
        
        // Filtrar usuários com base nos filtros aplicados
        let filteredUsers = [...mockUsers];
        
        if (searchTerm) {
          filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (filterStatus !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.status === filterStatus);
        }
        
        setTotalUsers(filteredUsers.length);
        
        // Aplicar paginação
        const startIndex = page * rowsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);
        
        setUsers(paginatedUsers);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showError('Erro ao carregar lista de usuários');
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
      // Na implementação real, faríamos uma chamada à API:
      // await axios.put(\`/api/admin/users/$\{selectedUser.id}\`, editedUser);
      
      // Simulação para demonstração
      setTimeout(() => {
        const updatedUsers = users.map(user => {
          if (user.id === selectedUser.id) {
            return { ...user, ...editedUser };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        showSuccess('Usuário atualizado com sucesso');
        handleCloseEditDialog();
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      showError('Erro ao atualizar usuário');
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      // Na implementação real, faríamos uma chamada à API:
      // await axios.delete(\`/api/admin/users/$\{selectedUser.id}\`);
      
      // Simulação para demonstração
      setTimeout(() => {
        const updatedUsers = users.filter(user => user.id !== selectedUser.id);
        setUsers(updatedUsers);
        setTotalUsers(prev => prev - 1);
        showSuccess('Usuário removido com sucesso');
        handleCloseDeleteDialog();
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      showError('Erro ao remover usuário');
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      setLoading(true);
      // Na implementação real, faríamos uma chamada à API:
      // await axios.put(\`/api/admin/users/$\{userId}/approve\`);
      
      // Simulação para demonstração
      setTimeout(() => {
        const updatedUsers = users.map(user => {
          if (user.id === userId) {
            return { ...user, status: 'active' };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        showSuccess('Usuário aprovado com sucesso');
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      showError('Erro ao aprovar usuário');
      setLoading(false);
    }
  };

  const rejectUser = async (userId) => {
    try {
      setLoading(true);
      // Na implementação real, faríamos uma chamada à API:
      // await axios.put(\`/api/admin/users/$\{userId}/reject\`);
      
      // Simulação para demonstração
      setTimeout(() => {
        const updatedUsers = users.map(user => {
          if (user.id === userId) {
            return { ...user, status: 'suspended' };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        showSuccess('Usuário rejeitado');
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      showError('Erro ao rejeitar usuário');
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Ativo" color="success" size="small" />;
      case 'pending':
        return <Chip label="Pendente" color="warning" size="small" />;
      case 'suspended':
        return <Chip label="Suspenso" color="error" size="small" />;
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
              <MenuItem value="active">Ativos</MenuItem>
              <MenuItem value="pending">Pendentes</MenuItem>
              <MenuItem value="suspended">Suspensos</MenuItem>
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
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</TableCell>
                  <TableCell>{getStatusChip(user.status)}</TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {user.status === 'pending' && (
                        <>
                          <IconButton 
                            size="small" 
                            color="success" 
                            onClick={() => approveUser(user.id)}
                            title="Aprovar"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => rejectUser(user.id)}
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
              <MenuItem value="active">Ativo</MenuItem>
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="suspended">Suspenso</MenuItem>
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
    </Box>
  );
};

export default UserManagement;
