const Minio = require('minio');
const fs = require('fs');

// Configuração otimizada especificamente para resolver problemas de SignatureDoesNotMatch
const minioConfig = {
  // Configuração básica
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT) || 443,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  region: process.env.MINIO_REGION || 'us-east-1',
  
  // Opções para resolver problemas de "SignatureDoesNotMatch"
  pathStyle: true, // Usar path-style URLs
  s3ForcePathStyle: true, // Forçar path-style mesmo quando você tem subdomínios
  
  // IMPORTANTE: Tamanho mínimo de parte aceito pelo MinIO é 5MB
  partSize: 5 * 1024 * 1024, // 5MB é o valor mínimo exigido pela biblioteca
  
  // Não configurar transporte personalizado, usar configurações padrão
  // Isso evita o erro 'transport.request is not a function'

  
  // Não tentar melhorar performance com conexões persistentes (reduz erros de assinatura)
  connectTimeout: 10000, // 10 segundos
  requestTimeout: 30000, // 30 segundos
  maxRetries: 2,
  
  // Usar versão v4 de assinatura (padrão AWS mais compatível)
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

// Função auxiliar para tentar upload com diferentes configurações e abordagens
const retryUpload = async (bucketName, objectName, fileStream, fileSize, metaData, maxRetries = 5) => {
  let lastError = null;
  
  // Estratégias de upload diferentes para maior robustez
  const strategies = [
    // Estratégia 1: Upload direto com tamanho pequeno (abordagem mais simples)
    async () => {
      console.log('Tentando estratégia 1: Upload simples com 5MB');
      const client = new Minio.Client({
        ...minioConfig,
        partSize: 5 * 1024 * 1024
      });
      
      return new Promise((resolve, reject) => {
        client.putObject(bucketName, objectName, fileStream, metaData, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    
    // Estratégia 2: Upload com tamanho de parte médio
    async () => {
      console.log('Tentando estratégia 2: Upload com 10MB');
      const client = new Minio.Client({
        ...minioConfig,
        partSize: 10 * 1024 * 1024
      });
      
      return new Promise((resolve, reject) => {
        client.putObject(bucketName, objectName, fileStream, fileSize, metaData, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    
    // Estratégia 3: Upload com tamanho específico e sem especificar o tamanho total
    async () => {
      console.log('Tentando estratégia 3: Upload sem especificar tamanho total');
      const client = new Minio.Client({
        ...minioConfig,
        partSize: 8 * 1024 * 1024 
      });
      
      return new Promise((resolve, reject) => {
        client.putObject(bucketName, objectName, fileStream, metaData, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    
    // Estratégia 4: Upload com cliente básico e configurações mínimas
    async () => {
      console.log('Tentando estratégia 4: Upload com configuração mínima');
      const client = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: parseInt(process.env.MINIO_PORT) || 443,
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
        region: process.env.MINIO_REGION || 'us-east-1'
      });
      
      return new Promise((resolve, reject) => {
        client.putObject(bucketName, objectName, fileStream, metaData, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    
    // Estratégia 5: Último recurso - tentar usar o cliente padrão diretamente
    async () => {
      console.log('Tentando estratégia 5: Upload com cliente padrão');
      return new Promise((resolve, reject) => {
        minioClient.putObject(bucketName, objectName, fileStream, metaData, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }
  ];
  
  // Tentar estratégias em sequência
  for (let attempt = 0; attempt < Math.min(strategies.length, maxRetries); attempt++) {
    try {
      // Reabrir o stream se necessário
      if (attempt > 0 && typeof fileStream.path === 'string') {
        fileStream = fs.createReadStream(fileStream.path);
      }
      
      // Executar a estratégia atual
      await strategies[attempt]();
      console.log(`Upload bem-sucedido com estratégia ${attempt + 1}`);
      return true;
    } catch (error) {
      lastError = error;
      console.log(`Falha na estratégia ${attempt + 1}: ${error.code || error.message}`);
    }
  }
  
  // Todas as estratégias falharam
  console.error('Todas as estratégias de upload falharam');
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
