const fetch = require('node-fetch');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  command: ['instagram', 'ig'],
  help: ["instagram"],
  description: 'Descarga videos de Instagram.',
  run: async (ms, { text, args, command, prefix, sylph }) => {
    try {
      if (!args[0]) {
        return ms.reply(`> *✐ Ejemplo de uso*: ${prefix + command} https://www.instagram.com/p/CK0tLXyAzEI`);
      }
      if (!args[0].match(/(https:\/\/www.instagram.com)/gi)) {
        return ms.reply('*✰ Enlace inválido de Instagram.*');
      }
      
      // Enviar reacción de búsqueda
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
      
      const old = Date.now();
      const res = await fetch(`https://api.nekolabs.web.id/downloader/instagram?url=${args[0]}`);
      const json = await res.json();

      if (!json.result || !json.result?.downloadUrl) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(`*❀ No se pudo obtener el contenido*:\n${JSON.stringify(json, null, 2)}`);
      }

      const delayMsg = `> *Aqui Tienes Tu Video De Instagram ✅️*`;
      await ms.sendVideo(delayMsg, json.result.downloadUrl[0]);
      
      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      await delay(1500);
    } catch (e) {
      console.error('🪷 Error en plugin Instagram:', e);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await ms.reply(`*✧ Error*: ${e.message}`);
    }
  }
};