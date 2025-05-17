const express = require('express');
const {
  createEntry,
  getEntries,
  getEntry,
  getEntryByDate,
  updateEntry,
  deleteEntry,
  getStats
} = require('../controllers/diario');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Proteger todas as rotas
router.use(protect);

// Rotas principais
router.route('/')
  .get(getEntries)
  .post(createEntry);

// Rota para estatísticas
router.get('/stats', getStats);

// Rota para buscar por data
router.get('/data/:date', getEntryByDate);

// Rotas com ID
router.route('/:id')
  .get(getEntry)
  .put(updateEntry)
  .delete(deleteEntry);

module.exports = router;
