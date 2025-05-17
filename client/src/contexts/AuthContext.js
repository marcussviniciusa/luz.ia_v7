import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Verificar token na inicialização
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Verificar se o token expirou
      try {
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token expirado
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        // Configurar header de autorização para todas as requisições
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Buscar informações do usuário
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Erro ao obter dados do usuário:', error);
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  // Login
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        // Salvar token no localStorage
        localStorage.setItem('token', newToken);
        
        // Configurar header de autorização
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // Atualizar estado
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Erro de login:', error);
      let errorMessage = 'Erro ao realizar login. Tente novamente.';
      
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Registro
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      console.error('Erro de registro:', error);
      let errorMessage = 'Erro ao realizar cadastro. Tente novamente.';
      
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Logout
  const logout = () => {
    // Remover token do localStorage
    localStorage.removeItem('token');
    
    // Limpar header de autorização
    delete axios.defaults.headers.common['Authorization'];
    
    // Atualizar estado
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Atualizar perfil
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/updatedetails', profileData);
      
      if (response.data.success) {
        setUser(response.data.data);
        return { success: true };
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      let errorMessage = 'Erro ao atualizar perfil. Tente novamente.';
      
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Atualizar senha
  const updatePassword = async (passwordData) => {
    try {
      const response = await axios.put('/api/auth/updatepassword', passwordData);
      
      if (response.data.success) {
        return { success: true };
      }
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      let errorMessage = 'Erro ao atualizar senha. Tente novamente.';
      
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
