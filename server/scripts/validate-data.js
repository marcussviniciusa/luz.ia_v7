require('dotenv').config();
const mongoose = require('mongoose');
const RegistroPratica = require('../models/RegistroPratica');
const Pratica = require('../models/Pratica');

async function validateData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB');

    // Buscar registros de prática órfãos
    const registrosOrfaos = await RegistroPratica.find({})
      .populate('pratica')
      .lean();

    const orfaos = registrosOrfaos.filter(reg => !reg.pratica);
    
    console.log(`\n📊 RELATÓRIO DE VALIDAÇÃO DE DADOS`);
    console.log(`Total de registros de práticas: ${registrosOrfaos.length}`);
    console.log(`Registros órfãos (sem prática): ${orfaos.length}`);
    
    if (orfaos.length > 0) {
      console.log(`\n⚠️  REGISTROS ÓRFÃOS ENCONTRADOS:`);
      orfaos.forEach((registro, index) => {
        console.log(`${index + 1}. ID: ${registro._id}, User: ${registro.user}, Data: ${registro.createdAt}`);
      });
      
      console.log(`\n🔧 OPÇÕES DE CORREÇÃO:`);
      console.log(`1. Deletar registros órfãos: node scripts/validate-data.js --delete-orphans`);
      console.log(`2. Criar práticas padrão para órfãos: node scripts/validate-data.js --create-default`);
    } else {
      console.log(`✅ Nenhum registro órfão encontrado!`);
    }

    // Verificar se foi solicitada correção
    const args = process.argv.slice(2);
    
    if (args.includes('--delete-orphans') && orfaos.length > 0) {
      console.log(`\n🗑️  Deletando ${orfaos.length} registros órfãos...`);
      const orfaoIds = orfaos.map(o => o._id);
      await RegistroPratica.deleteMany({ _id: { $in: orfaoIds } });
      console.log(`✅ Registros órfãos deletados com sucesso!`);
    }
    
    if (args.includes('--create-default') && orfaos.length > 0) {
      console.log(`\n🔧 Criando prática padrão...`);
      
      // Criar uma prática padrão se não existir
      let praticaPadrao = await Pratica.findOne({ titulo: 'Prática Não Identificada' });
      
      if (!praticaPadrao) {
        praticaPadrao = await Pratica.create({
          titulo: 'Prática Não Identificada',
          descricao: 'Prática criada automaticamente para corrigir dados órfãos',
          categoria: 'geral',
          duracao: 10
        });
      }
      
      // Atualizar registros órfãos
      const orfaoIds = orfaos.map(o => o._id);
      await RegistroPratica.updateMany(
        { _id: { $in: orfaoIds } },
        { pratica: praticaPadrao._id }
      );
      
      console.log(`✅ ${orfaos.length} registros órfãos vinculados à prática padrão!`);
    }

  } catch (error) {
    console.error('Erro na validação:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nValidação concluída. Conexão fechada.');
  }
}

validateData(); 