// Wrapper para tratamento assíncrono de erros
// Elimina a necessidade de usar try-catch em cada controller
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
