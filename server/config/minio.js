const Minio = require('minio');

// Configuração do cliente MinIO corrigida
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  region: process.env.MINIO_REGION || 'us-east-1',
  pathStyle: true    // Usar Path Style em vez de Virtual Hosted Style
});

// Inicializa o bucket se não existir
const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(process.env.MINIO_BUCKET_NAME);
    
    if (!bucketExists) {
      await minioClient.makeBucket(process.env.MINIO_BUCKET_NAME);
      console.log(`Bucket ${process.env.MINIO_BUCKET_NAME} criado com sucesso`);
      
      // Define política para acesso público de leitura (apenas para arquivos específicos)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: ['*']
            },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${process.env.MINIO_BUCKET_NAME}/public/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(process.env.MINIO_BUCKET_NAME, JSON.stringify(policy));
    }
    
    console.log(`Bucket ${process.env.MINIO_BUCKET_NAME} está pronto para uso`);
  } catch (error) {
    console.error(`Erro ao inicializar o bucket: ${error.message}`);
  }
};

module.exports = { minioClient, initializeBucket };
