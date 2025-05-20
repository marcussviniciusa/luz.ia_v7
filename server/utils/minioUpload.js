/**
 * Utilitário para upload de arquivos para o MinIO com tratamento robusto de erros
 * Inclui mecanismo de retry com diferentes configurações para lidar com problemas de assinatura
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { minioClient, retryUpload } = require('../config/minio');

/**
 * Faz upload de um arquivo para o MinIO usando diferentes estratégias
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
    
    // Gerar um nome único para o arquivo
    const objectName = `${destPath}/${userId}/${Date.now()}-${uuidv4()}${fileExt}`;
    
    // Definir metadados para o arquivo
    const metaData = {
      'Content-Type': fileData.mimetype,
      'X-Amz-Meta-Original-Filename': fileData.name
    };
    
    console.log(`Iniciando upload para MinIO: bucket=${bucketName}, objeto=${objectName}`);
    
    // Tentar diferentes estratégias de upload, começando pela mais robusta para grandes arquivos
    
    // Estratégia 1: Usar o caminho do arquivo temporário (express-fileupload) - mais eficiente para arquivos grandes
    if (fileData.tempFilePath && fs.existsSync(fileData.tempFilePath)) {
      console.log('Usando arquivo temporário para upload em streaming:', fileData.tempFilePath);
      
      try {
        // Usar abordagem de multiple retry para arquivos de qualquer tamanho
        const stats = fs.statSync(fileData.tempFilePath);
        console.log(`Arquivo de ${stats.size} bytes, usando mecanismo de retry adaptativo`);
        
        // Criar um stream de leitura do arquivo
        const fileStream = fs.createReadStream(fileData.tempFilePath);
        
        // Usar nosso mecanismo de retry com diferentes configurações
        await retryUpload(bucketName, objectName, fileStream, stats.size, metaData);
        console.log('Upload bem-sucedido usando mecanismo de retry');
      } catch (uploadError) {
        console.error('Erro em todas as tentativas de upload:', uploadError);
        
        // Última tentativa: usar abordagem mais simples sem especificar tamanho
        console.log('Tentando abordagem simplificada como último recurso');
        const fileStream = fs.createReadStream(fileData.tempFilePath);
        await minioClient.putObject(bucketName, objectName, fileStream, metaData);
        console.log('Upload realizado com sucesso usando abordagem simplificada');
      }
    } 
    // Estratégia 2: Usar os dados em memória para arquivos menores
    else if (fileData.data) {
      console.log('Usando dados em memória, tamanho:', fileData.data.length);
      
      // Criar um buffer a partir dos dados
      const buffer = Buffer.from(fileData.data);
      
      try {
        // Tentativas com diferentes configurações
        const bufferSize = buffer.length;
        console.log(`Buffer em memória de ${bufferSize} bytes`);
        
        // Para dados em memória, usar abordagem de tentativas sequenciais
        let success = false;
        
        // Tentativa 1: método mais simples
        try {
          await minioClient.putObject(bucketName, objectName, buffer, metaData);
          success = true;
          console.log('Upload bem-sucedido com método simples');
        } catch (err1) {
          console.log('Primeira tentativa falhou:', err1.code || err1.message);
          
          // Tentativa 2: especificar tamanho
          try {
            await minioClient.putObject(bucketName, objectName, buffer, bufferSize, metaData);
            success = true;
            console.log('Upload bem-sucedido especificando tamanho');
          } catch (err2) {
            console.log('Segunda tentativa falhou:', err2.code || err2.message);
          }
        }
        
        if (!success) {
          // Tentativa 3: Salvar em arquivo temporário e usar retryUpload
          const tempPath = `/tmp/minio-buffer-${Date.now()}.tmp`;
          fs.writeFileSync(tempPath, buffer);
          
          try {
            const fileStream = fs.createReadStream(tempPath);
            const stats = fs.statSync(tempPath);
            await retryUpload(bucketName, objectName, fileStream, stats.size, metaData);
            console.log('Upload bem-sucedido através de arquivo temporário');
          } finally {
            try { fs.unlinkSync(tempPath); } catch (e) {}
          }
        }
      } catch (uploadError) {
        console.error('Erro em todas as tentativas de upload em memória:', uploadError);
        throw uploadError;
      }
    } 
    // Estratégia 3: Último recurso - Usar abordagem de arquivo temporário manual
    else {
      console.log('Criando arquivo temporário próprio');
      const tempPath = `/tmp/minio-upload-${Date.now()}.tmp`;
      
      // Se temos a propriedade 'path', é um arquivo do Multer
      if (fileData.path && fs.existsSync(fileData.path)) {
        // Copiar o arquivo do Multer para nosso arquivo temporário
        fs.copyFileSync(fileData.path, tempPath);
      } else {
        throw new Error('Não foi possível obter dados do arquivo para upload');
      }
      
      try {
        // Usar o mecanismo de retry para maior chance de sucesso
        const fileStream = fs.createReadStream(tempPath);
        const stats = fs.statSync(tempPath);
        await retryUpload(bucketName, objectName, fileStream, stats.size, metaData);
        console.log('Upload bem-sucedido com mecanismo de retry');
      } finally {
        // Limpar o arquivo temporário
        try {
          fs.unlinkSync(tempPath);
        } catch (err) {
          console.error('Erro ao remover arquivo temporário:', err);
        }
      }
    }
    
    console.log('Upload concluído com sucesso');
    
    // Retornar informações sobre o arquivo
    return {
      objectName: objectName,
      url: `/api/proxy/minio/${objectName}`
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
