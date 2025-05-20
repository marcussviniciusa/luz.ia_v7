/**
 * Utilitário para upload de arquivos para o MinIO com tratamento robusto de erros
 * Inclui mecanismo de retry com diferentes configurações para lidar com problemas de assinatura
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { minioClient, retryUpload } = require('../config/minio');

/**
 * Faz upload de um arquivo para o MinIO usando abordagem simples e confiável
 * @param {Object} fileData - Dados do arquivo (express-fileupload)
 * @param {string} destPath - Caminho de destino no bucket (sem o nome do arquivo)
 * @param {string} userId - ID do usuário para incluir no caminho
 * @returns {Promise<{objectName: string, url: string}>} - Nome do objeto no MinIO e URL para acesso
 */
async function uploadFileToMinio(fileData, destPath, userId) {
  if (!fileData) {
    throw new Error('Nenhum arquivo fornecido para upload');
  }

  const bucketName = process.env.MINIO_BUCKET_NAME;
  
  try {
    // Verificar se o bucket existe
    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log(`Bucket ${bucketName} existe? ${bucketExists}`);
    
    if (!bucketExists) {
      console.log(`Criando bucket ${bucketName}...`);
      await minioClient.makeBucket(bucketName, process.env.MINIO_REGION || 'us-east-1');
    }
    
    // Determinar a extensão do arquivo
    const fileExt = path.extname(fileData.name) || '.bin';
    
    // Gerar um nome único para o arquivo (sem caracteres especiais para evitar problemas de URL)
    const timestamp = Date.now();
    const uuid = uuidv4().replace(/-/g, ''); // Remover hífens do UUID
    const objectName = `${destPath}/${userId}/${timestamp}-${uuid}${fileExt}`;
    
    // Definir metadados mínimos para o arquivo - simplificar para evitar problemas
    const metaData = {
      'Content-Type': fileData.mimetype || 'application/octet-stream'
    };
    
    console.log(`Iniciando upload simplificado para MinIO: bucket=${bucketName}, objeto=${objectName}`);
    
    // Determinar qual abordagem usar baseado no tipo de dados disponível
    let result;
    
    // Abordagem 1: Dados em arquivo temporário
    if (fileData.tempFilePath && fs.existsSync(fileData.tempFilePath)) {
      console.log('Usando arquivo temporário para upload: ', fileData.tempFilePath);
      
      // Abordagem mais simples e direta - sem retry complexo
      // Usar Promise diretamente com o método callback do MinIO
      result = await new Promise((resolve, reject) => {
        minioClient.fPutObject(
          bucketName,
          objectName,
          fileData.tempFilePath,
          metaData,
          (err, etag) => {
            if (err) {
              console.error('Erro no upload via fPutObject:', err);
              return reject(err);
            }
            console.log('Upload com fPutObject bem-sucedido, etag:', etag);
            resolve(etag);
          }
        );
      });
    }
    // Abordagem 2: Dados em memória (buffer)
    else if (fileData.data) {
      console.log('Usando dados em memória para upload, tamanho:', fileData.data.length);
      
      // Usar abordagem mais simples, sem especificar tamanho
      const buffer = Buffer.from(fileData.data);
      
      // Usar Promise diretamente com método callback
      result = await new Promise((resolve, reject) => {
        minioClient.putObject(
          bucketName,
          objectName,
          buffer,
          metaData,
          (err, etag) => {
            if (err) {
              console.error('Erro no upload via putObject (buffer):', err);
              return reject(err);
            }
            console.log('Upload com putObject (buffer) bem-sucedido, etag:', etag);
            resolve(etag);
          }
        );
      });
    }
    // Abordagem 3: Arquivo do Multer
    else if (fileData.path && fs.existsSync(fileData.path)) {
      console.log('Usando arquivo do Multer para upload: ', fileData.path);
      
      result = await new Promise((resolve, reject) => {
        minioClient.fPutObject(
          bucketName,
          objectName,
          fileData.path,
          metaData,
          (err, etag) => {
            if (err) {
              console.error('Erro no upload via fPutObject (Multer):', err);
              return reject(err);
            }
            console.log('Upload com fPutObject (Multer) bem-sucedido, etag:', etag);
            resolve(etag);
          }
        );
      });
    }
    else {
      throw new Error('Formato de arquivo não suportado: não foram encontrados dados válidos');
    }
    
    console.log('Upload concluído com sucesso, resultado:', result);
    
    // Gerar URL para acessar o arquivo
    // Usar URL absoluta para todos os ambientes para garantir compatibilidade
    let fileUrl;
    
    // Preferir URLs absolutas geradas de forma segura
    // Isso é crucial para garantir que as imagens sejam exibidas corretamente
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT;
    const port = parseInt(process.env.MINIO_PORT) || (useSSL ? 443 : 80);
    
    // Para S3 padrão, não expor a porta no URL se for porta padrão (80 ou 443)
    const portStr = (port === 80 || port === 443) ? '' : `:${port}`;
    
    // URL direta baseada em path-style
    fileUrl = `${protocol}://${endpoint}${portStr}/${bucketName}/${objectName}`;
    
    // Log da URL gerada
    console.log(`URL para o arquivo: ${fileUrl}`);
    
    // Retornar informações sobre o arquivo
    return {
      objectName: objectName,
      url: fileUrl
    };
  } catch (error) {
    console.error('Erro ao fazer upload para MinIO:', error);
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Remove um arquivo do MinIO
 * @param {string} objectName - Nome do objeto no MinIO
 * @returns {Promise<boolean>} - true se removido com sucesso
 */
async function removeFileFromMinio(objectName) {
  if (!objectName) {
    console.warn('Nome de objeto vazio, ignorando remoção');
    return false;
  }
  
  const bucketName = process.env.MINIO_BUCKET_NAME;
  
  try {
    await minioClient.removeObject(bucketName, objectName);
    console.log(`Objeto ${objectName} removido com sucesso do bucket ${bucketName}`);
    return true;
  } catch (error) {
    console.error(`Erro ao remover objeto ${objectName} do bucket ${bucketName}:`, error);
    return false;
  }
}

module.exports = {
  uploadFileToMinio,
  removeFileFromMinio
};
