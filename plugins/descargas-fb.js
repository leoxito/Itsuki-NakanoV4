import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command, args }) => {
  try {
    if (!args[0]) {
      return conn.reply(m.chat,
        `> 🎄 *¡NAVIDAD EN FACEBOOK!* 🎅

> 🎁 *DESCARGADOR FACEBOOK NAVIDEÑO*

> ❌ *Uso incorrecto*

\`\`\`Debes proporcionar un enlace de Facebook\`\`\`

> *Ejemplos navideños:*
> • ${usedPrefix + command} https://fb.watch/xxxxx
> • ${usedPrefix}fb https://facebook.com/xxxxx

> *Comandos disponibles:*
> • ${usedPrefix}fb <url> - Descargar video
> • ${usedPrefix}fbaudio <url> - Extraer audio

> 🎅 *¡Itsuki Nakano V3 - Tu asistente navideño!* 🎄`, m)
    }

    const url = args[0]
    if (!url.match(/facebook\.com|fb\.watch/)) {
      return conn.reply(m.chat,
        `> 🎄 *¡ENLACE INVÁLIDO!* 🎅

> ❌ *URL no válida*

\`\`\`Por favor envía un enlace de Facebook válido\`\`\`

> *Ejemplo correcto:*
> https://fb.watch/xxxxx
> https://facebook.com/xxxxx

> 🎅 *¡Itsuki V3 necesita un enlace válido!* 🎄`, m)
    }

    await m.react('🎁')
    await m.react('🕑') // Emoji de espera

    // API de mayapi
    const apiUrl = `https://mayapi.ooguy.com/facebook?url=${encodeURIComponent(url)}&apikey=may-f53d1d49`
    console.log('🎁 Solicitando a API:', apiUrl)

    const response = await fetch(apiUrl, {
      timeout: 30000
    })

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📦 Respuesta de API:', data)

    // Verificar diferentes estructuras de respuesta
    if (!data.status) {
      throw new Error('La API no respondió correctamente')
    }

    let videoUrl, videoTitle

    // Buscar en diferentes estructuras posibles
    if (data.result && data.result.url) {
      videoUrl = data.result.url
      videoTitle = data.result.title || 'Video de Facebook'
    } else if (data.url) {
      videoUrl = data.url
      videoTitle = data.title || 'Video de Facebook'
    } else if (data.data && data.data.url) {
      videoUrl = data.data.url
      videoTitle = data.data.title || 'Video de Facebook'
    } else {
      throw new Error('No se encontró URL del video en la respuesta')
    }

    console.log('🎬 URL del video encontrada:', videoUrl)
    console.log('📝 Título:', videoTitle)

    // Verificar si es comando de audio
    const isAudioCommand = command.toLowerCase().includes('audio')

    if (isAudioCommand) {
      // Convertir video a audio - SIN MENSAJE
      await conn.sendMessage(m.chat, {
        audio: { url: videoUrl },
        mimetype: 'audio/mpeg',
        fileName: `audio_facebook.mp3`
      }, { quoted: m })
    } else {
      // Enviar el video directamente desde la URL
      await conn.sendMessage(m.chat, {
        video: { url: videoUrl },
        caption: `> 🎄 *¡VIDEO DESCARGADO!* 🎅

> 📹 *Video de Facebook*

> 📝 *Título:* ${videoTitle}
> 🎬 *Formato:* MP4
> 🎁 *Calidad:* Original

> 🎅 *¡Itsuki V3 descargó tu video!*
> 🎄 *¡Feliz Navidad con Itsuki Nakano V3!* 🎁`
      }, { quoted: m })
    }

    await m.react('✅')

  } catch (error) {
    console.error('❌ Error en descarga Facebook:', error)

    await conn.reply(m.chat,
      `> 🎄 *¡ERROR EN DESCARGA!* 🎅

> ❌ *Error en la descarga*

> 📝 *Detalles:* ${error.message}

> 🔍 *Posibles soluciones:*
> • Verifica que el enlace sea correcto
> • El video podría ser privado
> • Intenta con otro enlace
> • Espera un momento y vuelve a intentar

> 🎅 *Itsuki V3 lo intentará de nuevo...*
> 🎄 *¡No te rindas!* 🎁`, m)

    await m.react('❌')
  }
}

handler.help = ['fb', 'fbaudio']
handler.tags = ['downloader']
handler.command = ['fb','fbaudio']
handler.register = false

export default handler