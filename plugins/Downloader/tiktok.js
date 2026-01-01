const { getDownloadLink } = require('../../scrapers/Tiktokdl.js');

module.exports = {
  command: ['ttdl', 'tt'],
  help: ['ttdl'],
  description: 'Descarga videos de TikTok.',
  run: async (ms, { sylph, args, command, prefix }) => {
    if (!args[0]) {
      return ms.reply(`❀ *Ingrese el enlace de un video de TikTok.*\n\n*Ejemplo:*\n${prefix + command} https://www.tiktok.com/@jasonmoments/video/7560870151021694230`);
    }

    // Enviar reacción de búsqueda
    await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

    try {
        const links = await getDownloadLink(args[0]);
        if (links.length === 0) {
          await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
          throw new Error('❀ No se encontraron enlaces de descarga.');
        }

        // Enviar el primer enlace encontrado (normalmente el video)
        await sylph.sendMessage(ms.from, { 
          video: { url: links[0] }, 
          caption: '*Aquí tienes tu video de TikTok*' 
        }, { quoted: ms });

        // Enviar reacción de éxito
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });

    } catch (e) {
        console.error(e);
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        ms.reply('Ocurrió un error al descargar el video.');
    }
  }
};
