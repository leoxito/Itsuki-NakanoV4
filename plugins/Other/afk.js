const fs = require('fs');
const path = require('path');

module.exports = {
  command: 'afk',
  help: ["afk"],
  group: true,
  description: 'Configuración del estado AFK.',
  run: async (ms, { sylph, args }) => {
    try {
      // Enviar reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
      
      const userJid = ms.sender;
      const reason = args.join(' ') || 'No hay razón';
      const time = Date.now();

      const dbPath = path.join(__dirname, '../../database/afk.json');

      let afkData = {};
      try {
        const fileData = fs.readFileSync(dbPath, 'utf8');
        afkData = JSON.parse(fileData);
      } catch (e) {
        console.log("Crea un nuevo archivo afk.json.");
      }

      afkData[userJid] = { reason, time };

      fs.writeFileSync(dbPath, JSON.stringify(afkData, null, 2));

      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
      const afkMessage = `✅ *Ahora estás AFK*\n\n*Razón :* ${reason}`;
      await ms.reply(afkMessage);
      
    } catch (error) {
      console.error('Error en comando afk:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await ms.reply('Ocurrió un error al configurar tu estado AFK.');
    }
  }
};