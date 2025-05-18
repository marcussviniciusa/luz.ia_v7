const asyncHandler = require('../middleware/async');
const { minioClient } = require('../config/minio');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs');
const path = require('path');
const os = require('os');

// @desc    Proxy para imagens do MinIO
// @route   GET /api/proxy/:bucket/:objectName
// @access  Public
exports.proxyMinioImage = asyncHandler(async (req, res, next) => {
  console.log('===== INICIANDO PROXY PARA MINIO =====');
  try {
    // Construir o caminho do objeto no MinIO
    const bucketName = process.env.MINIO_BUCKET_NAME || 'luz-ia';
    let objectName = req.params.objectPath;
    
    // Log para debug
    console.log(`Solicitação de proxy para objeto: ${objectName} no bucket ${bucketName}`);
    console.log('Configuração MinIO:', {
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      bucketName: process.env.MINIO_BUCKET_NAME
    });
    
    // Verificar se o objeto existe
    try {
      console.log(`Verificando se objeto existe: bucket=${bucketName}, objectName=${objectName}`);
      await minioClient.statObject(bucketName, objectName);
      console.log('Objeto encontrado no MinIO!');
    } catch (error) {
      console.error(`Erro ao verificar objeto ${objectName}:`, error);
      
      // Tratamento especial para arquivos de áudio
      if (objectName.endsWith('.mp3') || objectName.endsWith('.wav') || objectName.endsWith('.ogg')) {
        console.log('Arquivo de áudio não encontrado no bucket:', bucketName);
        console.log('Caminho solicitado:', objectName);
        console.log('Verificando se o bucket tem permissões públicas...');
        
        try {
          const policy = await minioClient.getBucketPolicy(bucketName);
          console.log('Política do bucket:', policy || 'Nenhuma política definida');
        } catch (policyError) {
          console.log('Erro ao verificar política do bucket:', policyError.message);
        }
        
        // Verificar listagem de arquivos no diretório
        try {
          const stream = minioClient.listObjects(bucketName, 'praticas/', true);
          console.log('Arquivos disponíveis no diretório:');
          let found = false;
          
          stream.on('data', (obj) => {
            console.log(` - ${obj.name} (${obj.size} bytes)`);
            found = true;
          });
          
          stream.on('end', () => {
            if (!found) {
              console.log('Nenhum arquivo encontrado no diretório praticas/');
            }
          });
          
          stream.on('error', (err) => {
            console.log('Erro ao listar objetos:', err.message);
          });
        } catch (listError) {
          console.log('Erro ao listar objetos:', listError.message);
        }
        
        // Verificar se solicitação foi do tipo HEAD (verificação de existência)
        if (req.method === 'HEAD') {
          // Apenas para verificação, retornamos 404 explícito
          return res.status(404).end();
        }
        
        // Isso permite que o cliente saiba que o arquivo não existe e possa usar o fallback
        res.setHeader('Content-Type', 'application/json');
        return res.status(404).json({
          error: 'Arquivo de áudio não encontrado',
          message: 'Use o modo de fallback para gerar um tom de meditação'
        });
      }
      
      return next(new ErrorResponse(`Arquivo não encontrado: ${objectName}`, 404));
    }
    
    // Obter o objeto do MinIO e enviá-lo como resposta
    try {
      // Obter informações do objeto para definir tipo de conteúdo correto
      const stat = await minioClient.statObject(bucketName, objectName);
      
      console.log('Stat do objeto:', JSON.stringify(stat));
      
      // Definir headers apropriados baseados no tipo de arquivo
      const fileExtension = path.extname(objectName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      console.log('Tipo de arquivo detectado:', fileExtension);
      console.log('Stat do objeto antes do processamento:', JSON.stringify(stat));
      
      if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (fileExtension === '.png') {
        contentType = 'image/png';
      } else if (fileExtension === '.gif') {
        contentType = 'image/gif';
      } else if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
      } else if (fileExtension === '.mp3') {
        contentType = 'audio/mpeg';
      } else if (fileExtension === '.mp4') {
        contentType = 'video/mp4';
      } else if (fileExtension === '.wav') {
        contentType = 'audio/wav';
      }
      
      console.log('Content-Type definido como:', contentType);
      
      // Usar o tipo de conteúdo das metadatas se disponível
      if (stat.metaData && stat.metaData['content-type']) {
        contentType = stat.metaData['content-type'];
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
      res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir acesso de qualquer origem
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Criar stream do MinIO para o cliente
      const objectStream = await minioClient.getObject(bucketName, objectName);
      
      // Usar um arquivo temporário para garantir que temos os dados completos
      const tempFilePath = path.join(os.tmpdir(), `minio-cache-${Date.now()}${fileExtension}`);
      console.log('Salvando objeto temporariamente em:', tempFilePath);
      const fileWriteStream = fs.createWriteStream(tempFilePath);
      
      // Quando o arquivo for escrito por completo
      fileWriteStream.on('finish', () => {
        console.log('Download do arquivo concluído, enviando para o cliente');
        // Ler do arquivo e enviar ao cliente
        fs.createReadStream(tempFilePath).pipe(res).on('end', () => {
          console.log('Transmissão para o cliente concluída');
          // Limpar o arquivo temporário quando terminado
          fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Erro ao remover arquivo temporário:', err);
          });
        }).on('error', (err) => {
          console.error('Erro ao transmitir arquivo para o cliente:', err);
          if (!res.headersSent) {
            return next(new ErrorResponse(`Erro ao transmitir arquivo: ${err.message}`, 500));
          }
        });
      });
      
      // Lidar com erros no stream do arquivo
      fileWriteStream.on('error', (err) => {
        console.error('Erro no stream de escrita:', err);
        fs.unlink(tempFilePath, () => {}); // Tenta limpar o arquivo em caso de erro
        next(new ErrorResponse(`Erro ao processar imagem: ${err.message}`, 500));
      });
      
      console.log('Iniciando download do objeto do MinIO...');
      // Encaminhar stream do MinIO para o arquivo temporário
      objectStream.pipe(fileWriteStream).on('error', (err) => {
        console.error('Erro durante o download do arquivo do MinIO:', err);
      });
      
    } catch (error) {
      console.error(`Erro ao transmitir objeto ${objectName}:`, error);
      
      // Tentar fornecer uma imagem de placeholder caso haja erro
      try {
        const placeholderPath = path.join(__dirname, '../public/placeholder.png');
        if (fs.existsSync(placeholderPath)) {
          console.log('Usando imagem de placeholder');
          res.setHeader('Content-Type', 'image/png');
          fs.createReadStream(placeholderPath).pipe(res);
          return;
        }
      } catch (placeholderError) {
        console.error('Erro ao usar imagem de placeholder:', placeholderError);
      }
      
      return next(new ErrorResponse(`Erro ao carregar imagem: ${error.message}`, 500));
    }
  } catch (error) {
    console.error('Erro no proxy de imagem:', error);
    return next(new ErrorResponse(`Erro no servidor: ${error.message}`, 500));
  }
});
