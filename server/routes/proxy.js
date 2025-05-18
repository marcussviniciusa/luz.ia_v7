const express = require('express');
const { proxyMinioImage } = require('../controllers/proxy');
const router = express.Router();

// Desativar proteção de autenticação para esta rota
// Isso permite que imagens sejam acessadas sem token

// Rota para proxy de imagens do MinIO
// Formato: /api/proxy/minio/pasta/subpasta/arquivo.extensao
router.get('/minio/*', (req, res, next) => {
  // Extrair o caminho do objeto (tudo após /minio/)
  const objectPath = req.params[0];
  req.params.objectPath = objectPath;
  
  // Passar para o controlador
  proxyMinioImage(req, res, next);
});

// Rota adicional para servir imagens diretamente por pastas
// Formato: /api/proxy/contents/arquivo.extensao
router.get('/contents/:filename', (req, res, next) => {
  // Construir o caminho do objeto no formato esperado pela função de proxy
  const objectPath = `contents/${req.params.filename}`;
  req.params.objectPath = objectPath;
  
  // Passar para o controlador
  proxyMinioImage(req, res, next);
});

// Rota especial para servir arquivos de áudio
// Formato: /api/proxy/audio/caminho/para/arquivo.mp3
router.get('/audio/:audiopath(*)', (req, res, next) => {
  // Obter o caminho completo do áudio
  const audioPath = req.params.audiopath;
  console.log('Acessando arquivo de áudio:', audioPath);
  req.params.objectPath = audioPath;
  
  // Passar para o controlador
  proxyMinioImage(req, res, next);
});

module.exports = router;
