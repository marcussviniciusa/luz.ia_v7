/**
 * Middleware para resultados avançados das APIs
 * Inclui recursos de paginação, filtragem, ordenação e seleção de campos
 * 
 * @param {Model} model - Modelo Mongoose para a coleção
 * @param {Array} populate - Array de campos para popular (relacionamentos)
 * @returns {Function} Middleware Express
 */
const advancedResults = (model, populate) => async (req, res, next) => {
  let query;
  const reqQuery = { ...req.query };
  
  // Campos a serem excluídos para operações especiais
  const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'searchFields'];
  
  // Remover campos especiais da query
  removeFields.forEach(param => delete reqQuery[param]);
  
  // Criar string de consulta
  let queryStr = JSON.stringify(reqQuery);
  
  // Criar operadores ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Iniciar a consulta
  query = model.find(JSON.parse(queryStr));
  
  // Implementar busca de texto se especificado
  if (req.query.search) {
    const searchQuery = {};
    const searchFields = req.query.searchFields ? 
                         req.query.searchFields.split(',') : 
                         ['title', 'description'];
    
    // Criar um $or de todos os campos para busca
    searchQuery.$or = searchFields.map(field => ({
      [field]: { $regex: req.query.search, $options: 'i' }
    }));
    
    query = model.find(searchQuery);
  }
  
  // Seleção de campos
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Ordenação
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    // Ordenação padrão por data de criação decrescente
    query = query.sort('-createdAt');
  }
  
  // Paginação
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Aplicar paginação à consulta
  query = query.skip(startIndex).limit(limit);
  
  // População de relacionamentos se especificado
  if (populate) {
    query = Array.isArray(populate) 
            ? populate.reduce((q, p) => q.populate(p), query)
            : query.populate(populate);
  }
  
  // Executar a consulta
  const results = await query;
  
  // Contar total de documentos para metadados de paginação
  const total = await model.countDocuments(JSON.parse(queryStr));
  
  // Metadados de paginação
  const pagination = {};
  
  // Adicionar informações de página anterior/próxima se disponíveis
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  // Adicionar metadados à resposta
  pagination.total = total;
  pagination.totalPages = Math.ceil(total / limit);
  pagination.currentPage = page;
  
  // Anexar os resultados e os metadados ao objeto de resposta para uso futuro
  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };
  
  next();
};

module.exports = advancedResults;
