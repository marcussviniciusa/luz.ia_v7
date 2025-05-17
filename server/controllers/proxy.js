const asyncHandler = require('../middleware/async');
const { minioClient } = require('../config/minio');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Proxy para imagens do MinIO
// @route   GET /api/proxy/:bucket/:objectName
// @access  Public
exports.proxyMinioImage = asyncHandler(async (req, res, next) => {
  try {
    // Construir o caminho do objeto no MinIO
    const bucketName = process.env.MINIO_BUCKET_NAME || 'luz-ia';
    let objectName = req.params.objectPath;
    
    // Log para debug
    console.log(`Solicitação de proxy para objeto: ${objectName} no bucket ${bucketName}`);
    
    // Verificar se o objeto existe
    try {
      await minioClient.statObject(bucketName, objectName);
    } catch (error) {
      console.error(`Erro ao verificar objeto ${objectName}:`, error);
      return next(new ErrorResponse(`Imagem não encontrada: ${objectName}`, 404));
    }
    
    // Obter o objeto do MinIO e enviá-lo como resposta
    try {
      // Obter informações do objeto para definir tipo de conteúdo correto
      const stat = await minioClient.statObject(bucketName, objectName);
      
      // Definir headers apropriados
      res.setHeader('Content-Type', stat.metaData['content-type'] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
      
      // Criar stream do MinIO para o cliente
      const objectStream = await minioClient.getObject(bucketName, objectName);
      
      // Encaminhar stream para resposta
      objectStream.pipe(res);
      
    } catch (error) {
      console.error(`Erro ao transmitir objeto ${objectName}:`, error);
      return next(new ErrorResponse(`Erro ao carregar imagem: ${error.message}`, 500));
    }
  } catch (error) {
    console.error('Erro no proxy de imagem:', error);
    return next(new ErrorResponse(`Erro no servidor: ${error.message}`, 500));
  }
});
