const axios = require('axios');

module.exports = {
  command: ['spotify', 'spoti', 'spotifydl'],
  help: ["spotify"],
  description: 'Buscar y descargar música de Spotify con la interfaz original de Itsuki.',
  run: async (ms, { text, sylph, prefix }) => {
    if (!text) return ms.reply('*✐ Ingresa el nombre de una canción o el enlace de Spotify.*');

    const chatId = ms.from;
    await sylph.sendMessage(chatId, { react: { text: "🕔", key: ms.key } });

    try {
      const apiUrl = `https://api-adonix.ultraplus.click/download/spotify`;
      
      const response = await axios({
        method: 'GET',
        url: apiUrl,
        params: {
          q: text,
          apikey: 'AdonixKeyd36c043200'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      const responseText = response.request?.res?.responseText || JSON.stringify(response.data);
      let songData = {};
      let downloadUrl = null;
      
      try {
        const parsedData = JSON.parse(responseText);
        if (parsedData.status === true && parsedData.song) {
          songData = parsedData.song;
          downloadUrl = songData.downloadUrl;
        }
      } catch (e) {}

      if (!downloadUrl) {
        const dlMatch = responseText.match(/"downloadUrl"\s*:\s*"([^"]+)"/);
        if (dlMatch) downloadUrl = dlMatch[1];
        const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/);
        if (titleMatch) songData.title = titleMatch[1];
        const artistMatch = responseText.match(/"artist"\s*:\s*"([^"]+)"/);
        if (artistMatch) songData.artist = artistMatch[1];
        const thumbMatch = responseText.match(/"thumbnail"\s*:\s*"([^"]+)"/);
        if (thumbMatch) songData.thumbnail = thumbMatch[1];
        const spotMatch = responseText.match(/"spotifyUrl"\s*:\s*"([^"]+)"/);
        if (spotMatch) songData.spotifyUrl = spotMatch[1];
        const durMatch = responseText.match(/"duration"\s*:\s*"([^"]+)"/);
        if (durMatch) songData.duration = durMatch[1];
      }

      if (!downloadUrl) throw new Error('No se pudo extraer el enlace de descarga.');

      const cap = `> 𓂂𓏸 𐅹੭੭ \`S P O T I F Y  •  P L A Y\` 🌿

> ര *✐ Título        : ${songData.title || text}*
> ര *✦ Artista       : ${songData.artist || 'Desconocido'}*
> ര *✧ Álbum         : ${songData.album || 'Single'}*
> ര *❏ Lanzamiento   : ${songData.release_date || 'No disponible'}*
> ര *✎ Popularidad   : ${songData.popularity || '85'}/100*
> ര *❍ Duración      : ${songData.duration || 'No disponible'}*
> ര *ꕥ ISRC          : ${songData.isrc || "No disponible"}*
> ര *ꕤ Spotify URL   : ${songData.spotifyUrl || 'No disponible'}*

> *_↻ El audio será enviado en breve..._*`;

      if (songData.thumbnail) {
        await sylph.sendMessage(chatId, {
          image: { url: songData.thumbnail },
          caption: cap
        }, { quoted: ms });
      } else {
        await ms.reply(cap);
      }

      await sylph.sendMessage(chatId, {
        audio: { url: downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${songData.title || 'audio'}.mp3`
      }, { quoted: ms });

      await sylph.sendMessage(chatId, { react: { text: "✅", key: ms.key } });

    } catch (err) {
      await sylph.sendMessage(chatId, { react: { text: "❌", key: ms.key } });
      ms.reply('No se pudo procesar la canción.\n\n' + err.message);
    }
  }
};
