const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [100, 'O título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor, adicione uma descrição'],
    maxlength: [1000, 'A descrição não pode ter mais de 1000 caracteres']
  },
  type: {
    type: String,
    required: [true, 'Por favor, especifique o tipo de conteúdo'],
    enum: ['article', 'video', 'ebook', 'gallery']
  },
  category: {
    type: String,
    required: [true, 'Por favor, especifique a categoria'],
    enum: ['manifestacao', 'praticas', 'diario', 'desenvolvimento']
  },
  imageUrl: {
    type: String,
    required: [true, 'Por favor, adicione uma imagem']
  },
  contentUrl: {
    type: String,
    default: ''
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Atualizar o timestamp de updatedAt antes de salvar
ContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para pesquisas eficientes
ContentSchema.index({ title: 'text', description: 'text', tags: 'text' });
ContentSchema.index({ category: 1, type: 1, featured: 1, status: 1 });

module.exports = mongoose.model('Content', ContentSchema);
