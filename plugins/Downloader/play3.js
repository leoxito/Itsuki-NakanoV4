const fetch = require('node-fetch');
const yts = require('yt-search');

const play3Handler = async (ms, { text, sylph, prefix }) => {
  if (!text) {
    return ms.reply(`*🎵 Usa: ${prefix}play3 <canción o enlace YouTube>*`);
  }

  const chatId = ms.from;
  
  try {
    // Reacción inicial
    await sylph.sendMessage(chatId, { react: { text: "🔍", key: ms.key } });
    
    let videoUrl = '';
    let videoInfo = null;
    
    // ===== 1. BUSCAR VIDEO =====
    if (text.includes('youtu.be/') || text.includes('youtube.com/watch')) {
      // Es un enlace directo
      videoUrl = text;
      
      // Extraer ID para buscar info
      let videoId = '';
      if (text.includes('youtu.be/')) {
        videoId = text.split('youtu.be/')[1].split('?')[0];
      } else {
        const urlParams = new URLSearchParams(text.split('?')[1]);
        videoId = urlParams.get('v');
      }
      
      // Buscar info con yt-search
      const search = await yts(videoId);
      if (search.videos && search.videos.length > 0) {
        const video = search.videos[0];
        videoInfo = {
          title: video.title,
          author: video.author.name,
          duration: video.timestamp,
          thumbnail: video.thumbnail,
          url: video.url
        };
      } else {
        // Info básica
        videoInfo = {
          title: 'Video de YouTube',
          author: 'Desconocido',
          duration: 'N/A',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: videoUrl
        };
      }
      
    } else {
      // Es búsqueda por texto
      const searchResults = await yts(text);
      
      if (!searchResults.videos || searchResults.videos.length === 0) {
        throw new Error('❌ No se encontraron resultados');
      }
      
      const video = searchResults.videos[0];
      videoUrl = video.url;
      videoInfo = {
        title: video.title,
        author: video.author.name,
        duration: video.timestamp,
        thumbnail: video.thumbnail,
        url: video.url
      };
    }
    
    // ===== 2. ENVIAR IMAGEN CON INFO =====
    const caption = `> 𓂂𓏸 𐅹੭੭ \`Y O U T U B E  •  P L A Y 3\` 🎶

> ര *🎵 Título:* ${videoInfo.title}
> ര *👤 Canal:* ${videoInfo.author}
> ര *⏱ Duración:* ${videoInfo.duration}
> ര *🎚 Calidad:* Audio MP3
> ര *🔧 Método:* API Pública

> *_Descargando audio..._*`;
    
    // Enviar solo la imagen con la info
    if (videoInfo.thumbnail) {
      await sylph.sendMessage(chatId, {
        image: { url: videoInfo.thumbnail },
        caption: caption
      }, { quoted: ms });
    } else {
      await ms.reply(caption);
    }
    
    // ===== 3. DESCARGAR AUDIO CON API PÚBLICA =====
    await sylph.sendMessage(chatId, { react: { text: "⬇️", key: ms.key } });
    
    // Lista de APIs públicas que funcionan (probadas)
    const apis = [
      {
        name: 'yt1s.io',
        url: `https://yt1s.io/api/ajaxSearch/index`,
        method: 'POST',
        body: `q=${encodeURIComponent(videoUrl)}&vt=home`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://yt1s.io',
          'Referer': 'https://yt1s.io/'
        },
        getAudioUrl: (data) => {
          if (data.links && data.links.mp3) {
            const mp3Links = data.links.mp3;
            const best = Object.values(mp3Links)[0];
            return best?.d;
          }
          return null;
        }
      },
      {
        name: 'y2mate',
        url: `https://www.y2mate.com/mates/analyzeV2/ajax`,
        method: 'POST',
        body: `k_query=${encodeURIComponent(videoUrl)}&k_page=home&hl=es`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        },
        getAudioUrl: async (data) => {
          if (data.links && data.links.mp3) {
            const mp3Links = data.links.mp3;
            const best = Object.values(mp3Links)[0];
            if (best?.k) {
              // Obtener link de descarga
              const convertUrl = 'https://www.y2mate.com/mates/convertV2/index';
              const convertBody = `vid=${videoUrl.split('v=')[1]}&k=${best.k}`;
              
              const convertRes = await fetch(convertUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': 'Mozilla/5.0'
                },
                body: convertBody
              });
              
              const convertData = await convertRes.json();
              return convertData?.dlink;
            }
          }
          return null;
        }
      },
      {
        name: 'onlinevideoconverter',
        url: `https://onlinevideoconverter.pro/api/convert`,
        method: 'POST',
        body: JSON.stringify({
          url: videoUrl,
          format: 'mp3'
        }),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        getAudioUrl: (data) => data?.url
      }
    ];
    
    let audioUrl = null;
    let apiUsed = '';
    
    // Intentar cada API en orden
    for (const api of apis) {
      try {
        console.log(`[PLAY3] Probando API: ${api.name}`);
        
        const options = {
          method: api.method,
          headers: api.headers,
          timeout: 30000
        };
        
        if (api.body) {
          options.body = api.body;
        }
        
        const response = await fetch(api.url, options);
        const data = await response.json();
        
        // Obtener URL del audio
        if (api.name === 'y2mate') {
          audioUrl = await api.getAudioUrl(data);
        } else {
          audioUrl = api.getAudioUrl(data);
        }
        
        if (audioUrl) {
          apiUsed = api.name;
          console.log(`[PLAY3] Éxito con ${api.name}: ${audioUrl.substring(0, 50)}...`);
          break;
        }
      } catch (error) {
        console.log(`[PLAY3] Error con ${api.name}:`, error.message);
        continue;
      }
    }
    
    if (!audioUrl) {
      throw new Error('No se pudo obtener el enlace de audio');
    }
    
    // ===== 4. ENVIAR AUDIO =====
    console.log(`[PLAY3] Enviando audio desde: ${apiUsed}`);
    
    await sylph.sendMessage(chatId, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      fileName: `${videoInfo.title.substring(0, 40)}.mp3`.replace(/[^\w\s.-]/gi, '')
    }, { quoted: ms });
    
    // ===== 5. FINALIZAR =====
    await sylph.sendMessage(chatId, { react: { text: "✅", key: ms.key } });
    
  } catch (error) {
    console.error('[PLAY3 ERROR]:', error.message);
    
    await sylph.sendMessage(chatId, { react: { text: "❌", key: ms.key } });
    
    let errorMsg = '';
    if (error.message.includes('No se encontraron')) {
      errorMsg = '*❌ No se encontraron resultados*';
    } else if (error.message.includes('No se pudo obtener')) {
      errorMsg = '*❌ No se pudo descargar el audio*';
    } else {
      errorMsg = `*❌ Error: ${error.message}*`;
    }
    
    await ms.reply(errorMsg);
  }
};

// EXPORTACIÓN
module.exports = {
  command: ['play3', 'p3', 'youtube', 'yt'],
  help: ["play3"],
  description: 'Descargar audio de YouTube usando APIs públicas',
  run: play3Handler
};