const mongoose = require('mongoose');

const ManifestacaoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: ['quadro', 'checklist', 'simbolo'],
    required: true
  },
  titulo: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  // Campos específicos para quadro de visualização
  imagens: [{
    path: String,
    descricao: String
  }],
  afirmacoes: [{
    texto: String,
    destaque: {
      type: Boolean,
      default: false
    }
  }],
  // Campos específicos para checklist de manifestação
  objetivo: {
    type: String,
    trim: true
  },
  emocoes: [{
    type: String,
    trim: true
  }],
  passos: [{
    descricao: String,
    concluido: {
      type: Boolean,
      default: false
    },
    dataLimite: Date
  }],
  // Campo específico para símbolo pessoal
  simboloPath: {
    type: String
  },
  dataManifestacao: {
    type: Date
  },
  concluido: {
    type: Boolean,
    default: false
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

module.exports = mongoose.model('Manifestacao', ManifestacaoSchema);
