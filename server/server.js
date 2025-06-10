require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const connectDB = require('./config/db');
const path = require('path');
const errorHandler = require('./middleware/error');
const { minioClient, initializeBucket } = require('./config/minio');

// Função para garantir que a imagem padrão existe
const ensureDefaultImage = () => {
  const fs = require('fs');
  const imagePath = path.join(__dirname, 'public/images/pratica-default.jpg');
  const clientImagePath = path.join(__dirname, '../client/public/static/images/pratica-default.jpg');
  
  if (!fs.existsSync(imagePath) || !fs.existsSync(clientImagePath)) {
    console.log('⚠️ Imagem padrão não encontrada, criando...');
    try {
      require('./scripts/create-default-image');
    } catch (error) {
      console.warn('⚠️ Não foi possível criar imagem padrão automaticamente:', error.message);
    }
  }
};

// Garantir que a imagem padrão existe
ensureDefaultImage();

// Inicializar cliente MinIO e bucket
initializeBucket().catch(err => {
  console.error('Erro ao inicializar o bucket MinIO:', err);
});

// Iniciar o app Express
const app = express();

// Conectar ao banco de dados
connectDB();

// Middleware básico
app.use(express.json());
app.use(cors());

// Middleware para upload de arquivos
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // limite de 50MB
  debug: false, // desabilitar logs de debug para reduzir spam
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

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
app.use('/api/contents', require('./routes/content')); // Nova rota de gerenciamento de conteúdo
app.use('/api/proxy', require('./routes/proxy')); // Rota de proxy para imagens

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
