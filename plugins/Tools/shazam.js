const acrcloud = require('acrcloud');

const acr = new acrcloud({
  host: 'identify-ap-southeast-1.acrcloud.com',
  access_key: 'ee1b81b47cf98cd73a0072a761558ab1',
  access_secret: 'ya9OPe8onFAnNkyf9xMTK8qRyMGmsghfuHrIMmUI'
});

module.exports = {
  command: ['whatmusic', 'shazam'],
  help: ["whatmusic"],
  description: 'Identifica música desde un audio o video',
  tags: ['tools'],
  run: async (ms, { sylph }) => {
    const q = ms.quoted || ms;
    if (!q.msg.mimetype) return ms.reply('🌿 Responde a un audio o video para identificar la música.');

    const wait = await sylph.sendMessage(ms.from, { text: '🌾 Espera un momento, identificando la canción . . .' }, { quoted: ms });

    try {
      const buffer = await q.download();
      const results = await identifySong(buffer);

      if (!results.length) {
        await sylph.sendMessage(ms.from, {
          text: '🌱 No se encontraron resultados para esta canción.',
          edit: wait.key
        }, { quoted: ms });
        return;
      }

      let cap = "      乂 \`S H A Z A M\`\n\n";
         for (let result of results) {
            cap += `   ◦  🌴 \`Título :\` ${result.title}\n`;
            cap += `   ◦  🌿 \`Artista :\` ${result.artist}\n`;
            cap += `   ◦  🌱 \`Duración :\` ${result.duration}\n`;
            cap += `   ◦  🌾 \`Fuentes :\` ${result.url.filter(x => x).map(i => `\n${i}`).join("\n")}\n\n`;
         }

      await sylph.sendMessage(ms.from, {
        text: cap.trim(),
        edit: wait.key
      }, { quoted: ms });
    } catch (e) {
      console.error(e);
      await sylph.sendMessage(ms.from, {
        text: 'Ocurrió un error al identificar la música.',
        edit: wait.key
      }, { quoted: ms });
    }
  }
};

async function identifySong(buffer) {
  const data = (await acr.identify(buffer)).metadata;
  if (!data.music) return [];

  return data.music.map(song => ({
    title: song.title,
    artist: song.artists?.[0]?.name || '-',
    duration: toTime(song.duration_ms),
    url: Object.keys(song.external_metadata || {}).map(key => {
      if (key === 'youtube') return 'https://youtu.be/' + song.external_metadata[key].vid;
      if (key === 'deezer') return 'https://www.deezer.com/track/' + song.external_metadata[key].track.id;
      if (key === 'spotify') return 'https://open.spotify.com/track/' + song.external_metadata[key].track.id;
      return '';
    })
  }));
}

function toTime(ms) {
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return [m, s].map(v => v.toString().padStart(2, '0')).join(':');
}