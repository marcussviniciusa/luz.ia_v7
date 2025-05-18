const Pratica = require('../models/Pratica');
const RegistroPratica = require('../models/RegistroPratica');
const Content = require('../models/Content');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { minioClient } = require('../config/minio');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// @desc    Obter todas as práticas
// @route   GET /api/praticas
// @access  Private
exports.getPraticas = asyncHandler(async (req, res, next) => {
  // Opções de filtro para práticas tradicionais
  const { categoria, destaque, page = 1, limit = 10, search } = req.query;
  const praticasFilter = {};
  
  // Filtrar por categoria para práticas tradicionais, se fornecido
  if (categoria && categoria !== 'todas') {
    praticasFilter.categoria = categoria;
  }
  
  // Filtrar práticas em destaque, se solicitado
  if (destaque === 'true') {
    praticasFilter.destaque = true;
  }
  
  // Para usuários admin, mostrar todas as práticas, independente do status
  if (req.user && req.user.role === 'admin') {
    // Não aplicar filtro de ativa para administradores
    console.log('Usuário admin acessando práticas, mostrando todas');
  } else {
    // Filtrar apenas práticas ativas para usuários comuns
    praticasFilter.ativa = true;
  }
  
  // Se for admin e quiser ver todas (incluindo inativas)
  if (req.user.role === 'admin' && req.query.all === 'true') {
    delete praticasFilter.ativa;
  }
  
  // Parâmetros para paginação
  const limitNum = parseInt(limit);
  const skip = (parseInt(page) - 1) * limitNum;
  
  // Buscar práticas tradicionais
  const praticas = await Pratica.find(praticasFilter)
    .sort({ ordem: 1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  // Contar total de práticas tradicionais
  const totalPraticas = await Pratica.countDocuments(praticasFilter);
  
  // Filtrar para conteúdos do tipo 'praticas' - usando um filtro mais flexível
  // para lidar com possíveis variações de capitalização ou pluralização
  const contentsFilter = {
    $or: [
      { category: 'praticas' },
      { category: 'Praticas' },
      { category: 'práticas' },
      { category: 'Práticas' },
      { category: 'pratica' },
      { category: 'Pratica' },
      { category: 'prática' },
      { category: 'Prática' }
    ]
  };
  
  // Apenas publicados
  if (req.query.all !== 'true' || req.user.role !== 'admin') {
    contentsFilter.status = 'published';
  }
  
  console.log('Buscando conteúdos com filtro ampliado:', JSON.stringify(contentsFilter));
  
  // Busca por texto, se fornecido
  if (search) {
    contentsFilter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Buscar conteúdos do tipo 'praticas'
  const contents = await Content.find(contentsFilter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  console.log('Conteúdos encontrados:', contents.length);
  if (contents.length > 0) {
    console.log('Amostra do primeiro conteúdo:', JSON.stringify(contents[0], null, 2));
  } else {
    console.log('Nenhum conteúdo encontrado com o filtro especificado.');
  }
  
  // Contar total de conteúdos do tipo 'praticas'
  const totalContents = await Content.countDocuments(contentsFilter);
  console.log('Total de conteúdos:', totalContents);
  
  // Mapear conteúdos para o formato esperado pelo frontend
  const mappedContents = contents.map(content => ({
    _id: content._id,
    titulo: content.title,
    descricao: content.description,
    categoria: content.type === 'video' ? 'video' : 'meditacao', // Mapeamento básico de categoria
    imagemCapa: content.imageUrl, // URL da imagem já está no formato correto
    tipoConteudo: 'content', // Identificador para diferenciar de práticas tradicionais
    audioPath: content.contentUrl || '', // URL do conteúdo (vídeo/áudio) se existir
    duracao: 0, // Não temos essa informação nos conteúdos
    createdAt: content.createdAt
  }));
  
  // Combinar resultados
  const combinedResults = [...praticas, ...mappedContents];
  
  // Ordenar por data de criação (mais recentes primeiro)
  combinedResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.status(200).json({
    success: true,
    count: combinedResults.length,
    total: totalPraticas + totalContents,
    data: combinedResults
  });
});

// @desc    Obter uma prática específica
// @route   GET /api/praticas/:id
// @access  Private
exports.getPratica = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Se não for admin e a prática não estiver ativa, negar acesso
  if (req.user.role !== 'admin' && !pratica.ativa) {
    return next(
      new ErrorResponse('Esta prática não está disponível no momento', 403)
    );
  }
  
  res.status(200).json({
    success: true,
    data: pratica
  });
});

// @desc    Criar nova prática (apenas admin)
// @route   POST /api/praticas
// @access  Private/Admin
exports.createPratica = asyncHandler(async (req, res, next) => {
  try {
    console.log('Criando nova prática guiada:', req.body);
    
    // Validar se tem todos os campos necessários
    if (!req.body.titulo || !req.body.descricao) {
      return next(
        new ErrorResponse('Por favor, preencha o título e a descrição', 400)
      );
    }
    
    // Garantir que categoria tenha um valor válido
    if (!req.body.categoria) {
      req.body.categoria = 'outro';
    }
    
    // Se não houver duração, definir como zero
    if (!req.body.duracao) {
      req.body.duracao = 0;
    }
    
    // Dados básicos da prática
    const pratica = await Pratica.create({
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      categoria: req.body.categoria || 'meditacao',
      audioPath: '', // Será definido após o upload
      duracao: req.body.duracao || 0,
      imagemCapa: '', // Será definido após o upload
      destaque: req.body.destaque || false,
      ordem: req.body.ordem || 0,
      ativa: req.body.ativa !== undefined ? req.body.ativa : true
    });
    
    console.log('Prática criada com sucesso:', pratica);
      
    res.status(201).json({
      success: true,
      data: pratica
    });
  } catch (error) {
    console.error('Erro ao criar prática:', error.message);
    return next(new ErrorResponse(`Erro ao criar prática: ${error.message}`, 400));
  }
});

// @desc    Processar uploads de arquivos para uma prática (apenas admin)
// @route   PUT /api/praticas/:id/uploads
// @access  Private/Admin
exports.uploadPraticaFiles = asyncHandler(async (req, res, next) => {
  console.log('========== INICIANDO UPLOAD DE ARQUIVOS ==========');
  console.log('Processando upload de arquivos para prática:', req.params.id);
  console.log('Arquivos recebidos:', req.files ? Object.keys(req.files) : 'nenhum');
  if (req.files) {
    if (req.files.audioFile) {
      console.log('Detalhes do arquivo de áudio:', {
        nome: req.files.audioFile.name,
        tipo: req.files.audioFile.mimetype,
        tamanho: req.files.audioFile.size
      });
    }
    if (req.files.imagemFile) {
      console.log('Detalhes do arquivo de imagem:', {
        nome: req.files.imagemFile.name,
        tipo: req.files.imagemFile.mimetype,
        tamanho: req.files.imagemFile.size
      });
    }
  }
  
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Configurar bucket do MinIO
  const bucketName = process.env.MINIO_BUCKET_NAME || 'luz-ia';
  
  // Verificar se o bucket existe
  try {
    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log(`Bucket ${bucketName} existe? ${bucketExists}`);
    
    if (!bucketExists) {
      console.log(`Criando bucket ${bucketName}...`);
      await minioClient.makeBucket(bucketName);
      console.log(`Bucket ${bucketName} criado com sucesso`);
    }
  } catch (error) {
    console.error(`Erro ao verificar/criar bucket ${bucketName}:`, error);
    return next(new ErrorResponse(`Erro ao configurar armazenamento: ${error.message}`, 500));
  }
  
  // Processar upload de áudio
  if (req.files && req.files.audioFile) {
    const audioFile = req.files.audioFile;
    const audioFileName = `praticas/${Date.now()}-${uuidv4()}.mp3`;
    
    console.log('=========== UPLOAD DE ÁUDIO ===========');
    console.log('Salvando arquivo de áudio:', audioFileName);
    console.log('Informações do arquivo:', {
      nome: audioFile.name,
      tamanho: audioFile.size,
      tipo: audioFile.mimetype,
      md5: audioFile.md5
    });
    console.log('Conteúdo do req.files:', Object.keys(req.files));
    console.log('Prática antes da atualização - ID:', pratica._id);
    console.log('Prática antes da atualização - AudioPath:', pratica.audioPath || 'Vazio');
    console.log('======================================');
    
    // Verificar se temos um arquivo temporário ou dados do arquivo
    if (!audioFile.tempFilePath && (!audioFile.data || audioFile.data.length === 0)) {
      console.error('ERRO: Dados do arquivo estão vazios e não há arquivo temporário!');
      return next(new ErrorResponse('Os dados do arquivo de áudio estão vazios', 400));
    }
    
    console.log('Arquivo temporário:', audioFile.tempFilePath || 'Não disponível');
    console.log('Tamanho do arquivo:', audioFile.size);
    
    // Definir metadados para o arquivo
    const metaData = {
      'Content-Type': audioFile.mimetype,
      'X-Amz-Meta-Original-Filename': audioFile.name
    };
    
    try {
      // Primeiro fazemos o upload do arquivo para o MinIO
      console.log(`Iniciando upload para MinIO bucket=${bucketName}, file=${audioFileName}`);
      
      // Verificar se estamos trabalhando com arquivo temporário ou dados em memória
      if (audioFile.tempFilePath) {
        console.log('Usando arquivo temporário para upload:', audioFile.tempFilePath);
        const fs = require('fs');
        // Ler o arquivo temporário e fazer upload
        const fileStream = fs.createReadStream(audioFile.tempFilePath);
        await minioClient.putObject(bucketName, audioFileName, fileStream, audioFile.size, metaData);
      } else {
        console.log('Usando dados em memória para upload, tamanho:', audioFile.data ? audioFile.data.length : 0);
        await minioClient.putObject(bucketName, audioFileName, audioFile.data, audioFile.size, metaData);
      }
      
      console.log('Upload para MinIO concluído com sucesso');
      
      // Depois de confirmar o upload bem-sucedido, atualizamos o caminho na prática
      console.log('Antes de atualizar o audioPath:', pratica.audioPath);
      
      // Forçar a atualização do caminho do áudio
      pratica.audioPath = audioFileName;
      
      // Registrar a mudança para diagnóstico
      console.log('Depois de atualizar o audioPath:', pratica.audioPath);
      console.log('audioFileName:', audioFileName);
      
      // Verificar se o arquivo existe após o upload
      try {
        const stat = await minioClient.statObject(bucketName, audioFileName);
        console.log('Arquivo confirmado no MinIO:', {
          tamanho: stat.size,
          última_modificação: stat.lastModified
        });
      } catch (statError) {
        console.warn('Aviso: Falha ao verificar arquivo após upload:', statError.message);
      }
      
      console.log('Arquivo de áudio salvo com sucesso no bucket', bucketName);
    } catch (error) {
      console.error('Erro ao fazer upload do áudio para MinIO:', error);
      return next(new ErrorResponse(`Erro ao fazer upload do áudio: ${error.message}`, 500));
    }
  } else {
    console.log('Sem arquivos de áudio para upload');
  }
  
  // Processar upload de imagem
  if (req.files && req.files.imagemFile) {
    const imagemFile = req.files.imagemFile;
    const imagemFileName = `praticas/${Date.now()}-${uuidv4()}.jpg`;
    
    console.log('Salvando arquivo de imagem:', imagemFileName);
    
    try {
      // Definir metadados para o arquivo
      const metaData = {
        'Content-Type': imagemFile.mimetype,
        'X-Amz-Meta-Original-Filename': imagemFile.name
      };
      
      // Upload do arquivo para o MinIO
      console.log(`Iniciando upload de imagem para MinIO bucket=${bucketName}, file=${imagemFileName}`);
      
      // Verificar se estamos trabalhando com arquivo temporário ou dados em memória
      if (imagemFile.tempFilePath) {
        console.log('Usando arquivo temporário para upload de imagem:', imagemFile.tempFilePath);
        const fs = require('fs');
        // Ler o arquivo temporário e fazer upload
        const fileStream = fs.createReadStream(imagemFile.tempFilePath);
        await minioClient.putObject(bucketName, imagemFileName, fileStream, imagemFile.size, metaData);
      } else {
        console.log('Usando dados em memória para upload de imagem, tamanho:', imagemFile.data ? imagemFile.data.length : 0);
        await minioClient.putObject(bucketName, imagemFileName, imagemFile.data, imagemFile.size, metaData);
      }
      
      pratica.imagemCapa = imagemFileName;
      console.log('Arquivo de imagem salvo com sucesso');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem para MinIO:', error);
      return next(new ErrorResponse(`Erro ao fazer upload da imagem: ${error.message}`, 500));
    }
  }
  
  // Salvar prática com os novos caminhos de arquivo
  try {
    await pratica.save();
    
    console.log('Prática atualizada com sucesso:', {
      id: pratica._id,
      audioPath: pratica.audioPath,
      imagemCapa: pratica.imagemCapa
    });
    
    // Verificar se o MinIO consegue acessar o arquivo (opcional, apenas para garantir)
    if (pratica.audioPath) {
      try {
        const stat = await minioClient.statObject(bucketName, pratica.audioPath);
        console.log('Verificação do arquivo no MinIO:', {
          existe: true,
          tamanho: stat.size,
          lastModified: stat.lastModified
        });
      } catch (err) {
        console.warn('Aviso: Não foi possível verificar o arquivo no MinIO:', err.message);
      }
    }
    
    res.status(200).json({
      success: true,
      data: pratica
    });
  } catch (saveError) {
    console.error('Erro ao salvar prática:', saveError);
    return next(new ErrorResponse(`Erro ao salvar informações da prática: ${saveError.message}`, 500));
  }
  
  console.log('========== UPLOAD CONCLUÍDO COM SUCESSO ==========');
});

// @desc    Atualizar prática (apenas admin)
// @route   PUT /api/praticas/:id
// @access  Private/Admin
exports.updatePratica = asyncHandler(async (req, res, next) => {
  let pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Atualizar prática
  pratica = await Pratica.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: pratica
  });
});

// @desc    Excluir prática (apenas admin)
// @route   DELETE /api/praticas/:id
// @access  Private/Admin
exports.deletePratica = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Remover áudio e imagem do MinIO
  try {
    if (pratica.audioPath) {
      await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, pratica.audioPath);
    }
    
    if (pratica.imagemCapa && pratica.imagemCapa !== 'praticas/default-cover.jpg') {
      await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, pratica.imagemCapa);
    }
  } catch (error) {
    console.error('Erro ao remover arquivos do MinIO:', error);
    // Continuar mesmo com erro para remover o registro do banco
  }
  
  // Excluir prática
  await pratica.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Ativar/desativar prática (apenas admin)
// @route   PUT /api/praticas/:id/toggle
// @access  Private/Admin
exports.togglePratica = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Inverter status ativo
  pratica.ativa = !pratica.ativa;
  await pratica.save();
  
  res.status(200).json({
    success: true,
    data: pratica
  });
});

// @desc    Upload de áudio para prática (apenas admin)
// @route   PUT /api/praticas/:id/audio
// @access  Private/Admin
exports.uploadAudio = asyncHandler(async (req, res, next) => {
  // Esta função será implementada pelo middleware multer no arquivo de rotas
  // Ver rota correspondente em routes/praticas.js
});

// @desc    Upload de imagem de capa para prática (apenas admin)
// @route   PUT /api/praticas/:id/imagem
// @access  Private/Admin
exports.uploadImagem = asyncHandler(async (req, res, next) => {
  // Esta função será implementada pelo middleware multer no arquivo de rotas
  // Ver rota correspondente em routes/praticas.js
});

// @desc    Obter URL pré-assinada para streaming de áudio
// @route   GET /api/praticas/:id/audio-url
// @access  Private
exports.getAudioUrl = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Se não for admin e a prática não estiver ativa, negar acesso
  if (req.user.role !== 'admin' && !pratica.ativa) {
    return next(
      new ErrorResponse('Esta prática não está disponível no momento', 403)
    );
  }
  
  try {
    // Gerar URL pré-assinada para o áudio (válida por 2 horas)
    const url = await minioClient.presignedGetObject(
      process.env.MINIO_BUCKET_NAME,
      pratica.audioPath,
      2 * 60 * 60 // 2 horas em segundos
    );
    
    // Registrar o início da prática
    await RegistroPratica.create({
      user: req.user.id,
      pratica: pratica._id,
      tipoEvento: 'inicio'
    });
    
    res.status(200).json({
      success: true,
      url
    });
  } catch (error) {
    console.error('Erro ao gerar URL para áudio:', error);
    return next(
      new ErrorResponse('Erro ao gerar URL para áudio', 500)
    );
  }
});

// @desc    Registrar conclusão de prática
// @route   POST /api/praticas/:id/concluir
// @access  Private
exports.concluirPratica = asyncHandler(async (req, res, next) => {
  const pratica = await Pratica.findById(req.params.id);
  
  if (!pratica) {
    return next(
      new ErrorResponse(`Prática não encontrada com id ${req.params.id}`, 404)
    );
  }
  
  // Registrar conclusão da prática
  await RegistroPratica.create({
    user: req.user.id,
    pratica: pratica._id,
    tipoEvento: 'conclusao',
    duracao: req.body.duracao || pratica.duracao // Tempo efetivo de prática
  });
  
  res.status(200).json({
    success: true,
    message: 'Prática concluída com sucesso'
  });
});

// @desc    Obter histórico de práticas do usuário
// @route   GET /api/praticas/historico
// @access  Private
exports.getHistorico = asyncHandler(async (req, res, next) => {
  // Obter parâmetros de filtro
  const { limit = 30, page = 1 } = req.query;
  
  // Calcular skip para paginação
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Agregação para obter histórico de práticas concluídas
  const historico = await RegistroPratica.aggregate([
    // Filtrar apenas registros do usuário atual e apenas conclusões
    { 
      $match: { 
        user: mongoose.Types.ObjectId(req.user.id),
        tipoEvento: 'conclusao'
      } 
    },
    // Ordenar por data (mais recente primeiro)
    { $sort: { createdAt: -1 } },
    // Aplicar paginação
    { $skip: skip },
    { $limit: parseInt(limit) },
    // Juntar com a coleção de práticas para obter detalhes
    {
      $lookup: {
        from: 'praticas',
        localField: 'pratica',
        foreignField: '_id',
        as: 'praticaDetalhes'
      }
    },
    // Desenrolar o array de práticas (que terá apenas um item)
    { $unwind: '$praticaDetalhes' },
    // Projetar apenas os campos necessários
    {
      $project: {
        _id: 1,
        data: '$createdAt',
        duracao: 1,
        praticaId: '$pratica',
        titulo: '$praticaDetalhes.titulo',
        categoria: '$praticaDetalhes.categoria',
        imagemCapa: '$praticaDetalhes.imagemCapa'
      }
    }
  ]);
  
  // Contar o total de práticas concluídas
  const total = await RegistroPratica.countDocuments({
    user: req.user.id,
    tipoEvento: 'conclusao'
  });
  
  res.status(200).json({
    success: true,
    count: historico.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    },
    data: historico
  });
});

// @desc    Obter estatísticas de prática do usuário
// @route   GET /api/praticas/stats
// @access  Private
exports.getStats = asyncHandler(async (req, res, next) => {
  // Agregação para obter estatísticas de práticas
  const stats = await RegistroPratica.aggregate([
    // Filtrar apenas registros do usuário atual e apenas conclusões
    { 
      $match: { 
        user: mongoose.Types.ObjectId(req.user.id),
        tipoEvento: 'conclusao'
      } 
    },
    // Agrupar por categoria da prática e calcular total e duração
    {
      $lookup: {
        from: 'praticas',
        localField: 'pratica',
        foreignField: '_id',
        as: 'praticaDetalhes'
      }
    },
    { $unwind: '$praticaDetalhes' },
    {
      $group: {
        _id: '$praticaDetalhes.categoria',
        total: { $sum: 1 },
        duracaoTotal: { $sum: '$duracao' },
        ultimaPratica: { $max: '$createdAt' }
      }
    },
    // Renomear _id para categoria para maior clareza
    {
      $project: {
        _id: 0,
        categoria: '$_id',
        total: 1,
        duracaoTotal: 1,
        ultimaPratica: 1
      }
    }
  ]);
  
  // Calcular estatísticas gerais
  const totalPraticas = await RegistroPratica.countDocuments({
    user: req.user.id,
    tipoEvento: 'conclusao'
  });
  
  // Obter a primeira e a última prática
  const primeiraPratica = await RegistroPratica.findOne({
    user: req.user.id,
    tipoEvento: 'conclusao'
  }).sort({ createdAt: 1 });
  
  const ultimaPratica = await RegistroPratica.findOne({
    user: req.user.id,
    tipoEvento: 'conclusao'
  }).sort({ createdAt: -1 });
  
  // Calcular dias consecutivos de prática (streak)
  const streak = await calcularStreak(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      categorias: stats,
      totalPraticas,
      primeiraPraticaData: primeiraPratica ? primeiraPratica.createdAt : null,
      ultimaPraticaData: ultimaPratica ? ultimaPratica.createdAt : null,
      streak
    }
  });
});

// Função auxiliar para calcular dias consecutivos de prática
const calcularStreak = async (userId) => {
  // Obter todas as datas de prática ordenadas por data (mais recente primeiro)
  const registros = await RegistroPratica.find({
    user: userId,
    tipoEvento: 'conclusao'
  })
  .sort({ createdAt: -1 })
  .select('createdAt');
  
  if (registros.length === 0) {
    return 0;
  }
  
  // Verificar se a última prática foi hoje ou ontem
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const ultimaPraticaData = new Date(registros[0].createdAt);
  ultimaPraticaData.setHours(0, 0, 0, 0);
  
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  
  // Se a última prática não foi hoje nem ontem, o streak é 0
  if (ultimaPraticaData.getTime() !== hoje.getTime() && 
      ultimaPraticaData.getTime() !== ontem.getTime()) {
    return 0;
  }
  
  // Iniciar contagem do streak
  let streak = 1;
  let dataAnterior = ultimaPraticaData;
  
  // Converter todas as datas para o início do dia para comparação
  const datasUnicas = new Set();
  registros.forEach(reg => {
    const data = new Date(reg.createdAt);
    data.setHours(0, 0, 0, 0);
    datasUnicas.add(data.getTime());
  });
  
  // Converter o Set para um array e ordenar
  const datasOrdenadas = [...datasUnicas].sort((a, b) => b - a);
  
  // Calcular streak contando dias consecutivos
  for (let i = 1; i < datasOrdenadas.length; i++) {
    const dataAtual = new Date(datasOrdenadas[i]);
    const dataEsperada = new Date(dataAnterior);
    dataEsperada.setDate(dataEsperada.getDate() - 1);
    
    if (dataAtual.getTime() === dataEsperada.getTime()) {
      streak++;
      dataAnterior = dataAtual;
    } else {
      break;
    }
  }
  
  return streak;
};
