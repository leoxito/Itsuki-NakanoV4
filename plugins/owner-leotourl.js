// plugins/tourl.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import FormData from 'form-data'
import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Importar downloadContentFromMessage desde baileys
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function unwrapMessage(m) {
  let n = m
  while (n?.viewOnceMessage?.message || n?.viewOnceMessageV2?.message || n?.ephemeralMessage?.message) {
    n = n.viewOnceMessage?.message || n.viewOnceMessageV2?.message || n.ephemeralMessage?.message
  }
  return n
}

function extFromMime(mime, fallback = 'bin') {
  if (!mime) return fallback
  const m = mime.toLowerCase()
  if (m.includes('image/')) {
    if (m.includes('jpeg')) return 'jpg'
    if (m.includes('png')) return 'png'
    if (m.includes('webp')) return 'webp'
    return 'jpg'
  }
  if (m.includes('video/')) {
    if (m.includes('mp4')) return 'mp4'
    if (m.includes('3gpp')) return '3gp'
    if (m.includes('webm')) return 'webm'
    return 'mp4'
  }
  if (m.includes('audio/')) {
    if (m.includes('mpeg') || m.includes('mp3')) return 'mp3'
    if (m.includes('ogg')) return 'ogg'
    if (m.includes('opus')) return 'opus'
    if (m.includes('aac')) return 'aac'
    if (m.includes('wav')) return 'wav'
    if (m.includes('x-m4a') || m.includes('m4a')) return 'm4a'
    if (m.includes('amr')) return 'amr'
    return 'mp3'
  }
  if (m.includes('application/')) {
    if (m.includes('pdf')) return 'pdf'
    if (m.includes('zip')) return 'zip'
    if (m.includes('json')) return 'json'
    if (m.includes('xml')) return 'xml'
  }
  return fallback
}

const handler = async (m, { conn, command, usedPrefix }) => {
  const chatId = m.key.remoteJid
  const pref = usedPrefix || global.prefix || "."

  const ctx = m.message?.extendedTextMessage?.contextInfo
  const rawQuoted = ctx?.quotedMessage
  const quoted = rawQuoted ? unwrapMessage(rawQuoted) : null

  if (!quoted) {
    return conn.sendMessage(chatId, {
      text: `> Responde a un archivo para subirlo\n\n> ✨️ Uso: ${pref}${command}`
    }, { quoted: m })
  }

  await conn.sendMessage(chatId, { react: { text: '🔄', key: m.key } })

  let rawPath = null
  let finalPath = null

  try {
    let typeDetected = null
    let mediaMessage = null
    let downloadType = null

    if (quoted.imageMessage) {
      typeDetected = 'image'
      mediaMessage = quoted.imageMessage
      downloadType = 'image'
    } else if (quoted.videoMessage) {
      typeDetected = 'video'
      mediaMessage = quoted.videoMessage
      downloadType = 'video'
    } else if (quoted.stickerMessage) {
      typeDetected = 'sticker'
      mediaMessage = quoted.stickerMessage
      downloadType = 'sticker'
    } else if (quoted.audioMessage) {
      typeDetected = 'audio'
      mediaMessage = quoted.audioMessage
      downloadType = 'audio'
    } else if (quoted.documentMessage) {
      typeDetected = 'document'
      mediaMessage = quoted.documentMessage
      downloadType = 'document'
    } else {
      throw new Error("Tipo de archivo no soportado")
    }

    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

    const rawExt = typeDetected === 'sticker' ? 'webp' : extFromMime(mediaMessage.mimetype, typeDetected === 'image' ? 'jpg' : typeDetected === 'video' ? 'mp4' : typeDetected === 'audio' ? 'mp3' : 'bin')

    rawPath = path.join(tmpDir, `${Date.now()}_input.${rawExt}`)

    // Usar downloadContentFromMessage importado directamente
    const stream = await downloadContentFromMessage(mediaMessage, downloadType)

    const ws = fs.createWriteStream(rawPath)
    for await (const chunk of stream) {
      ws.write(chunk)
    }
    ws.end()

    await new Promise((resolve, reject) => {
      ws.on('finish', resolve)
      ws.on('error', reject)
    })

    const stats = fs.statSync(rawPath)
    if (stats.size > 100 * 1024 * 1024) { // 100MB máximo
      throw new Error('Archivo muy pesado (máximo 100MB)')
    }

    finalPath = rawPath

    // Convertir audio si es necesario
    if (typeDetected === 'audio' && ['ogg', 'm4a', 'opus', 'aac', 'wav', 'amr'].includes(rawExt)) {
      finalPath = path.join(tmpDir, `${Date.now()}_converted.mp3`)
      await new Promise((resolve, reject) => {
        ffmpeg(rawPath)
          .audioCodec('libmp3lame')
          .audioBitrate(128)
          .toFormat('mp3')
          .on('end', resolve)
          .on('error', (err) => {
            console.error('Error en conversión de audio:', err)
            reject(new Error('Error al convertir audio a MP3'))
          })
          .save(finalPath)
      })
      // Eliminar archivo original después de la conversión
      try { 
        if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath) 
      } catch (e) {
        console.error('Error eliminando archivo temporal:', e)
      }
    }

    const form = new FormData()
    form.append('file', fs.createReadStream(finalPath))

    const res = await axios.post('https://cdn.russellxz.click/upload.php', form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000, // 2 minutos timeout
    })

    if (!res.data?.url) {
      throw new Error('No se recibió URL del servidor de subida')
    }

    await conn.sendMessage(chatId, {
      text: `> ✅ Subido correctamente\n\n> 🔗 ${res.data.url}`
    }, { quoted: m })

    await conn.sendMessage(chatId, { react: { text: '✅', key: m.key } })

  } catch (err) {
    console.error('Error en tourl plugin:', err)
    await conn.sendMessage(chatId, {
      text: `❌ Error: ${err.message}`
    }, { quoted: m })
    await conn.sendMessage(chatId, { react: { text: '❌', key: m.key } })
  } finally {
    // Limpiar archivos temporales de forma segura
    try { 
      if (finalPath && finalPath !== rawPath && fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath)
      }
    } catch (e) {
      console.error('Error limpiando finalPath:', e)
    }
    try { 
      if (rawPath && fs.existsSync(rawPath)) {
        fs.unlinkSync(rawPath)
      }
    } catch (e) {
      console.error('Error limpiando rawPath:', e)
    }
  }
}

handler.command = ['tourl', 'upload', 'subir']
handler.help = ['tourl <responder a archivo>']
handler.tags = ['tools']

export default handler