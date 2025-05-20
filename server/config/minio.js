const Minio = require('minio');
const fs = require('fs');

// Configuração otimizada para compatibilidade máxima com S3 sem necessidade do AWS SDK
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT) || 443,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  region: process.env.MINIO_REGION || 'us-east-1',
  s3ForcePathStyle: true,
  partSize: 10 * 1024 * 1024,  // 10MB por parte para uploads
  signatureVersion: 'v4'
};

// Não logar a secret key por segurança
console.log('Configuração MinIO:', {
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: minioConfig.useSSL,
  accessKey: minioConfig.accessKey,
  secretKey: '***************', // Ocultar a chave secreta
  region: minioConfig.region,
  s3ForcePathStyle: minioConfig.s3ForcePathStyle,
  partSize: minioConfig.partSize
});

// Configuração do cliente MinIO com tratamento de erro
const minioClient = new Minio.Client(minioConfig);

// Função auxiliar para tentar upload com diferentes configurações
const retryUpload = async (bucketName, objectName, fileStream, fileSize, metaData, maxRetries = 3) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ajustar o tamanho da parte em cada tentativa
      const partSizeOptions = [
        10 * 1024 * 1024, // 10MB padrão
        5 * 1024 * 1024,  // 5MB - padrão AWS
        16 * 1024 * 1024  // 16MB - para arquivos maiores
      ];
      
      // Usar uma configuração diferente para cada tentativa
      const partSize = partSizeOptions[attempt % partSizeOptions.length];
      console.log(`Tentativa ${attempt} usando partSize de ${partSize / (1024 * 1024)}MB`);
      
      // O método putObject é mais confiável para o seu caso
      await new Promise((resolve, reject) => {
        const tempClient = new Minio.Client({
          ...minioConfig,
          partSize: partSize
        });
        
        tempClient.putObject(bucketName, objectName, fileStream, fileSize, metaData, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      
      return true; // Upload bem-sucedido
    } catch (error) {
      lastError = error;
      console.log(`Falha na tentativa ${attempt}: ${error.code || error.message}`);
      
      // Reabrir o stream para nova tentativa se houver mais tentativas
      if (attempt < maxRetries && typeof fileStream.path === 'string') {
        fileStream = fs.createReadStream(fileStream.path);
      }
    }
  }
  
  // Todas as tentativas falharam
  throw lastError;
};

// Verifica se o MinIO está acessível e testar credenciais
const testMinioConnection = async () => {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME;
    console.log(`Testando conexão com MinIO (${process.env.MINIO_ENDPOINT}) e acesso ao bucket ${bucketName}...`);
    
    // Verifica se consegue listar buckets (teste de autenticação e conectividade)
    const buckets = await minioClient.listBuckets();
    console.log(`Conexão com MinIO estabelecida. Buckets disponíveis: ${buckets.map(b => b.name).join(', ')}`);
    return true;
  } catch (error) {
    console.error(`ERRO DE CONEXÃO COM MINIO: ${error.message}`);
    console.error('Detalhes do erro:', error);
    console.error('Por favor verifique as credenciais e a configuração de rede');
    return false;
  }
};

// Inicializa o bucket se não existir
const initializeBucket = async () => {
  try {
    // Primeiro verifica se a conexão está funcionando
    const connectionOk = await testMinioConnection();
    if (!connectionOk) {
      console.error('Não foi possível inicializar o bucket devido a problemas de conexão com MinIO');
      return false;
    }
    
    const bucketName = process.env.MINIO_BUCKET_NAME;
    const bucketExists = await minioClient.bucketExists(bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} não existe. Tentando criar...`);
      await minioClient.makeBucket(bucketName, process.env.MINIO_REGION || 'us-east-1');
      console.log(`Bucket ${bucketName} criado com sucesso`);
      try {
        // Definir uma política de acesso público para a pasta 'public'
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: ['*']
              },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/public/*`]
            }
          ]
        };
        
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        console.log(`Política de acesso público configurada para ${bucketName}/public/*`);
      } catch (policyError) {
        console.warn(`Aviso: Não foi possível definir a política do bucket: ${policyError.message}`);
      }
    }
    
    // Fazer um teste de upload/download para verificar permissões
    const testFileName = `_test_/${Date.now()}.txt`;
    const testContent = 'Teste de upload para MinIO';
    
    // Upload do conteúdo de teste
    await minioClient.putObject(bucketName, testFileName, Buffer.from(testContent));
    console.log(`Teste de upload bem-sucedido. Removendo arquivo de teste ${testFileName}...`);
    
    // Remover arquivo de teste após sucesso
    await minioClient.removeObject(bucketName, testFileName);
    
    console.log(`Bucket ${bucketName} está pronto para uso com permissões de leitura e escrita.`);
    return true;
  } catch (error) {
    console.error(`Erro ao inicializar bucket MinIO: ${error.message}`);
    console.error('Detalhes do erro:', error);
    return false;
  }
};

module.exports = { 
  minioClient,
  retryUpload,
  initializeBucket 
};
