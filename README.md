# Portal Mente Merecedora

Um sistema web interativo que potencializa a experiência de transformação pessoal das alunas do curso "Jornada Mente Merecedora" através de ferramentas de autoconhecimento, práticas guiadas e acompanhamento de evolução.

## Tecnologias Principais

- **Frontend**: React com Material-UI (adaptado com esquema de cores personalizado)
- **Backend**: Node.js com Express
- **Banco de Dados**: MongoDB (para perfis, conteúdos e métricas)
- **Armazenamento**: MinIO (para imagens, áudios e documentos)
- **IA Conversacional**: GPT-4o mini com LangChain para implementação RAG
- **Autenticação**: JWT (JSON Web Tokens)

## Estrutura do Projeto

```
/
├── client/                 # Frontend React
│   ├── public/             # Arquivos estáticos
│   └── src/                # Código fonte React
│       ├── assets/         # Imagens e recursos
│       ├── components/     # Componentes reutilizáveis
│       ├── contexts/       # Contextos React (auth, tema)
│       ├── pages/          # Páginas da aplicação
│       └── services/       # Serviços de API e utilitários
│
├── server/                 # Backend Node.js/Express
│   ├── config/             # Configurações
│   ├── controllers/        # Controladores
│   ├── middleware/         # Middlewares
│   ├── models/             # Modelos de dados
│   ├── routes/             # Rotas da API
│   ├── services/           # Serviços
│   │   └── ia/             # Implementação da LUZ IA com LangChain
│   └── utils/              # Utilitários
│
├── docs/                   # Documentação
│
└── ai-training/            # Dados de treinamento para LUZ IA
    └── transcricoes/       # Transcrições do curso
```

## Funcionalidades Principais

Veja o arquivo [funcionalidades.md](./funcionalidades.md) para a lista completa de funcionalidades e status de implementação.

## Configuração e Instalação

### Pré-requisitos

- Node.js (v18 ou superior)
- MongoDB
- MinIO Server
- API Key para GPT-4o mini

### Instalação

1. Clone o repositório
2. Configure as variáveis de ambiente
3. Instale as dependências
4. Execute o servidor de desenvolvimento

```bash
# Instalação do frontend
cd client
npm install
npm start

# Instalação do backend
cd server
npm install
npm run dev
```

## Desenvolvimento

O projeto segue uma estrutura cliente-servidor com:
- Frontend React para interface do usuário
- Backend Node.js para lógica de negócios e integração com IA
- MinIO para armazenamento de objetos
- MongoDB para persistência de dados
- LangChain para implementação do sistema RAG com GPT-4o mini

## Paleta de Cores

- Verde Esmeralda: #1B5E20 (principal)
- Dourado: #FFD700 (detalhes e elementos de destaque)
- Verde Texturizado: #2E7D32 (background)
- Branco: #FFFFFF (texto e áreas de conteúdo)
- Preto: #212121 (texto)
