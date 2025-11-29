import fetch from 'node-fetch';

const thumbnailUrl = 'https://cdn.russellxz.click/b317cef7.jpg'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return conn.reply(m.chat, 
`> ⓘ USO INCORRECTO

> ❌ Debes ingresar el nombre del video

> 📝 Ejemplos:
> • ${usedPrefix + command} nombre del video
> • ${usedPrefix + command} artista canción`, m)
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

    const searchRes = await fetch(`https://sky-api-ashy.vercel.app/search/youtube?q=${encodeURIComponent(text)}`);
    const searchJson = await searchRes.json();

    if (!searchJson.status || !searchJson.result?.length) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, `> ⓘ SIN RESULTADOS

> ❌ No se encontraron resultados para: ${text}

> 💡 Intenta con otro nombre`, m);
    }

    await conn.sendMessage(m.chat, { react: { text: '🎬', key: m.key } })

    const video = searchJson.result[0];
    const { title, channel, duration, imageUrl, link } = video;

    const info = `> *ⓘ Y O U T U B E - P L A Y S V5*

> *🏷️ ${title}*
> *📺 ${channel}*
> *⏱️ ${duration}*
> *🔗 ${link}*`;

    await conn.sendMessage(m.chat, { 
      image: { url: imageUrl }, 
      caption: info
    }, { quoted: m });

    await conn.sendMessage(m.chat, { react: { text: '📥', key: m.key } })

    let videoUrl = null;
    let apiUsada = '';

    try {
      const res1 = await fetch(`https://api.vreden.my.id/api/v1/download/youtube/video?url=${link}&quality=360`);
      const json1 = await res1.json();
      if (json1.status && json1.result?.download?.url) {
        videoUrl = json1.result.download.url;
        apiUsada = 'Vreden API';
      }
    } catch (e) {
      console.log('API Vreden falló:', e.message);
    }

    if (!videoUrl) {
      try {
        const res2 = await fetch(`https://api.vreden.my.id/api/v1/download/youtube/video?url=${link}&quality=480`);
        const json2 = await res2.json();
        if (json2.status && json2.result?.download?.url) {
          videoUrl = json2.result.download.url;
          apiUsada = 'Vreden API (480p)';
        }
      } catch (e) {
        console.log('API Vreden 480p falló:', e.message);
      }
    }

    if (!videoUrl) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, `> ⓘ ERROR

> ❌ No se pudo obtener el video

> 💡 Intenta con otro video`, m);
    }

    await conn.sendMessage(
      m.chat,
      {
        video: { url: videoUrl },
        fileName: `${title.substring(0, 50)}.mp4`,
        mimetype: 'video/mp4',
        caption: `> *ⓘ Y O U T U B E - P L A Y S V5*

> *🏷️ ${title}*
> *📺 ${channel}*
> *⏱️ ${duration}*
> *🎬 Formato: MP4*
> *📊 Calidad: 360p/480p*
> *🌐 Servidor: ${apiUsada}*`
      },
      { quoted: m }
    );

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('Error en play7:', e);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    conn.reply(m.chat, `> ⓘ ERROR

> ❌ ${e.message}

> 💡 Intenta más tarde`, m);
  }
};

handler.command = ['play7'];
handler.tags = ['downloader']
handler.help = ['play7'];
handler.group = true;

export default handler;