const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('langchain/prompts');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const fs = require('fs').promises;
const path = require('path');

// Classe principal que implementa a LUZ IA usando LangChain e RAG
class LuzIA {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
    });
    this.vectorStore = null;
    this.embeddings = new OpenAIEmbeddings();
    this.prompts = {};
    this.courseTranscriptPath = path.join(__dirname, '../../../ai-training/transcricoes');
    
    // Inicialize os prompts e o vetor de conhecimento
    this.initialize();
  }

  // Inicializa o sistema de IA
  async initialize() {
    try {
      console.log('Inicializando LUZ IA...');
      await this.loadPrompts();
      await this.createVectorStore();
      console.log('LUZ IA inicializada com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar LUZ IA:', error);
    }
  }

  // Carrega os prompts pré-definidos
  async loadPrompts() {
    this.prompts = {
      default: {
        template: `Você é a LUZ IA, uma assistente de desenvolvimento pessoal baseada na metodologia do curso "Jornada Mente Merecedora".
        
Seu objetivo é ajudar a usuária em sua jornada de transformação pessoal, com foco em:
- Identificar e superar crenças limitantes
- Desenvolver uma nova autoimagem
- Elevar a vibração financeira
- Acessar estados mentais de alta performance
- Aplicar técnicas de manifestação consciente

Use sempre uma linguagem acolhedora, inspiradora e transformadora. Evite termos técnicos desnecessários e mantenha o foco na prática.

Por favor, responda à seguinte pergunta usando seu conhecimento do curso e sua sabedoria:
{question}

Contexto relevante do curso:
{context}`,
      },
      autoimagem: {
        template: `Você é a LUZ IA, especialista em transformação da autoimagem segundo a metodologia do curso "Jornada Mente Merecedora".

Ajude a usuária a identificar como está a sua autoimagem atual e como elevar sua percepção de si mesma.
Foque em aspectos como:
- Diálogo interno
- Padrões de pensamento limitantes sobre si
- Técnicas para reprogramação da autoimagem
- Visualização da melhor versão de si

Use sempre uma linguagem acolhedora e transformadora.

Pergunta sobre autoimagem:
{question}

Contexto relevante do curso:
{context}`,
      },
      financeiro: {
        template: `Você é a LUZ IA, especialista em transformação da vibração financeira segundo a metodologia do curso "Jornada Mente Merecedora".

Ajude a usuária a identificar padrões limitantes em sua relação com dinheiro e prosperidade.
Foque em aspectos como:
- Crenças familiares sobre dinheiro
- Padrões de escassez vs. abundância
- Desbloqueio da recepção financeira
- O merecimento como base da riqueza

Use sempre uma linguagem acolhedora e transformadora.

Pergunta sobre vibração financeira:
{question}

Contexto relevante do curso:
{context}`,
      },
      meditacao: {
        template: `Você é a LUZ IA, guia para estados meditativos Alpha segundo a metodologia do curso "Jornada Mente Merecedora".

Ajude a usuária a acessar estados mentais elevados através da meditação.
Foque em aspectos como:
- Técnicas de respiração
- Visualização guiada
- Acesso ao estado Alpha
- Reprogramação mental em estado relaxado

Use sempre uma linguagem acolhedora, suave e guiadora.

Pergunta sobre meditação:
{question}

Contexto relevante do curso:
{context}`,
      },
      // Outros prompts podem ser adicionados conforme necessário
    };
  }

  // Carrega as transcrições do curso e cria a base de conhecimento vetorial
  async createVectorStore() {
    try {
      let documents = [];
      
      // Ler os arquivos de transcrição
      const files = await fs.readdir(this.courseTranscriptPath);
      console.log(`Encontrados ${files.length} arquivos de transcrição`);
      
      for (const file of files) {
        if (file.endsWith('.txt') || file.endsWith('.md')) {
          const filePath = path.join(this.courseTranscriptPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          documents.push(content);
        }
      }
      
      if (documents.length === 0) {
        console.log('Nenhuma transcrição encontrada. Usando texto de exemplo para demonstração.');
        documents = [
          'O curso Jornada Mente Merecedora trabalha com a reprogramação da mente subconsciente para atrair abundância.',
          'A técnica do estado Alpha permite acessar o subconsciente para reprogramação mental.',
          'O Protocolo Chave Mestra é um conjunto de práticas diárias para manifestação consciente.',
          'A vibração financeira é determinada por nossas crenças inconscientes sobre dinheiro.'
        ];
      }
      
      // Dividir os documentos em pedaços menores
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      
      const splitDocs = await textSplitter.createDocuments(documents);
      console.log(`Documentos divididos em ${splitDocs.length} segmentos`);
      
      // Criar a base de conhecimento vetorial
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        this.embeddings
      );
      
      console.log('Base de conhecimento vetorial criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar base de conhecimento:', error);
      // Criar uma store vazia para evitar erros
      this.vectorStore = new MemoryVectorStore(this.embeddings);
    }
  }

  // Obtém o contexto relevante do curso baseado na pergunta
  async getRelevantContext(question, maxTokens = 2000) {
    if (!this.vectorStore) {
      return 'Base de conhecimento não disponível.';
    }
    
    try {
      const relevantDocs = await this.vectorStore.similaritySearch(
        question,
        4  // Número de documentos a recuperar
      );
      
      return relevantDocs.map(doc => doc.pageContent).join('\n\n');
    } catch (error) {
      console.error('Erro ao buscar contexto relevante:', error);
      return 'Erro ao buscar contexto relevante.';
    }
  }

  // Processa a pergunta do usuário e retorna uma resposta
  async processQuestion(question, promptType = 'default') {
    try {
      // Obter o template do prompt correto
      const promptTemplate = this.prompts[promptType] || this.prompts.default;
      
      // Buscar contexto relevante
      const context = await this.getRelevantContext(question);
      
      // Criar o prompt formatado
      const prompt = PromptTemplate.fromTemplate(promptTemplate.template);
      
      // Configurar a sequência de processamento
      const chain = RunnableSequence.from([
        {
          question: input => input.question,
          context: input => input.context
        },
        prompt,
        this.model,
        new StringOutputParser()
      ]);
      
      // Executar a sequência e retornar a resposta
      const response = await chain.invoke({
        question: question,
        context: context
      });
      
      return {
        success: true,
        response: response,
        promptType: promptType
      };
    } catch (error) {
      console.error('Erro ao processar pergunta:', error);
      return {
        success: false,
        response: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente mais tarde.',
        error: error.message
      };
    }
  }

  // Permite atualizar a base de conhecimento com novas transcrições
  async updateKnowledgeBase() {
    try {
      await this.createVectorStore();
      return { success: true, message: 'Base de conhecimento atualizada com sucesso.' };
    } catch (error) {
      console.error('Erro ao atualizar base de conhecimento:', error);
      return { 
        success: false, 
        message: 'Erro ao atualizar base de conhecimento.',
        error: error.message 
      };
    }
  }

  // Atualiza ou adiciona um prompt personalizado
  async updatePrompt(promptName, templateContent) {
    try {
      if (!promptName || !templateContent) {
        return { 
          success: false, 
          message: 'Nome do prompt e conteúdo do template são obrigatórios.' 
        };
      }
      
      this.prompts[promptName] = {
        template: templateContent
      };
      
      return { 
        success: true, 
        message: `Prompt '${promptName}' atualizado com sucesso.` 
      };
    } catch (error) {
      console.error('Erro ao atualizar prompt:', error);
      return { 
        success: false, 
        message: 'Erro ao atualizar prompt.',
        error: error.message 
      };
    }
  }

  // Lista todos os prompts disponíveis
  getAvailablePrompts() {
    return Object.keys(this.prompts);
  }
}

// Exporta uma instância única da classe LuzIA (Singleton)
module.exports = new LuzIA();
