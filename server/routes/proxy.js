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

module.exports = router;
