const fs = require('fs');
const path = require('path');
const config = require('../../config');

module.exports = {
  command: ['self', 'private'],
  help: ["private"],
  description: 'Cambia el bot al modo privado.',
  run: async (ms, { sylph, isOwner, isBot }) => {
    if (!isOwner) {
      return ms.reply('*✐ Este comando es solo para el propietario leo.xyz*');
    }

    config.isPublic = false;
    const configPath = path.join(__dirname, '../../config.js');
    const fileContent = `module.exports = ${JSON.stringify(config, null, 4)};\n`;
    
    fs.writeFileSync(configPath, fileContent);

    await ms.reply('> ❀ El modo del bot ha sido cambiado a *Privado*.');
  }
};