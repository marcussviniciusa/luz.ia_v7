require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const errorHandler = require('./middleware/error');

// Iniciar o app Express
const app = express();

// Conectar ao banco de dados
connectDB();

// Middleware básico
app.use(express.json());
app.use(cors());

// Servir arquivos estáticos e imagens - estas rotas não exigem autenticação
// Importante: estas rotas vêm ANTES das rotas de API protegidas
app.use('/tmp/uploads', express.static(path.join(__dirname, 'tmp/uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rota de proxy para imagens armazenadas no MinIO - não exige autenticação
// Tem que vir antes das rotas API protegidas
app.use('/api/proxy', require('./routes/proxy'));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/luz-ia', require('./routes/luz-ia'));
app.use('/api/diario', require('./routes/diario'));
app.use('/api/manifestacao', require('./routes/manifestacao'));
app.use('/api/praticas', require('./routes/praticas'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/upload', require('./routes/upload'));

// Middleware para tratamento de erros
app.use(errorHandler);

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Tratamento para desligamento do servidor
process.on('unhandledRejection', (err, promise) => {
  console.log(`Erro: ${err.message}`);
  server.close(() => process.exit(1));
});
