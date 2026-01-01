const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const process = require('process')
const config = require('../../config')

function fup(isoString) {
  const inicio = new Date(isoString)
  const ahora = new Date()
  const segundosTotales = Math.floor((ahora - inicio) / 1000)
  const horas = Math.floor(segundosTotales / 3600)
  const minutos = Math.floor((segundosTotales % 3600) / 60)
  const segundos = segundosTotales % 60
  return `${horas.toString().padStart(2,'0')}:${minutos.toString().padStart(2,'0')}:${segundos.toString().padStart(2,'0')}`
}

function formatUptime(seconds) {
  const pad = s => (s < 10 ? '0' : '') + s
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function getGreeting() {
  const hour = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', hour12: false })
  if (hour < 12) return 'Buenos días.'
  if (hour < 18) return 'Buenas tardes.'
  return 'Buenas noches.'
}

module.exports = {
  command: ['infobot','infosubbot','botinfo'],
  help: ['infobot'],
  description: 'Muestra información del bot principal o subbot según número/tag/respuesta.',
  async run(ms, { sylph, args }) {
    try {
      // Enviar reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
      
      const usedMem = process.memoryUsage().heapUsed / 1024 / 1024
      const uptime = sylph.uptime ? fup(sylph.uptime) : formatUptime(process.uptime())

      let target
      if (ms.quoted && ms.quoted.sender) {
        target = ms.quoted.sender
      } else if (ms.mentionedJid && ms.mentionedJid.length > 0) {
        target = ms.mentionedJid[0]
      } else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '')
        if (!num.startsWith('521')) num = '521' + num
        target = num + '@s.whatsapp.net'
      } else {
        target = sylph.user.id
      }

      const tid = target.split(':')[0]
      const botId = sylph.user?.id?.split(':')[0]

      // BOT PRINCIPAL
      if (botId && tid === botId) {
        const txt = `> 𓂂𓏸 𐅹੭੭ \`𝘉 𝘖 𝘛 - 𝘗 𝘙 𝘐 𝘕 𝘊 𝘐 𝘗 𝘈 𝘓\` 📍

> ര ✿ Nombre   : ${config.botName || 'Bot Principal'}
> ര ꕥ Owner    : ${Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber}
> ര ❏ ID       : ${sylph.user.id}
> ര ❍ Uptime   : ${uptime}
> ര ❀ RAM      : ${usedMem.toFixed(2)} MB
`
        let imgBuf
        try {
          imgBuf = fs.readFileSync('./lib/menu.jpg')
        } catch {
          imgBuf = null
        }
        
        // Enviar reacción de éxito
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
        
        if (imgBuf) {
          return sylph.sendMessage(ms.from, { image: imgBuf, caption: txt }, { quoted: ms })
        } else {
          return sylph.sendMessage(ms.from, { text: txt }, { quoted: ms })
        }
      }

      // SUBBOTS
      let found = null
      if (global.sylphs && Array.isArray(global.sylphs)) {
        for (let s of global.sylphs) {
          if (!s.user || !s.user.id) continue
          let sid = s.user.id.split(':')[0]
          if (sid === tid) {
            found = s.user
            break
          }
        }
      }

      if (found) {
        let settings = await getSettings(tid)
        const txt = `> 𓂂𓏸 𐅹੭੭ \`𝘚𝘜𝘉 - 𝘉𝘖𝘛\` 📍

> ര ✿ Nombre   : ${config.botName || 'Sub-Bot'}
> ര ꕥ Owner    : ${Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber}
> ര ❏ ID       : ${sylph.user.id}
> ര ❍ Uptime   : ${uptime}
> ര ❀ RAM      : ${usedMem.toFixed(2)} MB
`

        let imgBuf = null
        if (settings.image) {
          try {
            imgBuf = await (await fetch(settings.image)).buffer()
          } catch {
            imgBuf = null
          }
        }
        if (!imgBuf) {
          try { imgBuf = fs.readFileSync('./lib/menu.jpg') } catch { imgBuf = null }
        }

        // Enviar reacción de éxito
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
        
        if (imgBuf) {
          return sylph.sendMessage(ms.from, { image: imgBuf, caption: txt }, { quoted: ms })
        } else {
          return sylph.sendMessage(ms.from, { text: txt }, { quoted: ms })
        }
      } else {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return sylph.sendMessage(ms.from, { text: `❌ No se encontró información para ${target}` }, { quoted: ms })
      }
    } catch (error) {
      console.error('Error en comando infobot:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      return sylph.sendMessage(ms.from, { text: 'Ocurrió un error al obtener la información del bot.' }, { quoted: ms })
    }
  }
}