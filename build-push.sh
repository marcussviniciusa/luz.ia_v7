#!/bin/bash

# Carrega variáveis de ambiente
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
  echo "Arquivo .env não encontrado. Crie-o a partir do .env.sample"
  exit 1
fi

# Verifica se o usuário Docker Hub está configurado
if [ -z "$DOCKERHUB_USERNAME" ]; then
  echo "DOCKERHUB_USERNAME não está configurado no arquivo .env"
  exit 1
fi

# Build da imagem Docker
echo "Construindo a imagem Docker para luz.ia..."
docker build -t $DOCKERHUB_USERNAME/luz-ia:latest .

# Login no Docker Hub (vai solicitar senha)
echo "Fazendo login no Docker Hub como $DOCKERHUB_USERNAME..."
docker login -u $DOCKERHUB_USERNAME

# Push da imagem para o Docker Hub
echo "Enviando a imagem para o Docker Hub..."
docker push $DOCKERHUB_USERNAME/luz-ia:latest

echo "Processo concluído com sucesso!"
