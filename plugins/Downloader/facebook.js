const fetch = require("node-fetch");

module.exports = {
  command: ['facebook', 'fb'],
  help: ["facebook"],
  description: 'Descarga videos de Facebook.',
  run: async (ms, { args, command, prefix, sylph }) => {
    try {
      if (!args[0]) {
        return ms.reply(`> *✦ Ejemplo de uso:*\n${prefix + command} https://www.facebook.com/share/v/1FwfwCUQEv/`);
      }

      if (!/(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)/i.test(args[0])) {
        return ms.reply("*✰ Enlace inválido. Asegúrate de que sea un enlace de Facebook válido.*");
      }

      // Enviar reacción de búsqueda
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

      const api = `https://api.nekolabs.web.id/downloader/facebook?url=${encodeURIComponent(args[0])}`;
      const res = await fetch(api);
      const json = await res.json();

      const fb = json?.result?.medias?.[0]?.url;
      if (!fb) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply("> *✧ No se pudo obtener el video. Verifica que el enlace sea público.*");
      }

      const cap = `✿ \`Calidad :\` HD`;

      await sylph.sendMessage(ms.from, {
        video: { url: fb },
        mimetype: 'video/mp4',
        caption: cap
      }, { quoted: ms });

      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });

    } catch (e) {
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await ms.reply(`*✧Error al descargar el video:*\n${e.message}`);
      console.error(e);
    }
  }
};