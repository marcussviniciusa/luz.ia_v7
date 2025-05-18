require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Minio = require('minio');
const { v4: uuidv4 } = require('uuid');

// Configurar cliente MinIO
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

// Configurações
const bucketName = process.env.MINIO_BUCKET_NAME || 'luz-ia';
const testAudioPath = path.join(__dirname, 'test-audio.mp3'); // Crie este arquivo antes de executar

async function testMinioUpload() {
  console.log('=======================================');
  console.log('TESTE DE UPLOAD DE ÁUDIO PARA MINIO');
  console.log('=======================================');
  
  console.log('Configurações MinIO:');
  console.log('- Endpoint:', process.env.MINIO_ENDPOINT);
  console.log('- Porta:', process.env.MINIO_PORT);
  console.log('- Usar SSL:', process.env.MINIO_USE_SSL);
  console.log('- Bucket:', bucketName);
  
  try {
    // Verificar se o bucket existe
    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log(`Bucket ${bucketName} existe?`, bucketExists);
    
    if (!bucketExists) {
      console.log(`Criando bucket ${bucketName}...`);
      await minioClient.makeBucket(bucketName);
      console.log('Bucket criado com sucesso');
    }
    
    // Criar arquivo de teste se não existir
    if (!fs.existsSync(testAudioPath)) {
      console.log('Criando arquivo de áudio de teste...');
      // Criar um arquivo MP3 simples
      const sampleBuffer = Buffer.from([
        0xFF, 0xFB, 0x50, 0x40, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      fs.writeFileSync(testAudioPath, sampleBuffer);
      console.log('Arquivo de teste criado:', testAudioPath);
    }
    
    // Ler o arquivo
    const fileContent = fs.readFileSync(testAudioPath);
    const fileSize = fs.statSync(testAudioPath).size;
    
    console.log('Arquivo para upload:');
    console.log('- Caminho:', testAudioPath);
    console.log('- Tamanho:', fileSize, 'bytes');
    
    // Nome do objeto no MinIO
    const objectName = `praticas/test-${Date.now()}-${uuidv4()}.mp3`;
    console.log('Nome do objeto no MinIO:', objectName);
    
    // Metadados
    const metaData = {
      'Content-Type': 'audio/mpeg',
      'X-Amz-Meta-Original-Filename': path.basename(testAudioPath)
    };
    
    // Upload para MinIO
    console.log('Iniciando upload para MinIO...');
    await minioClient.putObject(bucketName, objectName, fileContent, fileSize, metaData);
    console.log('Upload concluído com sucesso!');
    
    // Verificar se o arquivo existe
    console.log('Verificando se o arquivo foi carregado corretamente...');
    const stat = await minioClient.statObject(bucketName, objectName);
    console.log('Arquivo confirmado no MinIO:');
    console.log('- Tamanho:', stat.size, 'bytes');
    console.log('- Última modificação:', stat.lastModified);
    
    // Gerar URL temporária para acesso
    const url = await minioClient.presignedGetObject(bucketName, objectName, 60 * 60);
    console.log('URL temporária para acesso (válida por 1 hora):', url);
    
    console.log('=======================================');
    console.log('TESTE CONCLUÍDO COM SUCESSO!');
    console.log('=======================================');
    
    return {
      success: true,
      objectName,
      url
    };
  } catch (error) {
    console.error('ERRO DURANTE O TESTE:');
    console.error(error);
    
    console.log('=======================================');
    console.log('TESTE FALHOU!');
    console.log('=======================================');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar o teste
testMinioUpload().then(result => {
  console.log('Resultado do teste:', result);
  process.exit(result.success ? 0 : 1);
});
