const fetch = require('node-fetch');
const yts = require('yt-search');

const handler = async (ms, { sylph, text, command, prefix }) => {
  if (!text) {
    return ms.reply(
      `> ര 🎧 Ejemplo : ${prefix + command} nombre de la cancion`
    );
  }

  try {
    // Reacción de búsqueda
    await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

    const searchResult = await yts(text);

    const videos = searchResult.videos;
    if (!videos.length) {
      // Reacción de error (no se encontró)
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      return ms.reply(
        `> *_ര 🌴 No se encontró ningún video_*`
      );
    }

    // Reacción de encontrado
    await sylph.sendMessage(ms.from, { react: { text: "🎵", key: ms.key } });

    const video = videos[0];
    const { title, author, duration, thumbnail, url } = video;
    const channel = author?.name || 'Desconocido';
    const durStr = duration?.timestamp || 'Desconocido';

    const info = `> 𓂂𓏸 𐅹੭੭ *\`Y O U T U B E - I N F O\`* 🌿

> ര ✐ Título   : ${title}
> ര ✦ Canal    : ${channel}
> ര ✧ Duración : ${durStr}
> ര ❀ Enlace   : ${url}

> *_Iniciando Descargas Un Momento_*`;

    try {
      const thumb = await (await fetch(thumbnail)).arrayBuffer();
      await sylph.sendMessage(
        ms.from,
        { 
          image: Buffer.from(thumb), 
          caption: info 
        },
        { quoted: ms }
      );
    } catch {
      await sylph.sendMessage(
        ms.from,
        { text: info },
        { quoted: ms }
      );
    }

    if (command === 'play') {
      // Reacción de procesando audio
      await sylph.sendMessage(ms.from, { react: { text: "🔄", key: ms.key } });

      let audioUrl = null;

      const audioAPIs = [
        {
          url: `https://api.vreden.my.id/api/v1/download/youtube/audio?url=${url}&quality=128`
        },
        {
          url: `https://fgsi.dpdns.org/api/downloader/youtube/v2?apikey=fgsiapi-335898e9-6d&url=${url}&type=mp3`
        },
        {
          url: `https://api-adonix.ultraplus.click/download/ytaudio?url=${encodeURIComponent(url)}`
        }
      ];

      for (const api of audioAPIs) {
        try {
          const res = await fetch(api.url);
          const json = await res.json();

          if (json?.result?.download?.url) {
            audioUrl = json.result.download.url;
            break;
          } else if (json?.data?.url) {
            audioUrl = json.data.url;
            break;
          } else if (json?.result?.downloadUrl) {
            audioUrl = json.result.downloadUrl;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!audioUrl) {
        // Reacción de error (no se pudo obtener audio)
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(
          `*_ര 🌿 No se pudo obtener el audio de ninguna fuente_*`
        );
      }

      try {
        await sylph.sendMessage(
          ms.from,
          {
            audio: { url: audioUrl },
            fileName: `${title}.mp3`,
            mimetype: 'audio/mpeg',
            ptt: false
          },
          { quoted: ms }
        );

        // Reacción de éxito (audio enviado)
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      } catch {
        // Reacción de error (envío falló)
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        ms.reply(
          `*_ര 🌿 Error al enviar el audio_*`
        );
      }
    }

    if (command === 'play2') {
      // Reacción de procesando video
      await sylph.sendMessage(ms.from, { react: { text: "🔄", key: ms.key } });

      let videoUrl = null;

      const videoAPIs = [
        {
          url: `https://api.vreden.my.id/api/v1/download/youtube/video?url=${url}&quality=360`
        },
        {
          url: `https://fgsi.dpdns.org/api/downloader/youtube/v2?apikey=fgsiapi-335898e9-6d&url=${url}&type=mp4`
        },
        {
          url: `https://api-adonix.ultraplus.click/download/ytvideo?url=${encodeURIComponent(url)}`
        }
      ];

      for (const api of videoAPIs) {
        try {
          const res = await fetch(api.url);
          const json = await res.json();

          if (json?.result?.download?.url) {
            videoUrl = json.result.download.url;
            break;
          } else if (json?.data?.url) {
            videoUrl = json.data.url;
            break;
          } else if (json?.result?.downloadUrl) {
            videoUrl = json.result.downloadUrl;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!videoUrl) {
        // Reacción de error (no se pudo obtener video)
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(
          `*_ര 🌿 No se pudo obtener el video de ninguna fuente_*`
        );
      }

      try {
        await sylph.sendMessage(
          ms.from,
          {
            video: { url: videoUrl },
            fileName: `${title}.mp4`,
            mimetype: 'video/mp4',
            caption: `> 𓂂𓏸 𐅹੭੭ *\`V I D E O  L I S T O\`* 🌿

ര ✰ ${title}
ര ✦ ${channel}
ര ✧ ${durStr}
ര ❀ Calidad: 360p`
          },
          { quoted: ms }
        );

        // Reacción de éxito (video enviado)
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      } catch {
        // Reacción de error (envío falló)
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        ms.reply(
          `*_ര 🌿 Error al enviar el video_*`
        );
      }
    }

  } catch (error) {
    // Reacción de error general
    await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
    ms.reply(
      `> ര 🌿 Error: ${error.message}`
    );
  }
};

module.exports = {
  command: ['play', 'play2'],
  help: ['play', 'play2'],
  description: 'Descarga audio o video de YouTube.',
  run: handler
};