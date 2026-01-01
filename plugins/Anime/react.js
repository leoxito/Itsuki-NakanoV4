const axios = require('axios')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { exec } = require('child_process')

async function getReactionVideo(type) {
  try {
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${type}`)
    const gifUrl = data.url
    const baseName = `reaction-${crypto.randomBytes(6).toString("hex")}`
    const gifPath = path.resolve('./downloads', `${baseName}.gif`)
    const mp4Path = path.resolve('./downloads', `${baseName}.mp4`)

    const response = await axios.get(gifUrl, { responseType: 'stream' })
    const writer = fs.createWriteStream(gifPath)
    response.data.pipe(writer)

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -y -i "${gifPath}" -preset ultrafast -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${mp4Path}"`,
        (err) => {
          if (err) return reject(err)
          resolve()
        }
      )
    })

    setTimeout(() => {
      fs.unlink(gifPath, () => {})
      fs.unlink(mp4Path, () => {})
    }, 5 * 60 * 1000)

    return mp4Path
  } catch (err) {
    console.error('Error al obtener la reacción:', err)
    return null
  }
}

module.exports = {
  command: [
    "cry", "cuddle", "hug", "kiss", "lick", "pat", "smug", "blush", "smile",
    "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap",
    "happy", "wink", "poke", "dance", "cringe", "kick"
  ],
  help: [
    "cry", "cuddle", "hug", "kiss", "lick", "pat", "smug", "blush", "smile",
    "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap",
    "happy", "wink", "poke", "dance", "cringe", "kick"
  ],
  group: true,
  description: "🌺 Envía reacciones animadas tipo anime",
  
  async run(ms, { sylph, command }) {
    const type = command.toLowerCase()

    const onePerson = [
      'cry', 'smug', 'blush', 'smile', 'wave', 'happy',
      'wink', 'cringe', 'dance'
    ]

    const twoPersons = [
      'cuddle', 'hug', 'kiss', 'lick', 'pat', 'highfive',
      'handhold', 'nom', 'bite', 'glomp', 'slap', 'kick', 'poke'
    ]

    let txt

    if (onePerson.includes(type)) {
      txt = `*@${ms.sender.split("@")[0]} está ${reactionText(type)}*`
    } else if (twoPersons.includes(type)) {
      const who = ms?.msg?.contextInfo?.mentionedJid?.[0] || ms.quoted?.sender
      if (!who) return ms.reply(`🌱 Ingresa el @tag de un usuario o responde a un mensaje usando *${command}*`)
      txt = `@${ms.sender.split("@")[0]} está ${reactionText(type)} a @${who.split("@")[0]}`
    } else {
      return ms.reply("🌿 Reacción no válida.")
    }

    const videoPath = await getReactionVideo(type)
    if (!videoPath) return ms.reply("💐 No se pudo obtener la animación, intenta de nuevo más tarde.")

    await sylph.sendMessage(ms.from, {
      video: fs.readFileSync(videoPath),
      caption: txt,
      gifPlayback: true,
      mentions: await ms.Mentions(txt)
    }, { quoted: ms })
  }
}

function reactionText(type) {
  const map = {
    cry: 'llorando 😢',
    cuddle: 'acurrucándose 🤗',
    hug: 'abrazando 🤗',
    kiss: 'besando 😘',
    lick: 'lamiendo 😋',
    pat: 'acariciando la cabeza 🐾',
    smug: 'presumiendo 😏',
    blush: 'sonrojándose 😊',
    smile: 'sonriendo 😄',
    wave: 'saludando 👋',
    highfive: 'chocando los cinco 🙌',
    handhold: 'tomando de la mano 🤝',
    nom: 'mordiendo suavemente 😋',
    bite: 'mordiendo 😬',
    glomp: 'dando un abrazo fuerte y repentino 🐻',
    slap: 'dando una bofetada 👋',
    kick: 'pateando 🦵',
    happy: 'feliz 😄',
    wink: 'guiñando un ojo 😉',
    poke: 'picando con el dedo 👉',
    dance: 'bailando 💃',
    cringe: 'con vergüenza ajena 😖'
  }
  return map[type] || type
}