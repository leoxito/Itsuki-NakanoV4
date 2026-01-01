const fs = require('fs');
const path = require('path');
const config = require('../../config');

module.exports = {
  command: 'public',
  help: ["public"],
  description: 'Cambiar el bot al modo público.',
  run: async (ms, { sylph, isOwner, isBot }) => {
    if (!isOwner && !isBot) {
      return ms.reply('*✐ Este comando es solo para el propietario leo.xyz*');
    }

    config.isPublic = true;
    const configPath = path.join(__dirname, '../../config.js');
    const fileContent = `module.exports = ${JSON.stringify(config, null, 4)};\n`;
    
    fs.writeFileSync(configPath, fileContent);

    await ms.reply('> ❀ El modo del bot se ha cambiado a *Público*.');
  }
};