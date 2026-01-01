const axios = require("axios");

async function pinterest(url) {
  try {
    const { data } = await axios.post("https://api-sky.ultraplus.click/pinterest", { url }, {
      headers: { apikey: "leo.xyz" }
    });

    console.log('📦 Respuesta completa de la API:', JSON.stringify(data, null, 2));

    // IMPORTANTE: Verifica exactamente qué devuelve tu API
    // Si devuelve {status: true, result: {...}} o directamente los datos
    if (data && data.result) {
      console.log('✅ API devuelve data.result');
      return data.result;
    } else if (data && (data.title || data.media || data.downloads)) {
      console.log('✅ API devuelve datos directamente');
      return data;
    } else if (data) {
      console.log('✅ API devuelve algo:', typeof data);
      return data;
    }

    throw new Error("Respuesta de API vacía o inválida");
  } catch (error) {
    console.error('❌ Error en pinterest():', error.message);
    if (error.response) {
      console.error('📡 Respuesta del error:', error.response.data);
    }
    throw error;
  }
}

module.exports = {
  command: ['pin'],
  help: ['pin'],
  description: 'Descarga imágenes o videos de Pinterest.',
  run: async (ms, { sylph, args, command, prefix }) => {
    try {
      if (!args[0]) {
        return ms.reply(`❀ *Ingresa un enlace de Pinterest.*\n\n*Ejemplo:*\n${prefix + command} https://pin.it/ejemplo`);
      }

      const url = args[0];

      // Verificación básica
      if (!url.includes('pinterest.com') && !url.includes('pin.it')) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply('*✰ Enlace inválido. Debe ser de Pinterest.*');
      }

      // Reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "⏳", key: ms.key } });

      // 1. Obtener datos de la API
      console.log('🔗 Solicitando a la API para URL:', url);
      const apiResponse = await pinterest(url);
      console.log('📊 API Response tipo:', typeof apiResponse);
      console.log('📊 API Response:', apiResponse);

      // Si apiResponse es null/undefined
      if (!apiResponse) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply('*❀ La API devolvió una respuesta vacía.*');
      }

      // 2. Extraer información básica
      let title = 'Sin título';
      if (apiResponse.title) {
        title = apiResponse.title;
      } else if (apiResponse.caption) {
        title = apiResponse.caption;
      }

      // 3. Encontrar la URL del media - PRUEBA DIRECTO
      let mediaUrl = null;
      let isVideo = false;

      // Opción 1: URL directa del video MP4
      if (apiResponse.media && apiResponse.media.mp4) {
        mediaUrl = apiResponse.media.mp4;
        isVideo = true;
        console.log('🎥 Encontrado MP4 directo:', mediaUrl);
      }
      // Opción 2: Thumbnail como imagen
      else if (apiResponse.media && apiResponse.media.thumbnail) {
        mediaUrl = apiResponse.media.thumbnail;
        isVideo = false;
        console.log('🖼️ Encontrado thumbnail:', mediaUrl);
      }
      // Opción 3: Campo de descarga de video
      else if (apiResponse.downloads && apiResponse.downloads.video_inline) {
        mediaUrl = "https://api-sky.ultraplus.click" + apiResponse.downloads.video_inline;
        isVideo = true;
        console.log('📥 Encontrado video_inline:', mediaUrl);
      }
      // Opción 4: Campo de descarga de imagen
      else if (apiResponse.downloads && apiResponse.downloads.thumbnail_inline) {
        mediaUrl = "https://api-sky.ultraplus.click" + apiResponse.downloads.thumbnail_inline;
        isVideo = false;
        console.log('🖼️ Encontrado thumbnail_inline:', mediaUrl);
      }
      // Opción 5: Si apiResponse ES directamente una URL
      else if (typeof apiResponse === 'string' && (apiResponse.includes('http://') || apiResponse.includes('https://'))) {
        mediaUrl = apiResponse;
        isVideo = apiResponse.includes('.mp4') || apiResponse.includes('.mov') || apiResponse.includes('.webm');
        console.log('🔗 API devolvió URL directa:', mediaUrl);
      }
      // Opción 6: Buscar en cualquier campo que pueda contener URL
      else if (typeof apiResponse === 'object') {
        // Buscar recursivamente cualquier campo que sea una URL
        const findUrlInObject = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'string' && 
                (obj[key].includes('.mp4') || obj[key].includes('.jpg') || obj[key].includes('.png') || obj[key].includes('http'))) {
              return obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              const found = findUrlInObject(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };

        mediaUrl = findUrlInObject(apiResponse);
        if (mediaUrl) {
          isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') || mediaUrl.includes('.webm');
          console.log('🔍 Encontrado URL en objeto:', mediaUrl);
        }
      }

      // 4. Si NO encontramos mediaUrl
      if (!mediaUrl) {
        console.log('❌ NO se encontró mediaUrl. Respuesta completa:');
        console.log(JSON.stringify(apiResponse, null, 2));

        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(`*❀ No se encontró contenido descargable.*\n\n*Respuesta de API:*\n\`\`\`json\n${JSON.stringify(apiResponse, null, 2).substring(0, 1500)}\n\`\`\``);
      }

      console.log('✅ Media URL final:', mediaUrl);
      console.log('✅ ¿Es video?', isVideo);
      console.log('✅ Título:', title);

      // 5. Crear mensaje
      const info = `> 𓂂𓏸 𐅹੭੭ *\`P I N T E R E S T - I N F O\`* ✨

> ര ✐ Título : ${title}
> ര ✦ Tipo : ${isVideo ? '𝗩𝗶𝗱𝗲𝗼 📽️' : '𝗜𝗺𝗮𝗴𝗲𝗻 '}
> ര ✧ Enlace : ${url}

> *_Descarga completada ✅_*`;

      // 6. Enviar contenido
      if (isVideo) {
        console.log('📤 Enviando video...');
        await sylph.sendMessage(ms.from, {
          video: { url: mediaUrl },
          caption: info
        }, { quoted: ms });
      } else {
        console.log('📤 Enviando imagen...');
        await sylph.sendMessage(ms.from, {
          image: { url: mediaUrl },
          caption: info
        }, { quoted: ms });
      }

      // 7. Reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });

    } catch (error) {
      console.error('💥 ERROR en comando pin:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });

      let errorMsg = `*❀ Error:* ${error.message || 'Error desconocido'}`;
      if (error.response) {
        errorMsg += `\n*Código:* ${error.response.status}`;
        if (error.response.data) {
          errorMsg += `\n*Detalles:* ${JSON.stringify(error.response.data).substring(0, 200)}`;
        }
      }

      return ms.reply(errorMsg);
    }
  }
};