const fs = require('fs')
const path = require('path')
const process = require('process')
const config = require('../../config')
const { generateWAMessageContent, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys')
const fetch = require('node-fetch')

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

async function makeFkontak() {
  try {
    const res = await fetch('https://cdn.russellxz.click/64bba973.jpg')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: { 
        locationMessage: { 
          name: '🌷 𝗜𝘁𝘀𝘂𝗸𝗶 𝗡𝗮𝗸𝗮𝗻𝗼 𝗢𝗳𝗶𝗰𝗶𝗮𝗹 ✅', 
          jpegThumbnail: thumb2 
        } 
      },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return undefined
  }
}

const categoryEmojis = {
  main: '⭐️', subbots: '🍃', economy: '💰', downloader: '🌿', owner: '🔧',
  enable: '⚙️', tools: '🛠️', fun: '🎲', anime: '💕', other: '📚'
}

const categoryTitles = {
  main: '𝐈𝐍𝐅𝐎', subbots: '𝐒𝐎𝐂𝐊𝐄𝐓𝐒-𝐉𝐀𝐃𝐈-𝐁𝐎𝐓', economy: '𝐄𝐂𝐎𝐍𝐎𝐌𝐈𝐀',
  downloader: '𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒', owner: '𝐏𝐑𝐎𝐏𝐈𝐄𝐓𝐀𝐑𝐈𝐎', enable: '𝐀𝐂𝐓𝐈𝐕𝐀𝐑/𝐃𝐄𝐒𝐀𝐂𝐓𝐈𝐕𝐀𝐑',
  tools: '𝐔𝐓𝐈𝐋𝐈𝐃𝐀𝐃𝐄𝐒', fun: '𝐃𝐈𝐕𝐄𝐑𝐒𝐈𝐎𝐍', anime: '𝐑𝐄𝐀𝐂𝐈𝐎𝐍𝐄𝐒-𝐀𝐍𝐈𝐌𝐄', other: '𝐎𝐓𝐑𝐎𝐒'
}

module.exports = {
  command: ['menu', 'help', 'menú', 'comandos', 'commands'],
  help: ['menu'],
  description: 'Muestra todas las funciones disponibles del bot.',
  async run(ms, { sylph, isOwner, isPrem, args, text, prefix, command }) {
    try {
      await sylph.sendMessage(ms.from, { react: { text: "🌺", key: ms.key } })

      const usedMem = process.memoryUsage().heapUsed / 1024 / 1024
      const uptime = sylph.uptime ? fup(sylph.uptime) : formatUptime(process.uptime())
      let info = null
      if (sylph.user.id !== global?.sylph?.user?.id) {
        info = await getSettings(sylph.user.id.split(":")[0] + "@s.whatsapp.net")
      }

      const pluginsDir = path.join(__dirname, '..')
      const commandCategories = {}
      const categoryOrder = ['main', 'subbots', 'economy', 'downloader', 'owner', 'enable', 'tools', 'fun', 'anime', 'other']

      fs.readdirSync(pluginsDir).forEach(category => {
        const categoryDir = path.join(pluginsDir, category)
        if (fs.statSync(categoryDir).isDirectory()) {
          commandCategories[category.toLowerCase()] = []
          fs.readdirSync(categoryDir).forEach(file => {
            if (path.extname(file) !== '.js') return
            try {
              const plugin = require(path.join(categoryDir, file))
              if ((plugin.help || plugin.command) && plugin.description) {
                commandCategories[category.toLowerCase()].push(plugin)
              }
            } catch {}
          })
        }
      })

      const ownerTag = Array.isArray(config.ownerNumber) ? config.ownerNumber[0] : config.ownerNumber
      let infoUser = await getUser(ms.sender)
      let { level, exp, coin, job, prem } = infoUser

      let menuText = `╭┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`
      menuText += `│❍ *Usuario* » ${ms.pushName || 'User-Star'}\n`
      menuText += `│✧ *Estado* » ${sylph.user.id == global?.sylph?.user?.id ? 'Principal 🅥' : 'Sub-Bot ꕥ'}\n`
      menuText += `│❀ *Nivel* » ${level}\n`
      menuText += `│❐ *Experiencia* » ${exp}\n`
      menuText += `│★ *${info?.currency || "Coins"}* » ${coin}\n`
      menuText += `│✿ *Trabajo* » ${job}\n`
      menuText += `│❏ *Tipo* » ${prem === 1 ? "Premium" : "User"}\n`
      menuText += `│✦ *Uptime* » ${uptime}\n`
      menuText += `│✰ *RAM* » ${usedMem.toFixed(2)} MB\n`
      menuText += `╰ׅ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n`
      menuText += `> _*𝘼𝙦𝙪𝙞 𝙏𝙞𝙚𝙣𝙚𝙨 𝙇𝙖 𝙇𝙞𝙨𝙩𝙖 𝘾𝙤𝙢𝙥𝙡𝙚𝙩𝙖 𝘿𝙚 𝘾𝙤𝙢𝙖𝙣𝙙𝙤𝙨 🌷.*_\n\n`

      for (const category of categoryOrder) {
        const plugins = commandCategories[category]
        if (plugins && plugins.length > 0) {
          const emoji = categoryEmojis[category] || '❖'
          const title = categoryTitles[category] || category.toUpperCase()
          menuText += `𓂂𓏸 𐅹੭੭ *\`${title}\`* ${emoji} ᦡᦡ\n`
          for (const plugin of plugins) {
            const helps = Array.isArray(plugin.help) ? plugin.help : (plugin.help ? [plugin.help] : [])
            for (const help of helps) {
              menuText += `ര ${emoji} ׅ ${prefix}${help}\n`
            }
          }
        }
      }

      // Obtener la imagen del banner para el menú
      const bannerRes = await fetch('https://cdn.russellxz.click/ff6b859f.jpg')
      const banner = await bannerRes.buffer()
      
      // Obtener thumbnail para el contexto
      const thumbRes = await fetch('https://i.imgur.com/9fGIQnv.jpeg')
      const jp = await thumbRes.buffer()

      const fkontak = await makeFkontak()
      
      // Generar el contenido multimedia del banner
      let media = await generateWAMessageContent({
        image: banner,
        mimetype: 'image/jpeg'
      }, { upload: sylph.waUploadToServer })

      const buttons = [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "✎ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 𝐎𝐟𝐢𝐜𝐢𝐚𝐥",
            url: "https://whatsapp.com/channel/0029VbBvZH5LNSa4ovSSbQ2N"
          })
        }
      ]

      let msg = generateWAMessageFromContent(ms.from, {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.create({ text: " " }),
              footer: proto.Message.InteractiveMessage.Footer.create({ text: menuText }),
              header: proto.Message.InteractiveMessage.Header.create({
                hasMediaAttachment: true,
                imageMessage: media.imageMessage
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: buttons
              }),
              contextInfo: {
                mentionedJid: [ms.sender],
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: fkontak ? {
                  title: fkontak.message.locationMessage.name,
                  body: 'Itsuki Nakano Wabot',
                  thumbnail: fkontak.message.locationMessage.jpegThumbnail,
                  sourceUrl: 'https://itsuki-serbot.ultraplus.click'
                } : {}
              }
            })
          }
        }
      }, { quoted: fkontak || ms })

      await sylph.relayMessage(ms.from, msg.message, { messageId: msg.key.id })
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } })

    } catch (e) {
      console.error(e)
      ms.reply('Ocurrió un error al procesar el menú.')
    }
  }
}