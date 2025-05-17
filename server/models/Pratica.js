const mongoose = require('mongoose');

const PraticaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  descricao: {
    type: String,
    required: [true, 'Por favor, adicione uma descrição'],
    trim: true
  },
  categoria: {
    type: String,
    required: [true, 'Por favor, selecione uma categoria'],
    enum: [
      'meditacao',       // Meditações guiadas
      'visualizacao',    // Exercícios de visualização
      'reprogramacao',   // Reprogramação emocional
      'cubo',            // Exercício do Cubo
      'escada',          // Exercício da Escada
      'animais',         // Exercício do Cavalo e Vaca
      'zoomout',         // Técnica de Zoom Out
      'alpha',           // Técnica de estado Alpha
      'outro'            // Outros tipos de prática
    ]
  },
  audioPath: {
    type: String,
    required: [true, 'Por favor, adicione um arquivo de áudio']
  },
  duracao: {
    type: Number,  // Duração em segundos
    required: [true, 'Por favor, especifique a duração']
  },
  imagemCapa: {
    type: String,
    default: 'praticas/default-cover.jpg'
  },
  destaque: {
    type: Boolean,
    default: false
  },
  ordem: {
    type: Number,
    default: 0
  },
  ativa: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pratica', PraticaSchema);
