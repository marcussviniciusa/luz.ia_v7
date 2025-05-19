# Documentação do Sistema de Práticas - Luz.IA

## Visão Geral

O Sistema de Práticas é um módulo do Luz.IA que permite o gerenciamento e reprodução de práticas meditativas, incluindo arquivos de áudio e imagens. Este documento detalha a arquitetura, problemas encontrados e soluções implementadas para referência de desenvolvedores.

## Arquitetura

### Frontend

O frontend do Sistema de Práticas consiste em:

- **PraticasManagement.js**: Componente principal para gerenciar práticas (criar, editar, listar, excluir)
- **AudioPlayer.js**: Componente para reprodução de arquivos de áudio

### Backend

O backend consiste em:

- **praticas.js (Controller)**: Gerencia todas as operações relacionadas a práticas
- **Pratica.js (Model)**: Define o esquema de dados para práticas
- **proxy.js (Controller)**: Gerencia o acesso a arquivos armazenados no MinIO
- **minio.js (Config)**: Configuração do cliente MinIO

### Armazenamento

- **MinIO**: Serviço de armazenamento de objetos usado para armazenar arquivos de áudio e imagens
- **MongoDB**: Banco de dados para armazenar metadados das práticas

## Problemas Encontrados e Soluções

### 1. Upload de Arquivos

#### Problema
- O sistema inicialmente não estava configurado para processar uploads de arquivos multipart/form-data
- Não havia tratamento adequado para arquivos temporários criados pelo express-fileupload
- Uploads de arquivos grandes podiam falhar devido ao processamento em memória

#### Solução
- Adicionamos o middleware `express-fileupload` no `server.js`
- Modificamos os controladores para trabalhar tanto com arquivos em memória quanto com arquivos temporários
- Implementamos verificações detalhadas e logs para diagnóstico de problemas de upload

```javascript
// Verificar se estamos trabalhando com arquivo temporário ou dados em memória
if (audioFile.tempFilePath) {
  console.log('Usando arquivo temporário para upload:', audioFile.tempFilePath);
  const fs = require('fs');
  // Ler o arquivo temporário e fazer upload
  const fileStream = fs.createReadStream(audioFile.tempFilePath);
  await minioClient.putObject(bucketName, audioFileName, fileStream, audioFile.size, metaData);
} else {
  console.log('Usando dados em memória para upload:', audioFile.data.length);
  await minioClient.putObject(bucketName, audioFileName, audioFile.data, audioFile.size, metaData);
}
```

### 2. Configuração do MinIO

#### Problema
- As variáveis de ambiente do MinIO não estavam sendo carregadas corretamente
- O bucket do MinIO não era inicializado automaticamente na inicialização do servidor
- A política de acesso público não estava configurada para permitir acesso aos arquivos

#### Solução
- Garantimos que o pacote `dotenv` está configurado corretamente no início do arquivo `server.js`
- Adicionamos a inicialização explícita do bucket MinIO durante a inicialização do servidor
- Configuramos uma política de acesso público para permitir acesso de leitura aos arquivos

```javascript
// Inicializar cliente MinIO e bucket
initializeBucket().catch(err => {
  console.error('Erro ao inicializar o bucket MinIO:', err);
});
```

### 3. Reprodução de Áudio

#### Problema
- O componente AudioPlayer apresentava erros "Cannot read properties of null (reading 'currentTime')"
- Não havia tratamento adequado para situações em que o arquivo de áudio não existia
- O player não tinha um modo de fallback quando o áudio real não podia ser reproduzido

#### Solução
- Adicionamos verificações de nulidade antes de acessar propriedades do elemento de áudio
- Implementamos um modo de fallback que gera um tom de meditação (432Hz)
- Adicionamos tratamento de erros robusto com blocos try/catch

```javascript
// Atualizar o tempo atual a cada segundo
intervalRef.current = setInterval(() => {
  if (audioRef.current) {
    setCurrentTime(audioRef.current.currentTime);
  }
}, 1000);
```

## Configuração e Requisitos

### Variáveis de Ambiente

O sistema requer as seguintes variáveis de ambiente no arquivo `.env`:

```
# MinIO
MINIO_ENDPOINT=s3.marcussviniciusa.cloud
MINIO_PORT=443
MINIO_ACCESS_KEY=sua_access_key
MINIO_SECRET_KEY=sua_secret_key
MINIO_USE_SSL=true
MINIO_BUCKET_NAME=luz-ia
```

### Dependências

- **express-fileupload**: Para processamento de uploads de arquivos
- **minio**: Cliente para interação com o serviço MinIO
- **uuid**: Para geração de nomes de arquivo únicos
- **axios**: Para requisições HTTP no frontend

## Fluxo de Dados

1. **Upload de Arquivo**:
   - Frontend (`PraticasManagement.js`) envia formulário com arquivo para o backend
   - Backend (`praticas.js`) recebe o arquivo e o processa
   - Backend faz upload do arquivo para o MinIO
   - Backend atualiza o caminho do arquivo no banco de dados

2. **Reprodução de Áudio**:
   - Frontend (`PraticasManagement.js`) solicita a abertura do AudioPlayer
   - AudioPlayer verifica a existência do arquivo no MinIO
   - Se o arquivo existir, ele é reproduzido
   - Se o arquivo não existir, um tom padrão é gerado como fallback

## Logs e Diagnóstico

O sistema implementa logs detalhados para diagnóstico de problemas:

- Logs de upload de arquivos (tamanho, tipo, caminho)
- Logs de configuração do MinIO
- Logs de reprodução de áudio
- Logs de erros detalhados

## Melhores Práticas

1. **Tipos de Arquivo**: O sistema está configurado para aceitar arquivos de áudio MP3 e imagens JPEG/PNG.

2. **Verificação de Existência**: Sempre verifique se um arquivo existe no MinIO antes de tentar acessá-lo.

3. **Tratamento de Erros**: Sempre envolva operações de arquivo em blocos try/catch para evitar falhas catastróficas.

4. **Tamanho dos Arquivos**: Monitore o tamanho dos arquivos enviados para evitar sobrecarregar o sistema.

## Resolução de Problemas

### Arquivos Não Aparecem no MinIO

1. Verifique as variáveis de ambiente do MinIO
2. Verifique se o bucket foi inicializado corretamente
3. Verifique os logs de upload para erros específicos

### Erro de Reprodução de Áudio

1. Verifique se o caminho do arquivo está correto no banco de dados
2. Verifique se o arquivo existe no MinIO
3. Verifique se o tipo MIME está configurado corretamente

## Futuros Desenvolvimentos

1. **Transcodificação de Áudio**: Implementar conversão automática de formatos de áudio
2. **Streaming Adaptativo**: Implementar streaming adaptativo para conexões lentas
3. **Controle de Progresso**: Adicionar funcionalidade de retomar a reprodução de onde parou

## Conclusão

O Sistema de Práticas é um componente crítico do Luz.IA, permitindo a gestão e reprodução de conteúdos meditativos. Com as melhorias implementadas, o sistema agora é robusto e capaz de lidar com diferentes cenários de uso, desde o upload de arquivos até a reprodução de áudio com fallback automático.
