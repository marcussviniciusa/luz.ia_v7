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

# Criar um arquivo de transcrição de exemplo para evitar erro (opcional)
RUN echo '{"text":"Exemplo de transcrição para teste."}' > /app/ai-training/transcricoes/exemplo.json

# Verificar arquivos e diretórios antes de iniciar
RUN ls -la /app
RUN ls -la /app/server
RUN ls -la /app/server/public || echo "Diretório public vazio ou não existe"
RUN ls -la /app/client/build || echo "Diretório client/build vazio ou não existe"

# Iniciar o servidor
WORKDIR /app/server
CMD ["node", "server.js"]
