const Manifestacao = require('../models/Manifestacao');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { minioClient } = require('../config/minio');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// @desc    Criar novo item de manifestação
// @route   POST /api/manifestacao
// @access  Private
exports.createManifestacao = asyncHandler(async (req, res, next) => {
  // Log para debug
  console.log('Corpo da requisição recebida:', req.body);
  console.log('Arquivo recebido:', req.file);
  
  // Se o corpo da requisição está vazio mas tem arquivo, provavelmente é um problema com
  // o processamento do FormData
  if (Object.keys(req.body).length === 0 && req.file) {
    return next(new ErrorResponse('Os dados do formulário não foram processados corretamente. Certifique-se de usar Content-Type: multipart/form-data', 400));
  }
  
  // Validar campos obrigatórios
  if (!req.body.titulo) {
    return next(new ErrorResponse('Por favor, adicione um título', 400));
  }
  
  if (!req.body.tipo || !['quadro', 'checklist', 'simbolo'].includes(req.body.tipo)) {
    return next(new ErrorResponse('Tipo de manifestação inválido', 400));
  }
  
  // Criar o objeto da manifestação
  const manifestacaoData = {
    ...req.body,
    user: req.user.id
  };
  
  // Processamento específico para símbolos
  if (req.body.tipo === 'simbolo') {
    // Garantir compatibilidade entre nome e título
    if (req.body.nome && !req.body.titulo) {
      manifestacaoData.titulo = req.body.nome;
    }
    else if (req.body.titulo && !req.body.nome) {
      manifestacaoData.nome = req.body.titulo;
    }
    
    // Garantir que o significado seja armazenado no campo descricao para compatibilidade
    if (req.body.significado) {
      manifestacaoData.descricao = req.body.significado;
    }
    else if (req.body.descricao && !req.body.significado) {
      manifestacaoData.significado = req.body.descricao;
    }
    
    // Certificar-se de que as palavras-chave sejam armazenadas corretamente
    if (req.body.palavrasChave) {
      try {
        // Se for uma string JSON, mantenha-a como está
        if (typeof req.body.palavrasChave === 'string') {
          // Verificar se é um JSON válido
          JSON.parse(req.body.palavrasChave);
          // Se não lançou erro, está ok
          console.log('PalavrasChave processadas com sucesso:', req.body.palavrasChave);
        }
      } catch (error) {
        // Se não for um JSON válido, converter para array e depois para JSON
        console.log('Erro ao processar palavrasChave, convertendo para array:', error);
        manifestacaoData.palavrasChave = JSON.stringify([req.body.palavrasChave]);
      }
    }
    
    // Log para debug
    console.log('Dados processados do símbolo:', manifestacaoData);
  }
  
  // Processar afirmação positiva (se fornecida)
  if (req.body.afirmacao) {
    // Converter o campo 'afirmacao' em um array 'afirmacoes'
    manifestacaoData.afirmacoes = [{
      texto: req.body.afirmacao,
      destaque: true
    }];
    
    // Remover o campo singular para evitar duplicidade
    delete manifestacaoData.afirmacao;
  }
  
  // Adicionar imagem se enviada
  if (req.files && req.files.imagem) {
    try {
      const imagemFile = req.files.imagem;
      const bucketName = process.env.MINIO_BUCKET_NAME;
      
      // Verificar se o bucket existe
      const bucketExists = await minioClient.bucketExists(bucketName);
      console.log(`Bucket ${bucketName} existe? ${bucketExists}`);
      
      if (!bucketExists) {
        console.log(`Criando bucket ${bucketName}...`);
        await minioClient.makeBucket(bucketName);
      }
      
      // Obter a extensão do arquivo original
      const fileExt = path.extname(imagemFile.name) || '.jpg';
      const objectName = `manifestacoes/${req.user.id}/${Date.now()}-${uuidv4()}${fileExt}`;
      
      // Definir metadados para o arquivo
      const metaData = {
        'Content-Type': imagemFile.mimetype,
        'X-Amz-Meta-Original-Filename': imagemFile.name
      };
      
      console.log(`Iniciando upload de imagem para MinIO bucket=${bucketName}, file=${objectName}`);
      
      if (imagemFile.tempFilePath) {
        console.log('Usando arquivo temporário para upload de imagem:', imagemFile.tempFilePath);
        
        // Upload do arquivo para o MinIO usando o arquivo temporário
        await minioClient.fPutObject(
          bucketName, 
          objectName, 
          imagemFile.tempFilePath,
          metaData
        );
      } else if (imagemFile.data) {
        console.log('Usando dados em memória para upload de imagem');
        
        // Salvar temporariamente os dados em um arquivo
        const tempPath = `/tmp/upload-manifestacao-${Date.now()}.tmp`;
        fs.writeFileSync(tempPath, imagemFile.data);
        
        // Upload do arquivo temporário
        await minioClient.fPutObject(
          bucketName, 
          objectName, 
          tempPath,
          metaData
        );
        
        // Remover o arquivo temporário
        fs.unlinkSync(tempPath);
      }
      
      console.log('Arquivo de imagem salvo com sucesso');

      // Gerar URL via proxy interno para a imagem
      const imageUrl = `/api/proxy/minio/${objectName}`;
      
      // Adicionar informações da imagem ao documento
      manifestacaoData.imagens = [{
        path: imageUrl,
        objectName: objectName,
        descricao: req.body.descricao || ''
      }];
      
      console.log(`Imagem enviada com sucesso para ${imageUrl}`);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      // Não interromper a criação da manifestação se o upload falhar
      manifestacaoData.imagens = [];
    }
  }
  
  // Criar item de manifestação
  const manifestacao = await Manifestacao.create(manifestacaoData);
  
  res.status(201).json({
    success: true,
    data: manifestacao
  });
});

// @desc    Obter todos os itens de manifestação do usuário
// @route   GET /api/manifestacao
// @access  Private
exports.getManifestacoes = asyncHandler(async (req, res, next) => {
  const { tipo } = req.query;
  
  // Filtro base: itens do usuário atual
  const filter = { user: req.user.id };
  
  // Filtrar por tipo, se fornecido
  if (tipo && ['quadro', 'checklist', 'simbolo'].includes(tipo)) {
    filter.tipo = tipo;
  }
  
  // Buscar itens
  const manifestacoes = await Manifestacao.find(filter).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: manifestacoes.length,
    data: manifestacoes
  });
});

// @desc    Obter um item de manifestação específico
// @route   GET /api/manifestacao/:id
// @access  Private
exports.getManifestacao = asyncHandler(async (req, res, next) => {
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a acessar este item', 401)
    );
  }
  
  res.status(200).json({
    success: true,
    data: manifestacao
  });
});

// @desc    Atualizar item de manifestação
// @route   PUT /api/manifestacao/:id
// @access  Private
exports.updateManifestacao = asyncHandler(async (req, res, next) => {
  // Log para debug
  console.log('Corpo da requisição de atualização:', req.body);
  
  let manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a atualizar este item', 401)
    );
  }
  
  // Validar campos obrigatórios
  if (!req.body.titulo) {
    return next(new ErrorResponse('Por favor, adicione um título', 400));
  }
  
  if (!req.body.tipo || !['quadro', 'checklist', 'simbolo'].includes(req.body.tipo)) {
    return next(new ErrorResponse('Tipo de manifestação inválido', 400));
  }
  
  // Atualizar a data de atualização
  req.body.updatedAt = Date.now();
  
  // Processar a afirmação positiva (se fornecida)
  if (req.body.afirmacao) {
    // Converter o campo 'afirmacao' em um array 'afirmacoes'
    req.body.afirmacoes = [{
      texto: req.body.afirmacao,
      destaque: true
    }];
    
    // Remover o campo singular para evitar duplicidade
    delete req.body.afirmacao;
  }
  
  // Atualizar item
  manifestacao = await Manifestacao.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: manifestacao
  });
});

// @desc    Excluir item de manifestação
// @route   DELETE /api/manifestacao/:id
// @access  Private
exports.deleteManifestacao = asyncHandler(async (req, res, next) => {
  console.log('Tentando excluir manifestação com ID:', req.params.id);
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a excluir este item', 401)
    );
  }
  
  // Se for um quadro, remover imagens relacionadas do MinIO
  if (manifestacao.tipo === 'quadro' && manifestacao.imagens && manifestacao.imagens.length > 0) {
    try {
      for (const imagem of manifestacao.imagens) {
        if (imagem.objectName) {
          // Usar objectName para remover objetos do MinIO
          await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, imagem.objectName);
          console.log(`Imagem ${imagem.objectName} removida do MinIO`);
        } else if (imagem.path && !imagem.path.startsWith('http')) {
          // Compatibilidade com registros antigos que não têm objectName
          await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, imagem.path);
          console.log(`Imagem ${imagem.path} removida do MinIO (caminho antigo)`);
        }
      }
    } catch (error) {
      console.error('Erro ao remover imagens do MinIO:', error);
      // Continuar mesmo com erro para remover o registro do banco
    }
  }
  
  // Se for um símbolo pessoal, remover a imagem do MinIO
  if (manifestacao.tipo === 'simbolo' && manifestacao.simboloPath) {
    try {
      if (manifestacao.symbolObjectName) {
        // Usar symbolObjectName para remover objeto do MinIO
        await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, manifestacao.symbolObjectName);
        console.log(`Símbolo ${manifestacao.symbolObjectName} removido do MinIO`);
      } else if (manifestacao.simboloPath && !manifestacao.simboloPath.startsWith('http')) {
        // Compatibilidade com registros antigos que não têm symbolObjectName
        await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, manifestacao.simboloPath);
        console.log(`Símbolo ${manifestacao.simboloPath} removido do MinIO (caminho antigo)`);
      }
    } catch (error) {
      console.error('Erro ao remover símbolo do MinIO:', error);
      // Continuar mesmo com erro para remover o registro do banco
    }
  }
  
  // Excluir item
  await manifestacao.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Adicionar imagem ao quadro de visualização
// @route   POST /api/manifestacao/:id/imagem
// @access  Private
exports.addImage = asyncHandler(async (req, res, next) => {
  // Esta função será implementada pelo middleware multer no arquivo de rotas
  // Ver rota correspondente em routes/manifestacao.js
});

// @desc    Remover imagem do quadro de visualização
// @route   DELETE /api/manifestacao/:id/imagem/:imagemId
// @access  Private
exports.removeImage = asyncHandler(async (req, res, next) => {
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a modificar este item', 401)
    );
  }
  
  // Verificar se é um quadro de visualização
  if (manifestacao.tipo !== 'quadro') {
    return next(
      new ErrorResponse('Este item não é um quadro de visualização', 400)
    );
  }
  
  // Encontrar a imagem pelo ID
  const imagemIndex = manifestacao.imagens.findIndex(
    img => img._id.toString() === req.params.imagemId
  );
  
  if (imagemIndex === -1) {
    return next(
      new ErrorResponse(`Imagem não encontrada com id ${req.params.imagemId}`, 404)
    );
  }
  
  // Remover imagem do MinIO
  try {
    const imagemPath = manifestacao.imagens[imagemIndex].path;
    if (imagemPath) {
      await minioClient.removeObject(process.env.MINIO_BUCKET_NAME, imagemPath);
    }
  } catch (error) {
    console.error('Erro ao remover imagem do MinIO:', error);
    return next(
      new ErrorResponse('Erro ao remover imagem do armazenamento', 500)
    );
  }
  
  // Remover imagem do array
  manifestacao.imagens.splice(imagemIndex, 1);
  manifestacao.updatedAt = Date.now();
  
  await manifestacao.save();
  
  res.status(200).json({
    success: true,
    data: manifestacao
  });
});

// @desc    Adicionar afirmação ao quadro de visualização
// @route   POST /api/manifestacao/:id/afirmacao
// @access  Private
exports.addAfirmacao = asyncHandler(async (req, res, next) => {
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a modificar este item', 401)
    );
  }
  
  // Verificar se é um quadro de visualização
  if (manifestacao.tipo !== 'quadro') {
    return next(
      new ErrorResponse('Este item não é um quadro de visualização', 400)
    );
  }
  
  // Verificar se o corpo da requisição contém o texto da afirmação
  if (!req.body.texto) {
    return next(
      new ErrorResponse('O texto da afirmação é obrigatório', 400)
    );
  }
  
  // Adicionar afirmação
  manifestacao.afirmacoes.push({
    texto: req.body.texto,
    destaque: req.body.destaque || false
  });
  
  manifestacao.updatedAt = Date.now();
  
  await manifestacao.save();
  
  res.status(200).json({
    success: true,
    data: manifestacao
  });
});

// @desc    Remover afirmação do quadro de visualização
// @route   DELETE /api/manifestacao/:id/afirmacao/:afirmacaoId
// @access  Private
exports.removeAfirmacao = asyncHandler(async (req, res, next) => {
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a modificar este item', 401)
    );
  }
  
  // Verificar se é um quadro de visualização
  if (manifestacao.tipo !== 'quadro') {
    return next(
      new ErrorResponse('Este item não é um quadro de visualização', 400)
    );
  }
  
  // Encontrar a afirmação pelo ID
  const afirmacaoIndex = manifestacao.afirmacoes.findIndex(
    af => af._id.toString() === req.params.afirmacaoId
  );
  
  if (afirmacaoIndex === -1) {
    return next(
      new ErrorResponse(`Afirmação não encontrada com id ${req.params.afirmacaoId}`, 404)
    );
  }
  
  // Remover afirmação do array
  manifestacao.afirmacoes.splice(afirmacaoIndex, 1);
  manifestacao.updatedAt = Date.now();
  
  await manifestacao.save();
  
  res.status(200).json({
    success: true,
    data: manifestacao
  });
});

// @desc    Adicionar passo ao checklist de manifestação
// @route   POST /api/manifestacao/:id/passo
// @access  Private
exports.addPasso = asyncHandler(async (req, res, next) => {
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a modificar este item', 401)
    );
  }
  
  // Verificar se é um checklist
  if (manifestacao.tipo !== 'checklist') {
    return next(
      new ErrorResponse('Este item não é um checklist de manifestação', 400)
    );
  }
  
  // Verificar se o corpo da requisição contém a descrição do passo
  if (!req.body.descricao) {
    return next(
      new ErrorResponse('A descrição do passo é obrigatória', 400)
    );
  }
  
  // Adicionar passo
  manifestacao.passos.push({
    descricao: req.body.descricao,
    concluido: false,
    dataLimite: req.body.dataLimite || null
  });
  
  manifestacao.updatedAt = Date.now();
  
  await manifestacao.save();
  
  res.status(200).json({
    success: true,
    data: manifestacao
  });
});

// @desc    Atualizar passo do checklist
// @route   PUT /api/manifestacao/:id/passo/:passoId
// @access  Private
exports.updatePasso = asyncHandler(async (req, res, next) => {
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a modificar este item', 401)
    );
  }
  
  // Verificar se é um checklist
  if (manifestacao.tipo !== 'checklist') {
    return next(
      new ErrorResponse('Este item não é um checklist de manifestação', 400)
    );
  }
  
  // Encontrar o passo pelo ID
  const passoIndex = manifestacao.passos.findIndex(
    p => p._id.toString() === req.params.passoId
  );
  
  if (passoIndex === -1) {
    return next(
      new ErrorResponse(`Passo não encontrado com id ${req.params.passoId}`, 404)
    );
  }
  
  // Atualizar passo
  if (req.body.descricao !== undefined) {
    manifestacao.passos[passoIndex].descricao = req.body.descricao;
  }
  
  if (req.body.concluido !== undefined) {
    manifestacao.passos[passoIndex].concluido = req.body.concluido;
  }
  
  if (req.body.dataLimite !== undefined) {
    manifestacao.passos[passoIndex].dataLimite = req.body.dataLimite;
  }
  
  manifestacao.updatedAt = Date.now();
  
  await manifestacao.save();
  
  res.status(200).json({
    success: true,
    data: manifestacao
  });
});

// @desc    Remover passo do checklist
// @route   DELETE /api/manifestacao/:id/passo/:passoId
// @access  Private
exports.removePasso = asyncHandler(async (req, res, next) => {
  const manifestacao = await Manifestacao.findById(req.params.id);
  
  if (!manifestacao) {
    return next(
      new ErrorResponse(`Item não encontrado com id ${req.params.id}`, 404)
    );
  }
  
  // Verificar se o item pertence ao usuário
  if (manifestacao.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse('Não autorizado a modificar este item', 401)
    );
  }
  
  // Verificar se é um checklist
  if (manifestacao.tipo !== 'checklist') {
    return next(
      new ErrorResponse('Este item não é um checklist de manifestação', 400)
    );
  }
  
  // Encontrar o passo pelo ID
  const passoIndex = manifestacao.passos.findIndex(
    p => p._id.toString() === req.params.passoId
  );
  
  if (passoIndex === -1) {
    return next(
      new ErrorResponse(`Passo não encontrado com id ${req.params.passoId}`, 404)
    );
  }
  
  // Remover passo do array
  manifestacao.passos.splice(passoIndex, 1);
  manifestacao.updatedAt = Date.now();
  
  await manifestacao.save();
  
  res.status(200).json({
    success: true,
    data: manifestacao
  });
});
