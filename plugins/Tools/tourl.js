// Fixieado Por ZzawX

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const axios = require('axios')
const ffmpeg = require('fluent-ffmpeg')

module.exports = {
  command: ["tourl", "leo"],
  description: "Sube archivos a una URL",
  category: "tools",
  isGroup: false,

  run: async (ms, { sylph, prefix }) => {
    const chatId = ms.from
    const pref = prefix || "."
    const quoted = ms.quoted ? ms.quoted : ms

    if (!ms.quoted && !/image|video|audio|sticker|document/.test(ms.mtype)) {
      return ms.reply(`> Responde a un archivo para subirlo\n\n> ✨️ Uso: ${pref}tourl`)
    }

    try {
      await sylph.sendMessage(chatId, { react: { text: '🔄', key: ms.key } })
    } catch (e) {}

    let rawPath = null
    let finalPath = null

    try {
      const buffer = await quoted.download() 
      if (!buffer) throw new Error("No se pudo descargar el archivo.")

      const tmpDir = path.join(process.cwd(), 'temp')
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

      const mime = quoted.mimetype || quoted.msg?.mimetype || ms.mtype || ''
      let ext = 'bin'
      if (mime.includes('image')) ext = 'jpg'
      else if (mime.includes('video')) ext = 'mp4'
      else if (mime.includes('audio')) ext = 'mp3'
      else if (mime.includes('sticker')) ext = 'webp'
      
      rawPath = path.join(tmpDir, `${Date.now()}_input.${ext}`)
      fs.writeFileSync(rawPath, buffer)
      finalPath = rawPath

      if (mime.includes('audio') && !mime.includes('mp3')) {
        finalPath = path.join(tmpDir, `${Date.now()}_converted.mp3`)
        await new Promise((r, j) => {
          ffmpeg(rawPath).toFormat('mp3').on('end', r).on('error', j).save(finalPath)
        })
      }

      let link = null
      
      
      try {
        const form = new FormData()
        form.append('files[]', fs.createReadStream(finalPath))
        const res = await axios.post('https://uguu.se/upload.php', form, {
          headers: form.getHeaders()
        })
        link = res.data.files[0].url
      } catch (e) {
       
        const form2 = new FormData()
        form2.append('file', fs.createReadStream(finalPath))
        const res2 = await axios.post('https://telegra.ph/upload', form2, {
          headers: form2.getHeaders()
        })
        link = 'https://telegra.ph' + res2.data[0].src
      }

      if (!link) throw new Error('Error al generar el enlace.')

      await sylph.sendMessage(chatId, {
        text: `> ✅ Subido correctamente\n\n> 🔗 ${link}`
      }, { quoted: ms })

      try {
        await sylph.sendMessage(chatId, { react: { text: '✅', key: ms.key } })
      } catch (e) {}

    } catch (err) {
      console.error(err)
      ms.reply(`❌ Error: ${err.message}`)
      try {
        await sylph.sendMessage(chatId, { react: { text: '❌', key: ms.key } })
      } catch (e) {}
    } finally {
      if (rawPath && fs.existsSync(rawPath)) try { fs.unlinkSync(rawPath) } catch (e) {}
      if (finalPath && fs.existsSync(finalPath) && finalPath !== rawPath) try { fs.unlinkSync(finalPath) } catch (e) {}
    }
  }
}
