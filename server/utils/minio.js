const { minioClient } = require('../config/minio');

/**
 * Upload de arquivo para o MinIO
 * @param {string} prefix - O prefixo do caminho (pasta)
 * @param {string} filename - Nome do arquivo
 * @param {Buffer} buffer - Buffer do arquivo
 * @returns {Promise<{success: boolean, url: string, error: string}>} - Resultado do upload
 */
const uploadToMinIO = async (prefix, filename, buffer) => {
  try {
    const bucket = process.env.MINIO_BUCKET_NAME;
    const objectName = `${prefix}/${filename}`;
    
    // Upload do arquivo
    await minioClient.putObject(bucket, objectName, buffer);
    
    // Gerar URL pública para acesso ao arquivo
    let url;
    if (process.env.MINIO_PUBLIC_URL) {
      // Se temos uma URL pública configurada
      url = `${process.env.MINIO_PUBLIC_URL}/${objectName}`;
    } else {
      // Caso contrário, use nossa API de proxy para servir o arquivo
      url = `/api/proxy/${objectName}`;
    }
    
    return {
      success: true,
      url,
      objectName
    };
  } catch (error) {
    console.error('Erro no upload para MinIO:', error);
    return {
      success: false,
      error: error.message,
      url: null
    };
  }
};

/**
 * Remove um arquivo do MinIO
 * @param {string} prefix - O prefixo do caminho (pasta)
 * @param {string} filename - Nome do arquivo
 * @returns {Promise<{success: boolean, error: string}>} - Resultado da operação
 */
const deleteFromMinIO = async (prefix, filename) => {
  try {
    const bucket = process.env.MINIO_BUCKET_NAME;
    let objectName = filename;
    
    // Se o nome do arquivo já inclui o prefixo, não adicione novamente
    if (!filename.startsWith(`${prefix}/`)) {
      objectName = `${prefix}/${filename}`;
    }
    
    // Remover o arquivo
    await minioClient.removeObject(bucket, objectName);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover arquivo do MinIO:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  uploadToMinIO,
  deleteFromMinIO
};
