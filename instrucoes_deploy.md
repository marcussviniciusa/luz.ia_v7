# Instruções para Resolver Problemas de Deploy do LUZ IA

## Problemas Identificados

Ao executar o container Docker do LUZ IA, foram identificados os seguintes problemas:

1. **Erro ao acessar diretório de transcrições**:
   ```
   Erro ao criar base de conhecimento: [Error: ENOENT: no such file or directory, scandir '/app/ai-training/transcricoes']
   ```

2. **Erro de arquivos estáticos não encontrados**:
   ```
   Error: ENOENT: no such file or directory, stat '/app/client/build/index.html'
   ```

## Soluções Implementadas

### 1. Correção no Dockerfile

O Dockerfile foi modificado para:
- Criar os diretórios necessários que não estavam sendo criados automaticamente
- Copiar os arquivos de build para os caminhos corretos
- Adicionar um arquivo de exemplo de transcrição para evitar erros

```dockerfile
# Estágio de build do cliente
FROM node:18-alpine as client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Estágio de build do servidor
FROM node:18-alpine as server-build

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Estágio final
FROM node:18-alpine

WORKDIR /app

# Criar diretórios necessários
RUN mkdir -p /app/ai-training/transcricoes
RUN mkdir -p /app/client/build
RUN mkdir -p /app/server/public

# Copiar arquivos do servidor
COPY --from=server-build /app/server ./server

# Copiar os arquivos de build do cliente para AMBOS os caminhos
# Caminho 1: /app/client/build (referenciado no código)
COPY --from=client-build /app/client/build ./client/build
# Caminho 2: /app/server/public (para servir arquivos estáticos via express.static)
COPY --from=client-build /app/client/build ./server/public

# Expor a porta do servidor
EXPOSE 5000

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=5000

# Criar um arquivo de transcrição de exemplo para evitar erro
RUN echo '{"text":"Exemplo de transcrição para teste."}' > /app/ai-training/transcricoes/exemplo.json

# Verificar arquivos e diretórios antes de iniciar
RUN ls -la /app
RUN ls -la /app/server
RUN ls -la /app/server/public || echo "Diretório public vazio ou não existe"
RUN ls -la /app/client/build || echo "Diretório client/build vazio ou não existe"

# Iniciar o servidor
WORKDIR /app/server
CMD ["node", "server.js"]
```

### 2. Configuração de Volumes no Docker Compose

O arquivo docker-compose.yml foi atualizado para incluir:
- Volumes persistentes para os dados da IA e arquivos temporários
- Verificação de saúde (healthcheck) para monitorar o serviço
- Melhor gerenciamento de deploy e reinicialização

```yaml
version: '3.8'

services:
  luz-ia:
    image: ${DOCKERHUB_USERNAME}/luz-ia:latest
    container_name: luz-ia
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRE=${JWT_EXPIRE}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_PORT=${MINIO_PORT}
      - MINIO_USE_SSL=${MINIO_USE_SSL}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET_NAME=${MINIO_BUCKET_NAME}
    volumes:
      # Volume para transcrições e arquivos de treinamento da IA
      - luz-ia-data:/app/ai-training
      # Volume para arquivos temporários de upload
      - luz-ia-tmp:/app/server/tmp
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - traefik-public
      - backend
    deploy:
      replicas: 1
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        max_attempts: 3
        window: 120s
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.luz-ia.rule=Host(`${DOMAIN_NAME}`)"
        - "traefik.http.routers.luz-ia.entrypoints=websecure"
        - "traefik.http.routers.luz-ia.tls.certresolver=letsencrypt"
        - "traefik.http.services.luz-ia.loadbalancer.server.port=5000"
        - "traefik.docker.network=traefik-public"

networks:
  traefik-public:
    external: true
  backend:
    driver: overlay
    internal: true
    
volumes:
  luz-ia-data:
    driver: local
  luz-ia-tmp:
    driver: local
```

### 3. Endpoint de Health Check

Foi adicionado um endpoint de health check para permitir o monitoramento do serviço:

```javascript
// Em /server/routes/health.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'LUZ IA API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

module.exports = router;
```

**Importante**: Adicionar este endpoint ao servidor em `/server/server.js`:

```javascript
// Adicionar aos imports
const healthRoutes = require('./routes/health');

// Adicionar às rotas da API (antes do middleware de erro)
app.use('/api/health', healthRoutes);
```

## Instruções para Deploy

### Passo 1: Preparação do Código

1. Certifique-se de que o endpoint `/api/health` está implementado no servidor
2. Verifique se o `.env` está configurado corretamente com todas as variáveis necessárias

### Passo 2: Build e Push da Imagem Docker

1. Faça login no Docker Hub:
   ```bash
   docker login
   ```

2. Construa a imagem Docker:
   ```bash
   docker build -t seuusername/luz-ia:latest .
   ```

3. Envie a imagem para o Docker Hub:
   ```bash
   docker push seuusername/luz-ia:latest
   ```

### Passo 3: Configuração no Portainer

1. Certifique-se de que a rede `traefik-public` existe:
   ```bash
   docker network create --driver=overlay --attachable traefik-public
   ```

2. Crie um arquivo `.env` no servidor de deploy com todas as variáveis necessárias:
   ```
   DOCKERHUB_USERNAME=seuusername
   DOMAIN_NAME=seudominio.com
   MONGO_URI=mongodb://usuario:senha@host:porta/database
   JWT_SECRET=seu_jwt_secret_seguro
   JWT_EXPIRE=30d
   MINIO_ENDPOINT=seu_minio_host
   MINIO_PORT=9000
   MINIO_USE_SSL=true
   MINIO_ACCESS_KEY=sua_access_key
   MINIO_SECRET_KEY=sua_secret_key
   MINIO_BUCKET_NAME=luz-ia
   ```

3. No Portainer, crie uma nova Stack:
   - Nome: `luz-ia`
   - Upload do arquivo: selecione o arquivo `docker-compose.yml`
   - Environment: selecione o arquivo `.env` ou configure as variáveis manualmente
   - Clique em "Deploy the stack"

### Passo 4: Verificação e Troubleshooting

1. Verifique os logs do contêiner após o deploy:
   ```bash
   docker logs -f luz-ia
   ```

2. Verifique se o endpoint de saúde está funcionando:
   ```bash
   curl https://seudominio.com/api/health
   ```

3. Se ocorrerem problemas, verifique:
   - Se os volumes estão montados corretamente
   - Se as variáveis de ambiente estão definidas
   - Se a rede do Traefik está configurada corretamente
   - Se o MongoDB e MinIO estão acessíveis

## Resolução de Problemas Comuns

1. **Erro ao acessar MongoDB**:
   - Verifique se o MongoDB está em execução
   - Confirme se a URI do MongoDB está correta
   - Verifique as regras de firewall entre o contêiner e o MongoDB

2. **Erro ao acessar MinIO**:
   - Verifique se o MinIO está em execução
   - Confirme se as credenciais do MinIO estão corretas
   - Verifique se o bucket existe no MinIO

3. **Problemas com Traefik**:
   - Certifique-se de que o Traefik está em execução
   - Verifique se a rede `traefik-public` existe e está configurada corretamente
   - Confirme se o seu domínio está apontando para o servidor

4. **Problemas com arquivos estáticos**:
   - Verifique se o build do cliente foi concluído com êxito
   - Confirme se os arquivos estão nos caminhos esperados dentro do contêiner
