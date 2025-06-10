const fs = require('fs');
const path = require('path');

// Função para criar SVG da imagem padrão
function createDefaultPraticaSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg-gradient)"/>
  
  <!-- Icon circle -->
  <circle cx="150" cy="100" r="35" fill="#1B5E20" opacity="0.1"/>
  
  <!-- Music icon -->
  <text x="150" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#1B5E20" opacity="0.8">♪</text>
  
  <!-- Text -->
  <text x="150" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#666" opacity="0.7">Prática Guiada</text>
  
  <!-- Border -->
  <rect x="0" y="0" width="300" height="200" fill="none" stroke="#1B5E20" stroke-width="2" opacity="0.2"/>
</svg>`;
  
  return svg;
}

// Criar e salvar o SVG
try {
  const svgContent = createDefaultPraticaSVG();
  
  // Salvar como SVG no servidor
  const svgPath = path.join(__dirname, '../public/images/pratica-default.svg');
  const dir = path.dirname(svgPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('✅ SVG padrão criado com sucesso:', svgPath);
  
  // Salvar no cliente  
  const clientSvgPath = path.join(__dirname, '../../client/public/static/images/pratica-default.svg');
  const clientDir = path.dirname(clientSvgPath);
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  fs.writeFileSync(clientSvgPath, svgContent, 'utf8');
  console.log('✅ SVG padrão copiado para cliente:', clientSvgPath);
  
  // Manter a extensão .jpg mas com conteúdo SVG para compatibilidade
  const jpgPath = path.join(__dirname, '../public/images/pratica-default.jpg');
  fs.writeFileSync(jpgPath, svgContent, 'utf8');
  
  const clientJpgPath = path.join(__dirname, '../../client/public/static/images/pratica-default.jpg');
  fs.writeFileSync(clientJpgPath, svgContent, 'utf8');
  console.log('✅ Arquivos .jpg criados com conteúdo SVG para compatibilidade');
  
} catch (error) {
  console.error('❌ Erro ao criar imagem padrão:', error);
} 