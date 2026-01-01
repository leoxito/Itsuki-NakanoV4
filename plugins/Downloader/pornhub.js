const axios = require("axios");

async function ph(url) {
  try {
    const { data } = await axios.post("https://api-sky.ultraplus.click/phfans", { url }, {
      headers: { apikey: "leo.xyz" }
    });

    if (data.status && data.result) return data.result;
    if (data && (data.title || data.sources || data.videos)) return data;

    throw new Error(data.message || "Respuesta inválida de la API");
  } catch (error) {
    console.error('❌ Error en ph():', error.message);
    if (error.response) console.error('Detalles:', error.response.data);
    throw error;
  }
}

module.exports = {
  command: ['ph'],
  help: ['ph'],
  description: 'Descarga SOLO videos de Pornhub (normal, premium y fans).',
  category: 'descargas',
  run: async (ms, { sylph, args, command, prefix }) => {
    try {
      if (!args[0]) {
        return ms.reply(`❀ *Ingresa un enlace de Pornhub.*\n\n*Ejemplo:*\n${prefix + command} https://es.pornhub.com/view_video.php?viewkey=ph...`);
      }

      const url = args[0].trim();

      if (!url.includes('pornhub.com')) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply('*✰ Enlace inválido. Debe ser de pornhub.com*');
      }

      await sylph.sendMessage(ms.from, { react: { text: "⏳", key: ms.key } });

      const apiResponse = await ph(url);

      let title = 'Sin título';
      if (apiResponse.title) title = apiResponse.title;
      else if (apiResponse.description) title = apiResponse.description.substring(0, 100);

      let videoUrl = null;

      if (apiResponse.sources && Array.isArray(apiResponse.sources)) {
        const highest = apiResponse.sources
          .filter(s => s.quality && s.url && s.url.includes('.mp4'))
          .sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0))[0];
        if (highest) videoUrl = highest.url;
      }
      else if (apiResponse.videos && typeof apiResponse.videos === 'object') {
        const qualities = Object.keys(apiResponse.videos)
          .filter(q => apiResponse.videos[q])
          .map(q => ({ quality: parseInt(q.replace('p', '')) || 0, url: apiResponse.videos[q] }))
          .sort((a, b) => b.quality - a.quality);
        if (qualities.length > 0) videoUrl = qualities[0].url;
      }
      else if (apiResponse.video) {
        videoUrl = apiResponse.video;
      }
      else if (typeof apiResponse === 'object') {
        const findVideo = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'string' && (obj[key].includes('.mp4') || obj[key].includes('.m3u8'))) return obj[key];
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const found = findVideo(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };
        videoUrl = findVideo(apiResponse);
      }

      if (!videoUrl) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(`*❌ No se encontró video descargable.*\n\nEste comando solo envía videos.`);
      }

      const info = `> 𓂂𓏸 𐅹੭੭ *\`P O R N H U B - V I D E O\`* 🔥

> ര ✐ Título : ${title}
> ര ✦ Tipo : 𝗩𝗶𝗱𝗲𝗼 📽️
> ര ✧ Enlace : ${url}

> *_Descarga completada ✅_*`;

      // VERSIÓN QUE FUNCIONA EN TU BAILEYS (antiguo)
      await sylph.sendMessage(ms.from, {
        video: { url: videoUrl },    // ← ¡CON OBJETO! Esto es lo que necesita tu versión
        caption: info,
        mimetype: 'video/mp4',
        gifPlayback: false
      }, { quoted: ms });

      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });

    } catch (error) {
      console.error('💥 ERROR en comando ph:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      return ms.reply(`*❀ Error al descargar el video:*\n${error.message || 'Error desconocido'}`);
    }
  }
};