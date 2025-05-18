const express = require('express');
const {
  getContents,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getFeaturedContents,
  searchContents
} = require('../controllers/content');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Content = require('../models/Content');

// Rotas públicas
router.get('/', advancedResults(Content, 'user'), getContents);
router.get('/featured', getFeaturedContents);
router.get('/search', searchContents);
router.get('/:id', getContent);

// Rotas protegidas para admins
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .post(createContent);

router.route('/:id')
  .put(updateContent)
  .delete(deleteContent);

module.exports = router;
