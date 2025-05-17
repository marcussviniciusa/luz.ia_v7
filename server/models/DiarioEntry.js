const mongoose = require('mongoose');

const DiarioEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  estadoEmocional: {
    type: String,
    required: [true, 'Por favor, descreva seu estado emocional'],
    trim: true
  },
  pensamentosPredominantes: {
    type: String,
    required: [true, 'Por favor, compartilhe seus pensamentos predominantes'],
    trim: true
  },
  pequenasVitorias: {
    type: String,
    required: [true, 'Por favor, registre suas pequenas vitórias'],
    trim: true
  },
  objetivosProximoDia: {
    type: String,
    required: [true, 'Por favor, defina seus objetivos para o próximo dia'],
    trim: true
  },
  gratidao: {
    type: String,
    trim: true
  },
  insights: {
    type: String,
    trim: true
  },
  avaliacaoEmocional: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice para buscar entradas por usuário e data
DiarioEntrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DiarioEntry', DiarioEntrySchema);
