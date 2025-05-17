// Script para criar um usuário admin
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definir o Schema do usuário diretamente no script para evitar problemas de carregamento
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, adicione um nome'],
    trim: true,
    maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Por favor, adicione um email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, adicione um email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor, adicione uma senha'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pendente', 'aprovada', 'desativada'],
    default: 'pendente'
  },
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  },
  bio: {
    type: String,
    maxlength: [500, 'Descrição pessoal não pode ter mais de 500 caracteres']
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Conectar diretamente ao MongoDB
mongoose.connect('mongodb://admin:Marcus1911Marcus@206.183.131.10:27017/luziav7?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB conectado com sucesso!');
  createAdmin();
}).catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

// Definir o modelo User
const User = mongoose.model('User', UserSchema);

// Dados do administrador
const adminData = {
  name: 'Administrador',
  email: 'admin@mentemerecedora.com',
  password: 'admin123',
  role: 'admin',
  status: 'aprovada',
  bio: 'Administrador do Portal Mente Merecedora'
};

const createAdmin = async () => {
  try {
    // Verificar se já existe um admin com este email
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Um administrador com este email já existe!');
      process.exit(0);
    }
    
    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    
    // Substituir a senha em texto plano pela senha criptografada
    adminData.password = hashedPassword;
    
    // Criar o usuário administrador
    const admin = await User.create(adminData);
    
    console.log('Administrador criado com sucesso!');
    console.log('Email:', adminData.email);
    console.log('Senha:', 'admin123');
    console.log('IMPORTANTE: Altere esta senha após o primeiro login por questões de segurança.');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    process.exit(1);
  }
};

createAdmin();
