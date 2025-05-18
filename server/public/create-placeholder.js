// Script simples para criar uma imagem de placeholder PNG
const fs = require('fs');
const path = require('path');

// Dados de uma pequena imagem PNG (1x1 pixel transparente)
const transparentPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const imageBuffer = Buffer.from(transparentPixelBase64, 'base64');

// Caminho para a imagem de placeholder
const placeholderPath = path.join(__dirname, 'placeholder.png');

// Escrever o buffer para o arquivo
fs.writeFileSync(placeholderPath, imageBuffer);

console.log(`Imagem de placeholder criada em: ${placeholderPath}`);
