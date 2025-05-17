const mongoose = require('mongoose');

const RegistroPraticaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pratica: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pratica',
    required: true
  },
  tipoEvento: {
    type: String,
    enum: ['inicio', 'conclusao'],
    required: true
  },
  duracao: {
    type: Number,  // Duração em segundos
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice para buscar registros por usuário e data
RegistroPraticaSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('RegistroPratica', RegistroPraticaSchema);
