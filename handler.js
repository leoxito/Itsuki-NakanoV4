import { smsg } from "./lib/simple.js" 
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import fetch from "node-fetch"
import ws from "ws"
import { createCanvas, loadImage } from '@napi-rs/canvas'
import os from 'os'

if (typeof global.__filename !== 'function') {
  global.__filename = function(url, relative = false) {
    try {
      const filename = fileURLToPath(url);
      return relative ? path.relative(process.cwd(), filename) : filename;
    } catch (e) {
      console.error('Error en __filename:', e);
      return '';
    }
  };
}

if (typeof global.__dirname !== 'function') {
  global.__dirname = function(url, relative = false) {
    try {
      const dirname = path.dirname(fileURLToPath(url));
      return relative ? path.relative(process.cwd(), dirname) : dirname;
    } catch (e) {
      console.error('Error en __dirname:', e);
      return '';
    }
  };
}

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));

// === DEFINIR OWNER GLOBAL ===
// Agrega esta línea para definir el owner
global.owner = ['573187418668@s.whatsapp.net']; // Tu número en formato JID
global.roowner = ['573187418668']; // Tu número para referencia

const { proto } = (await import("@whiskeysockets/baileys")).default
const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
clearTimeout(this)
resolve()
}, ms))

const paisesArabesCompletos = {
    'arabia': {
        codigos: ['966', '00966', '5966', '9665', '9660', '9661', '9662', '9663', '9664', '9665', '9666', '9667', '9668', '9669'],
        nombre: 'Arabia Saudita 🇸🇦'
    },
    'emiratos': {
        codigos: ['971', '00971', '5971', '9715', '9710', '9711', '9712', '9713', '9714', '9715', '9716', '9717', '9718', '9719'],
        nombre: 'Emiratos Árabes 🇦🇪'
    },
    'qatar': {
        codigos: ['974', '00974', '5974', '9745', '9740', '9741', '9742', '9743', '9744', '9745', '9746', '9747', '9748', '9749'],
        nombre: 'Qatar 🇶🇦'
    },
    'kuwait': {
        codigos: ['965', '00965', '5965', '9655', '9650', '9651', '9652', '9653', '9654', '9655', '9656', '9657', '9658', '9659'],
        nombre: 'Kuwait 🇰🇼'
    },
    'bahrein': {
        codigos: ['973', '00973', '5973', '9735', '9730', '9731', '9732', '9733', '9734', '9735', '9736', '9737', '9738', '9739'],
        nombre: 'Bahréin 🇧🇭'
    },
    'oman': {
        codigos: ['968', '00968', '5968', '9685', '9680', '9681', '9682', '9683', '9684', '9685', '9686', '9687', '9688', '9689'],
        nombre: 'Omán 🇴🇲'
    },
    'egipto': {
        codigos: ['20', '020', '200', '201', '202', '203', '204', '205', '206', '207', '208', '209', '2010', '2011', '2012'],
        nombre: 'Egipto 🇪🇬'
    },
    'jordania': {
        codigos: ['962', '00962', '5962', '9625', '9620', '9621', '9622', '9623', '9624', '9625', '9626', '9627', '9628', '9629'],
        nombre: 'Jordania 🇯🇴'
    },
    'siria': {
        codigos: ['963', '00963', '5963', '9635', '9630', '9631', '9632', '9633', '9634', '9635', '9636', '9637', '9638', '9639'],
        nombre: 'Siria 🇸🇾'
    },
    'irak': {
        codigos: ['964', '00964', '5964', '9645', '9640', '9641', '9642', '9643', '9644', '9645', '9646', '9647', '9648', '9649'],
        nombre: 'Irak 🇮🇶'
    },
    'yemen': {
        codigos: ['967', '00967', '5967', '9675', '9670', '9671', '9672', '9673', '9674', '9675', '9676', '9677', '9678', '9679'],
        nombre: 'Yemen 🇾🇪'
    },
    'palestina': {
        codigos: ['970', '00970', '5970', '9705', '9700', '9701', '9702', '9703', '9704', '9705', '9706', '9707', '9708', '9709'],
        nombre: 'Palestina 🇵🇸'
    },
    'libano': {
        codigos: ['961', '00961', '5961', '9615', '9610', '9611', '9612', '9613', '9614', '9615', '9616', '9617', '9618', '9619'],
        nombre: 'Líbano 🇱🇧'
    },
    'libia': {
        codigos: ['218', '00218', '0218', '2180', '2181', '2182', '2183', '2184', '2185', '2186', '2187', '2188', '2189'],
        nombre: 'Libia 🇱🇾'
    },
    'marruecos': {
        codigos: ['212', '00212', '0212', '2120', '2121', '2122', '2123', '2124', '2125', '2126', '2127', '2128', '2129'],
        nombre: 'Marruecos 🇲🇦'
    },
    'tunez': {
        codigos: ['216', '00216', '0216', '2160', '2161', '2162', '2163', '2164', '2165', '2166', '2167', '2168', '2169'],
        nombre: 'Túnez 🇹🇳'
    },
    'argelia': {
        codigos: ['213', '00213', '0213', '2130', '2131', '2132', '2133', '2134', '2135', '2136', '2137', '2138', '2139'],
        nombre: 'Argelia 🇩🇿'
    },
    'mauritania': {
        codigos: ['222', '00222', '0222', '2220', '2221', '2222', '2223', '2224', '2225', '2226', '2227', '2228', '2229'],
        nombre: 'Mauritania 🇲🇷'
    },
    'yibuti': {
        codigos: ['253', '00253', '0253', '2530', '2531', '2532', '2533', '2534', '2535', '2536', '2537', '2538', '2539'],
        nombre: 'Yibuti 🇩🇯'
    },
    'somalia': {
        codigos: ['252', '00252', '0252', '2520', '2521', '2522', '2523', '2524', '2525', '2526', '2527', '2528', '2529'],
        nombre: 'Somalia 🇸🇴'
    },
    'sudan': {
        codigos: ['249', '00249', '0249', '2490', '2491', '2492', '2493', '2494', '2495', '2496', '2497', '2498', '2499'],
        nombre: 'Sudán 🇸🇩'
    }
}

function detectarNumeroArabe(numero) {
    if (!numero || typeof numero !== 'string') return { esArabe: false }

    const numStr = numero.toString().replace(/\D/g, '')

    if (numStr.length < 3) return { esArabe: false }

    for (const [paisId, info] of Object.entries(paisesArabesCompletos)) {
        for (const codigo of info.codigos) {
            const codigoLimpio = codigo.replace('+', '').replace('00', '')

            if (numStr.startsWith(codigoLimpio)) {
                return {
                    esArabe: true,
                    pais: paisId,
                    nombre: info.nombre,
                    codigo: codigo,
                    numeroCompleto: numStr
                }
            }
        }
    }

    return { esArabe: false }
}

async function isUserAdmin(conn, groupJid, userJid) {
    try {
        const metadata = await conn.groupMetadata(groupJid)
        const participant = metadata.participants.find(p => p.id === userJid)
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin')
    } catch (error) {
        return false
    }
}

async function verificarAntiArabe(conn, m) {
    if (!m || !m.isGroup) return false

    try {
        const chat = global.db.data.chats?.[m.chat]
        if (!chat || !chat.antiArabe) return false

        const sender = m.sender
        const userNumber = sender.split('@')[0]

        const isAdmin = await isUserAdmin(conn, m.chat, sender)
        if (isAdmin) return false

        const deteccion = detectarNumeroArabe(userNumber)

        if (deteccion.esArabe) {
            console.log(`🚫 ANTI-ÁRABE: Detectado número ${userNumber} - País: ${deteccion.nombre}`)

            try {
                await conn.groupParticipantsUpdate(m.chat, [sender], 'remove')
                console.log(`✅ Usuario ${userNumber} expulsado por ser árabe`)
            } catch (expError) {
                console.error(`❌ Error al expulsar usuario ${userNumber}:`, expError)
                return false
            }

            if (!chat.antiArabeRegistros) chat.antiArabeRegistros = []
            chat.antiArabeRegistros.push({
                usuario: sender,
                numero: userNumber,
                pais: deteccion.nombre,
                fecha: new Date().toISOString(),
                motivo: 'numero-arabe'
            })

            if (chat.antiArabeRegistros.length > 100) {
                chat.antiArabeRegistros = chat.antiArabeRegistros.slice(-100)
            }

            const mensajeExpulsion = `╭─「 🚫 *ANTI-ÁRABE ACTIVADO* 🚫 」
│ 
│ ⚠️ *USUARIO ÁRABE EXPULSADO*
│ 
│ 📋 *INFORMACIÓN:*
│ ├ 🔢 Número: ${userNumber}
│ ├ 🌍 País: ${deteccion.nombre}
│ ├ ⚡ Acción: Expulsado automáticamente
│ └ 🆔 ID: ${sender.split('@')[0]}
│ 
│ ⚙️ *CONFIGURACIÓN:*
│ ├ 🛡️ Anti-Árabe: ✅ ACTIVADO
│ ├ 👑 Admin: ${isAdmin ? '✅ Sí' : '❌ No'}
│ └ 📊 Expulsiones: ${chat.antiArabeRegistros.length}
│ 
│ ℹ️ *Los números árabes están prohibidos*
╰─◉`

            try {
                await conn.sendMessage(m.chat, { 
                    text: mensajeExpulsion,
                    mentions: [sender]
                })
            } catch (msgError) {
                console.error('Error enviando mensaje de expulsión:', msgError)
            }

            return true
        }
    } catch (error) {
        console.error('Error en anti-árabe:', error)
    }

    return false
}

async function loadImageSmart(src) {
  if (!src) return null
  try {
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src)
      if (!res.ok) throw new Error('fetch fail')
      const buf = Buffer.from(await res.arrayBuffer())
      return await loadImage(buf)
    }
    return await loadImage(src)
  } catch { return null }
}

const WELCOME_STATE_FILE = path.join(process.cwd(), 'temp/welcome_state.json')

function loadWelcomeState() {
  try {
    if (fs.existsSync(WELCOME_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(WELCOME_STATE_FILE, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading welcome state:', error)
  }
  return {}
}

function saveWelcomeState(state) {
  try {
    const tempDir = path.dirname(WELCOME_STATE_FILE)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    fs.writeFileSync(WELCOME_STATE_FILE, JSON.stringify(state, null, 2))
  } catch (error) {
    console.error('Error saving welcome state:', error)
  }
}

export function isWelcomeEnabled(jid) {
  const state = loadWelcomeState()
  return state[jid] !== false
}

export function setWelcomeState(jid, enabled) {
  const state = loadWelcomeState()
  state[jid] = enabled
  saveWelcomeState(state)
  return enabled
}

export async function makeCard({ title = 'Bienvenida', subtitle = '', avatarUrl = '', bgUrl = '', badgeUrl = '' }) {
  const width = 900, height = 380
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const radius = 30
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#06141f')
  gradient.addColorStop(1, '#0b2a3b')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.lineWidth = 12
  ctx.strokeStyle = '#19c3ff'
  ctx.strokeRect(6, 6, width - 12, height - 12)

  if (bgUrl) {
    try {
      const bg = await loadImageSmart(bgUrl)
      const pad = 18
      ctx.globalAlpha = 0.9
      if (bg) ctx.drawImage(bg, pad, pad, width - pad * 2, height - pad * 2)
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(pad, pad, width - pad * 2, height - pad * 2)
    } catch {}
  }

  let avatarUsedInCenter = false
  let centerR = 54
  let centerCX = Math.round(width / 2)
  let centerCY = 86
  try {
    const useCenterAvatar = !badgeUrl && !!avatarUrl
    centerR = useCenterAvatar ? 80 : 54
    centerCY = useCenterAvatar ? Math.round(height / 2) : 86
    const centerSrc = (badgeUrl && badgeUrl.trim()) ? badgeUrl : (avatarUrl || '')
    if (centerSrc) {
      const badge = await loadImageSmart(centerSrc)
      ctx.save()
      ctx.beginPath(); ctx.arc(centerCX, centerCY, centerR, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
      if (badge) ctx.drawImage(badge, centerCX - centerR, centerCY - centerR, centerR * 2, centerR * 2)
      ctx.restore()
      ctx.lineWidth = 6
      ctx.strokeStyle = '#19c3ff'
      ctx.beginPath(); ctx.arc(centerCX, centerCY, centerR + 4, 0, Math.PI * 2); ctx.stroke()
      avatarUsedInCenter = useCenterAvatar
    }
  } catch {}

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 8
  ctx.font = 'bold 48px Sans'
  const titleY = avatarUsedInCenter ? 70 : 178
  ctx.fillText(title, width / 2, titleY)
  ctx.shadowBlur = 0

  ctx.fillStyle = '#d8e1e8'
  ctx.font = '28px Sans'
  const lines = Array.isArray(subtitle) ? subtitle : [subtitle]
  const subBaseY = avatarUsedInCenter ? (centerCY + centerR + 28) : 218
  lines.forEach((t, i) => ctx.fillText(String(t || ''), width / 2, subBaseY + i * 34))

  if (avatarUrl && !avatarUsedInCenter) {
    try {
      const av = await loadImageSmart(avatarUrl)
      const r = 64
      const x = width - 120, y = height - 120
      ctx.save()
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
      if (av) ctx.drawImage(av, x - r, y - r, r * 2, r * 2)
      ctx.restore()
      ctx.lineWidth = 5
      ctx.strokeStyle = '#19c3ff'
      ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke()
    } catch {}
  }

  return canvas.toBuffer('image/png')
}

export async function sendWelcomeOrBye(conn, { jid, userName = 'Usuario', type = 'welcome', groupName = '', participant }) {
  if (!isWelcomeEnabled(jid)) {
    return null
  }

  let tmpDir = path.join(process.cwd(), 'temp')
  if (!fs.existsSync(tmpDir)) {
    try {
      fs.mkdirSync(tmpDir, { recursive: true })
    } catch (mkdirError) {
      tmpDir = path.join(os.tmpdir(), 'whatsapp-bot-temp')
      try {
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true })
        }
      } catch (altError) {
        tmpDir = process.cwd()
      }
    }
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const normalizeNumberFromJid = (jidOrNum = '') => {
    const raw = String(jidOrNum || '')
    const justJid = raw.includes('@') ? raw.split('@')[0] : raw
    const justNoSuffix = justJid.split(':')[0]
    const onlyDigits = justNoSuffix.replace(/\D+/g, '')
    return onlyDigits
  }

  const BG_IMAGES = [
    'https://iili.io/KIShsKx.md.jpg',
    'https://iili.io/KIShLcQ.md.jpg',
    'https://iili.io/KISwzI1.md.jpg',
    'https://iili.io/KIShPPj.md.jpg',
    'https://iili.io/KISwREJ.md.jpg',
    'https://iili.io/KISw5rv.md.jpg',
    'https://iili.io/KISwY2R.md.jpg',
    'https://iili.io/KISwa7p.md.jpg',
    'https://iili.io/KISwlpI.md.jpg',
    'https://iili.io/KISw1It.md.jpg',
    'https://iili.io/KISwEhX.md.jpg',
    'https://iili.io/KISwGQn.md.jpg',
    'https://iili.io/KISwVBs.md.jpg',
    'https://iili.io/KISwWEG.md.jpg',
    'https://iili.io/KISwX4f.md.jpg'
  ]

  const WELCOME_TITLES = ['Bienvenido', 'Bienvenida', '¡Bienvenid@!', 'Saludos', '¡Hola!', 'Llegada', 'Nuevo miembro', 'Bienvenid@ al grupo', 'Que gusto verte', 'Bienvenido/a']
  const WELCOME_SUBS = [
    'Un placer tenerte aquí',
    'Que la pases bien con nosotros',
    'Esperamos que disfrutes el grupo',
    'Pásala bien y participa',
    'Aquí encontrarás buena onda',
    'Prepárate para la diversión',
    'Bienvenido, esperamos tus aportes',
    'Diviértete y sé respetuos@',
    'Gracias por unirte',
    'La comunidad te da la bienvenida'
  ]

  const BYE_TITLES = ['Adiós', 'Despedida', 'Hasta luego', 'Nos vemos', 'Salida', 'Bye', 'Chao', 'Nos vemos pronto', 'Que te vaya bien', 'Sayonara']
  const BYE_SUBS = [
    'Adiós, nadie te quiso',
    'No vuelvas más, eres feo',
    'Se fue sin dejar rastro',
    'Buena suerte en lo que siga',
    'Hasta nunca',
    'Que te vaya mejor (o no)',
    'Te extrañaremos (no tanto)',
    'Nos veremos en otra vida',
    'Adiós y cuídate',
    'Chao, fue un placer... quizá'
  ]

  const title = type === 'welcome' ? pick(WELCOME_TITLES) : pick(BYE_TITLES)
  const subtitle = type === 'welcome' ? [pick(WELCOME_SUBS)] : [pick(BYE_SUBS)]
  const badgeUrl = ''
  const bgUrl = pick(BG_IMAGES)

  let avatarUrl = ''
  try {
    if (participant) avatarUrl = await conn.profilePictureUrl(participant, 'image')
  } catch {}
  if (!avatarUrl) avatarUrl = 'https://files.catbox.moe/xr2m6u.jpg'

  try {
    const buff = await makeCard({ title, subtitle, avatarUrl, bgUrl, badgeUrl })
    const file = path.join(tmpDir, `${type}-${Date.now()}.png`)
    fs.writeFileSync(file, buff)

    const who = participant || ''
    let realJid = who
    try { if (typeof conn?.decodeJid === 'function') realJid = conn.decodeJid(realJid) } catch {}
    const number = normalizeNumberFromJid(realJid)
    const taguser = number ? `@${number}` : (userName || 'Usuario')

    let meta = null
    try { meta = await conn.groupMetadata(jid) } catch {}
    const totalMembers = Array.isArray(meta?.participants) ? meta.participants.length : 0
    const groupSubject = meta?.subject || groupName || ''
    const tipo = type === 'welcome' ? 'Bienvenid@' : 'Despedida'
    const date = new Date().toLocaleString('es-PE', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    let fkontak = null
    try {
      const res = await fetch('https://i.postimg.cc/rFfVL8Ps/image.jpg')
      const thumb2 = Buffer.from(await res.arrayBuffer())
      fkontak = { 
        key: { 
          participant: '0@s.whatsapp.net', 
          remoteJid: 'status@broadcast', 
          fromMe: false, 
          id: 'Halo' 
        }, 
        message: { 
          locationMessage: { 
            name: `${tipo}`, 
            jpegThumbnail: thumb2 
          } 
        }, 
        participant: '0@s.whatsapp.net' 
      }
    } catch {}

    const productMessage = {
      product: {
        productImage: { url: file },
        productId: '24529689176623820',
        title: `${tipo}, ᴀʜᴏʀᴀ sᴏᴍᴏs ${totalMembers}`,
        description: '',
        currencyCode: 'USD',
        priceAmount1000: '100000',
        retailerId: 1677,
        url: `https://wa.me/${number}`,
        productImageCount: 1
      },
      businessOwnerJid: who || '0@s.whatsapp.net',
      caption: `*❄️ ғᴇʟɪᴢ ɴᴀᴠɪᴅᴀᴅ ʙʙʏ*\n*📚 ɢʀᴜᴘᴏ*: ${groupSubject}\n*👥️ ᴍɪᴇᴍʙʀᴏs*: ${totalMembers}\n*📆 ғᴇᴄʜᴀ*: ${date}`.trim(),
      title: '',
      subtitle: '',
      footer: groupSubject || '',
      interactiveButtons: [
        {
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: '🌷 ᴍᴇɴᴜ-ɴᴀᴋᴀɴᴏ 🌷',
            id: '.menu' 
          })
        }
      ],
      mentions: who ? [who] : []
    }

    const mentionId = who ? [who] : []
    await conn.sendMessage(jid, productMessage, { 
      quoted: fkontak || undefined, 
      contextInfo: { mentionedJid: mentionId } 
    })

    setTimeout(() => {
      try { fs.unlinkSync(file) } catch {}
    }, 60000)

    return file
  } catch (error) {
    console.error(`Error en sendWelcomeOrBye:`, error)
    return null
  }
}

const globalPrefixes = [
  '.', ',', '!', '#', '$', '%', '&', '*',
  '-', '_', '+', '=', '|', '\\', '/', '~',
  '>', '<', '^', '?', ':', ';'
];

const defaultPrefixRegex = /^[.,!#$%&*+\-\-_=<>?/:;~\\|^]/;

const detectPrefix = (text, customPrefix = null) => {
  if (!text || typeof text !== 'string') return null;

  const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

  if (customPrefix) {
    if (customPrefix instanceof RegExp) {
      const match = customPrefix.exec(text);
      return match ? { match, prefix: match[0], regex: customPrefix } : null;
    }

    if (Array.isArray(customPrefix)) {
      for (const prefix of customPrefix) {
        if (prefix instanceof RegExp) {
          const match = prefix.exec(text);
          if (match) return { match, prefix: match[0], regex: prefix };
        } else if (typeof prefix === 'string') {
          const regex = new RegExp('^' + str2Regex(prefix));
          const match = regex.exec(text);
          if (match) return { match, prefix: match[0], regex };
        }
      }
      return null;
    }

    if (typeof customPrefix === 'string') {
      const regex = new RegExp('^' + str2Regex(customPrefix));
      const match = regex.exec(text);
      return match ? { match, prefix: match[0], regex } : null;
    }
  }

  const match = defaultPrefixRegex.exec(text);
  return match ? { match, prefix: match[0], regex: defaultPrefixRegex } : null;
};

const safeReplace = (str, pattern, replacement) => {
  if (typeof str !== 'string') return ''
  return str.replace(pattern, replacement)
}

const normalizeNumber = (num) => {
  if (typeof num === 'number') return num.toString()
  if (typeof num !== 'string') return ''
  return num.replace(/[^0-9]/g, "")
}

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || []
  this.uptime = this.uptime || Date.now()

  if (!chatUpdate) {
    return
  }

  this.pushMessage(chatUpdate.messages).catch(console.error)
  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) {
    return
  }

  if (global.db.data == null) await global.loadDatabase()

  try {
    m = smsg(this, m) || m
    if (!m) {
      return
    }
    m.exp = 0

    try {
      const user = global.db.data.users[m.sender]
      if (typeof user !== "object") global.db.data.users[m.sender] = {}
      if (user) {
        if (!("registered" in user)) user.registered = false
        if (!user.registered) {
          if (!("name" in user)) user.name = m.name
          if (!isNumber(user.age)) user.age = -1
          if (!isNumber(user.regTime)) user.regTime = -1
        }

        if (!("exp" in user) || !isNumber(user.exp)) user.exp = 0
        if (!("coin" in user) || !isNumber(user.coin)) user.coin = 0
        if (!("bank" in user) || !isNumber(user.bank)) user.bank = 0
        if (!("level" in user) || !isNumber(user.level)) user.level = 0
        if (!("health" in user) || !isNumber(user.health)) user.health = 100
        if (!("genre" in user)) user.genre = ""
        if (!("birth" in user)) user.birth = ""
        if (!("marry" in user)) user.marry = ""
        if (!("description" in user)) user.description = ""
        if (!("packstickers" in user)) user.packstickers = null
        if (!("premium" in user)) user.premium = false
        if (!("premiumTime" in user)) user.premiumTime = 0
        if (!("banned" in user)) user.banned = false
        if (!("bannedReason" in user)) user.bannedReason = ""
        if (!("commands" in user) || !isNumber(user.commands)) user.commands = 0
        if (!("afk" in user) || !isNumber(user.afk)) user.afk = -1
        if (!("afkReason" in user)) user.afkReason = ""
        if (!("warn" in user) || !isNumber(user.warn)) user.warn = 0
      } else global.db.data.users[m.sender] = {
        registered: false,
        name: m.name,
        age: -1,
        regTime: -1,
        exp: 0,
        coin: 0,
        bank: 0,
        level: 0,
        health: 100,
        genre: "",
        birth: "",
        marry: "",
        description: "",
        packstickers: null,
        premium: false,
        premiumTime: 0,
        banned: false,
        bannedReason: "",
        commands: 0,
        afk: -1,
        afkReason: "",
        warn: 0
      }

      const chat = global.db.data.chats[m.chat]
      if (typeof chat !== "object") global.db.data.chats[m.chat] = {}
      if (chat) {
        if (!("isBanned" in chat)) chat.isBanned = false
        if (!("isMute" in chat)) chat.isMute = false;
        if (!("welcome" in chat)) chat.welcome = false
        if (!("sWelcome" in chat)) chat.sWelcome = ""
        if (!("sBye" in chat)) chat.sBye = ""
        if (!("detect" in chat)) chat.detect = true
        if (!("primaryBot" in chat)) chat.primaryBot = null
        if (!("modoadmin" in chat)) chat.modoadmin = false
        if (!("antiLink" in chat)) chat.antiLink = true
        if (!("antiArabe" in chat)) chat.antiArabe = false
        if (!("antiArabeRegistros" in chat)) chat.antiArabeRegistros = []
        if (!("nsfw" in chat)) chat.nsfw = false
        if (!("economy" in chat)) chat.economy = true;
        if (!("gacha" in chat)) chat.gacha = true
        // === AÑADIR ROOTOWNER ===
        if (!("rootowner" in chat)) chat.rootowner = false
      } else global.db.data.chats[m.chat] = {
        isBanned: false,
        isMute: false,
        welcome: false,
        sWelcome: "",
        sBye: "",
        detect: true,
        primaryBot: null,
        modoadmin: false,
        antiLink: true,
        antiArabe: false,
        antiArabeRegistros: [],
        nsfw: false,
        economy: true,
        gacha: true,
        // === AÑADIR ROOTOWNER ===
        rootowner: false
      }

      const settings = global.db.data.settings[this.user.jid]
      if (typeof settings !== "object") global.db.data.settings[this.user.jid] = {}
      if (settings) {
        if (!("self" in settings)) settings.self = false
        if (!("jadibotmd" in settings)) settings.jadibotmd = true
      } else global.db.data.settings[this.user.jid] = {
        self: false,
        jadibotmd: true
      }
    } catch (e) {
      console.error(e)
    }

    if (typeof m.text !== "string") m.text = ""
    const user = global.db.data.users[m.sender]

    try {
      const actual = user.name || ""
      const nuevo = m.pushName || await this.getName(m.sender)
      if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) {
        user.name = nuevo
      }
    } catch {}

    const chat = global.db.data.chats[m.chat]
    const settings = global.db.data.settings[this.user.jid]

    // === SISTEMA ROOTOWNER - VERIFICACIÓN INICIAL ===
    // Si rootowner está activado y el usuario NO es el owner, ignorar todos los mensajes
    if (chat?.rootowner && !isROwner) {
      console.log(`🚫 RootOwner activado: Ignorando mensaje de ${m.sender} en ${m.chat}`)
      return // Ignorar completamente el mensaje
    }

    if (m.message && m.key.remoteJid.endsWith('@g.us') && chat?.antiArabe) {
      try {
        console.log(`🔍 Verificando anti-árabe para usuario: ${m.sender}`)
        const fueExpulsado = await verificarAntiArabe(this, m)
        if (fueExpulsado) {
          return
        }
      } catch (error) {
        console.error('Error en sistema anti-árabe:', error)
      }
    }

    // === CORRECCIÓN DE isROwner ===
    const ownerNumbers = global.owner || global.roowner || []
    const isROwner = Array.isArray(ownerNumbers) 
      ? ownerNumbers.some(owner => {
          if (typeof owner === 'string') {
            const cleanOwner = owner.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            return cleanOwner === m.sender
          }
          return false
        })
      : false

    const isOwner = isROwner || m.fromMe

    // === CORRECCIÓN DE isPrems ===
    const premNumbers = global.prems || []
    const isPrems = isROwner || (Array.isArray(premNumbers) 
      ? premNumbers.some(prem => {
          if (typeof prem === 'string') {
            const cleanPrem = prem.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
            return cleanPrem === m.sender
          }
          return false
        })
      : false) || user.premium == true

    const isOwners = [this.user.jid, ...(ownerNumbers || []).map(owner => {
      if (typeof owner === 'string') {
        return owner.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      }
      return ''
    })].includes(m.sender)

    if (opts["queque"] && m.text && !(isPrems)) {
      const queque = this.msgqueque, time = 1000 * 5
      const previousID = queque[queque.length - 1]
      queque.push(m.id || m.key.id)
      setInterval(async function () {
        if (queque.indexOf(previousID) === -1) clearInterval(this)
        await delay(time)
      }, time)
    }

    if (m.isBaileys) return
    m.exp += Math.ceil(Math.random() * 10)
    let usedPrefix

    const ___dirname = path.join(CURRENT_DIR, "./plugins")

    const groupMetadata = m.isGroup ? { 
      ...(conn.chats[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => null) || {}), 
      ...(((conn.chats[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => null) || {}).participants) && { 
        participants: ((conn.chats[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => null) || {}).participants || []).map(p => ({ 
          ...p, 
          id: p.jid, 
          jid: p.jid, 
          lid: p.lid 
        })) 
      }) 
    } : {}

    const participants = ((m.isGroup ? groupMetadata.participants : []) || []).map(participant => ({ 
      id: participant.jid, 
      jid: participant.jid, 
      lid: participant.lid, 
      admin: participant.admin 
    }))

    const userGroup = (m.isGroup ? participants.find((u) => conn.decodeJid(u.jid) === m.sender) : {}) || {}
    const botGroup = (m.isGroup ? participants.find((u) => conn.decodeJid(u.jid) == this.user.jid) : {}) || {}
    const isRAdmin = userGroup?.admin == "superadmin" || false
    const isAdmin = isRAdmin || userGroup?.admin == "admin" || false
    const isBotAdmin = botGroup?.admin || false

    for (const name in global.plugins) {
      const plugin = global.plugins[name]
      if (!plugin) continue
      if (plugin.disabled) continue

      const __filename = join(___dirname, name)

      if (typeof plugin.all === "function") {
        try {
          await plugin.all.call(this, m, {
            chatUpdate,
            __dirname: ___dirname,
            __filename,
            user,
            chat,
            settings
          })
        } catch (err) {
          console.error(err)
        }
      }

      if (!opts["restrict"])
        if (plugin.tags && plugin.tags.includes("admin")) {
          continue
        }

      const pluginPrefix = plugin.customPrefix || globalPrefixes
      const prefixMatch = detectPrefix(m.text, pluginPrefix)

      if (typeof plugin.before === "function") {
        if (await plugin.before.call(this, m, {
          match: prefixMatch ? [prefixMatch.match, prefixMatch.regex] : [],
          conn: this,
          participants,
          groupMetadata,
          userGroup,
          botGroup,
          isROwner,
          isOwner,
          isRAdmin,
          isAdmin,
          isBotAdmin,
          isPrems,
          chatUpdate,
          __dirname: ___dirname,
          __filename,
          user,
          chat,
          settings
        })) {
          continue
        }
      }

      if (typeof plugin !== "function") {
        continue
      }

      if (prefixMatch && (usedPrefix = prefixMatch.prefix)) {
        const noPrefix = m.text.replace(usedPrefix, "")
        let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
        args = args || []
        let _args = noPrefix.trim().split(" ").slice(1)
        let text = _args.join(" ")
        command = (command || "").toLowerCase()
        const fail = plugin.fail || global.dfail
        const isAccept = plugin.command instanceof RegExp ?
          plugin.command.test(command) :
          Array.isArray(plugin.command) ?
            plugin.command.some(cmd => cmd instanceof RegExp ?
              cmd.test(command) : cmd === command) :
            typeof plugin.command === "string" ?
              plugin.command === command : false

        global.comando = command

        if (!isOwners && settings.self) return
        if ((m.id.startsWith("NJX-") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20))) return

        if (global.db.data.chats[m.chat].primaryBot && global.db.data.chats[m.chat].primaryBot !== this.user.jid) {
          const primaryBotConn = global.conns.find(conn => conn.user.jid === global.db.data.chats[m.chat].primaryBot && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED)
          const participants = m.isGroup ? (await this.groupMetadata(m.chat).catch(() => ({ participants: [] }))).participants : []
          const primaryBotInGroup = participants.some(p => p.jid === global.db.data.chats[m.chat].primaryBot)
          if (primaryBotConn && primaryBotInGroup || global.db.data.chats[m.chat].primaryBot === global.conn.user.jid) {
            throw !1
          } else {
            global.db.data.chats[m.chat].primaryBot = null
          }
        } else {
        }

        if (!isAccept) continue
        m.plugin = name

        if (isAccept) { 
          global.db.data.users[m.sender].commands = (global.db.data.users[m.sender].commands || 0) + 1 
        }

        if (chat) {
          const botId = this.user.jid
          const primaryBotId = chat.primaryBot

          if (name !== "group-banchat.js" && chat?.isBanned && !isROwner) {
            if (!primaryBotId || primaryBotId === botId) {
              const aviso = `El bot *${global.botname}* está desactivado en este grupo\n\n> ✦ Un *administrador* puede activarlo con el comando:\n> » *${usedPrefix}bot on*`.trim()
              await m.reply(aviso)
              return
            }
          }

          if (m.text && user.banned && !isROwner) {
            const mensaje = `Estas baneado/a, no puedes usar comandos en este bot!\n\n> ● *Razón ›* ${user.bannedReason}\n\n> ● Si este Bot es cuenta oficial y tienes evidencia que respalde que este mensaje es un error, puedes exponer tu caso con un moderador.`.trim()
            if (!primaryBotId || primaryBotId === botId) {
              m.reply(mensaje)
              return
            }
          }
        }

        if (!isOwners && !m.chat.endsWith('g.us') && !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(m.text)) return

        const adminMode = chat.modoadmin || false
        const wa = plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || pluginPrefix || m.text.slice(0, 1) === pluginPrefix || plugin.command

        if (adminMode && !isOwner && m.isGroup && !isAdmin && wa) return

        if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
          fail("owner", m, this)
          continue
        }

        if (plugin.rowner && !isROwner) {
          fail("rowner", m, this)
          continue
        }

        if (plugin.owner && !isOwner) {
          fail("owner", m, this)
          continue
        }

        if (plugin.premium && !isPrems) {
          fail("premium", m, this)
          continue
        }

        if (plugin.register == true && user.registered == false) {
          fail("unreg", m, this)
          continue
        }

        if (plugin.group && !m.isGroup) {
          fail("group", m, this)
          continue
        } else if (plugin.botAdmin && !isBotAdmin) {
          fail("botAdmin", m, this)
          continue
        } else if (plugin.admin && !isAdmin) {
          fail("admin", m, this)
          continue
        }

        if (plugin.private && m.isGroup) {
          fail("private", m, this)
          continue
        }

        m.isCommand = true
        m.exp += plugin.exp ? parseInt(plugin.exp) : 10

        let extra = {
          match: prefixMatch ? [prefixMatch.match, prefixMatch.regex] : [],
          usedPrefix,
          noPrefix,
          _args,
          args,
          command,
          text,
          conn: this,
          participants,
          groupMetadata,
          userGroup,
          botGroup,
          isROwner,
          isOwner,
          isRAdmin,
          isAdmin,
          isBotAdmin,
          isPrems,
          chatUpdate,
          __dirname: ___dirname,
          __filename,
          user,
          chat,
          settings
        }

        try {
          await plugin.call(this, m, extra)
        } catch (err) {
          m.error = err
          console.error(err)
        } finally {
          if (typeof plugin.after === "function") {
            try {
              await plugin.after.call(this, m, extra)
            } catch (err) {
              console.error(err)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    if (opts["queque"] && m.text) {
      const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
      if (quequeIndex !== -1)
        this.msgqueque.splice(quequeIndex, 1)
    }

    let user, stats = global.db.data.stats
    if (m) {
      if (m.sender && (user = global.db.data.users[m.sender])) {
        user.exp += m.exp
      }
    }

    try {
      if (!opts["noprint"]) await (await import("./lib/print.js")).default(m, this)
    } catch (err) {
      console.warn(err)
      console.log(m.message)
    }
  }
}

let welcomeProcessing = new Set();

let welcomeEventListener = null;

function initWelcomeSystem() {
  if (!global.conn) {
    console.error('❌ global.conn no está definido. No se puede inicializar sistema welcome.');
    return;
  }

  if (welcomeEventListener) {
    global.conn.ev.off('group-participants.update', welcomeEventListener);
  }

  welcomeEventListener = async (update) => {
    try {
      const { id, participants, action } = update;
      const chat = global.db.data.chats?.[id];

      if (!chat || !chat.welcome) return;

      const eventKey = `${id}_${action}_${participants.join('_')}`;

      if (welcomeProcessing.has(eventKey)) {
        return;
      }

      welcomeProcessing.add(eventKey);
      setTimeout(() => {
        welcomeProcessing.delete(eventKey);
      }, 10000);

      for (const participant of participants) {
        try {
          const userKey = `${id}_${action}_${participant}`;
          const cacheKey = `welcome_${userKey}`;

          if (!global.welcomeCache) {
            global.welcomeCache = new Set();
          }

          if (global.welcomeCache.has(cacheKey)) {
            continue;
          }

          global.welcomeCache.add(cacheKey);
          setTimeout(() => {
            if (global.welcomeCache) {
              global.welcomeCache.delete(cacheKey);
            }
          }, 30000);

          if (action === 'add' && chat.antiArabe) {
            const userNumber = participant.split('@')[0];
            const deteccion = detectarNumeroArabe(userNumber);

            if (deteccion.esArabe) {
              console.log(`🚫 Anti-árabe en welcome: ${userNumber} (${deteccion.nombre})`);

              const isAdmin = await isUserAdmin(global.conn, id, participant);
              if (!isAdmin) {
                await global.conn.groupParticipantsUpdate(id, [participant], 'remove');

                if (!chat.antiArabeRegistros) chat.antiArabeRegistros = [];
                chat.antiArabeRegistros.push({
                  usuario: participant,
                  numero: userNumber,
                  pais: deteccion.nombre,
                  fecha: new Date().toISOString(),
                  motivo: 'anti-arabe-welcome'
                });

                await global.conn.sendMessage(id, {
                  text: `╭─「 🚫 *ANTI-ÁRABE ACTIVADO* 🚫 」
│ 
│ ⚠️ *Usuario Árabe Expulsado al Entrar*
│ 
│ 📋 *Información:*
│ ├ 🔢 Número: ${userNumber}
│ ├ 🌍 País: ${deteccion.nombre}
│ └ 🍃 Acción: Expulsado automáticamente
│ 
│ ⚙️ *Sistema activo:*
│ ├ Anti-Árabe: ✅ ACTIVADO
│ └ Bloqueo: Entrada + Mensajes
╰─◉`.trim()
                });
                continue;
              }
            }
          }

          if (action === 'add') {
            await sendWelcomeOrBye(global.conn, {
              jid: id,
              participant,
              type: 'welcome'
            });
          } else if (action === 'remove') {
            await sendWelcomeOrBye(global.conn, {
              jid: id,
              participant,
              type: 'bye'
            });
          }

        } catch (error) {
          console.error(`Error procesando ${action} para ${participant}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error en sistema welcome:', error);
    }
  };

  global.conn.ev.on('group-participants.update', welcomeEventListener);
  console.log('✅ Sistema welcome inicializado correctamente');
}

setTimeout(() => {
  initWelcomeSystem();
}, 5000);

global.dfail = (type, m, conn) => {
  let edadaleatoria = ['10', '28', '20', '40', '18', '21', '15', '11', '9', '17', '25'][Math.floor(Math.random() * 11)]
  let user2 = m.pushName || 'Anónimo'
  let verifyaleatorio = ['registrar', 'reg', 'verificar', 'verify', 'register'][Math.floor(Math.random() * 5)]

  const msg = {
    rowner: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ ᥣ᥆ ⍴ᥙᥱძᥱ ᥙ𝗍іᥣіzᥲr ᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆ ძᥱᥣ ᑲ᥆𝗍.`',
    owner: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙsᥲr ⍴᥆r ᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆ ძᥱᥣ ᑲ᥆𝗍.`',
    mods: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙsᥲr ⍴᥆r ᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆ ძᥱᥣ ᑲ᥆𝗍.`',
    premium: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙ𝗍іᥣіzᥲr ⍴᥆r ᥙsᥙᥲrі᥆s ⍴rᥱmіᥙm, ᥡ ⍴ᥲrᥲ mі ᥴrᥱᥲძ᥆r.`',
    group: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙsᥲr ᥱᥒ grᥙ⍴᥆s.`',
    private: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙsᥲr ᥲᥴ һᥲ𝗍 ⍴rі᥎ᥲძ᥆ ძᥱᥣ ᑲ᥆𝗍.`',
    admin: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ ᥱs ⍴ᥲrᥲ ᥲძmіᥒs ძᥱᥣ grᥙ⍴᥆.`',
    botAdmin: '> `ⓘ ⍴ᥲrᥲ ⍴᥆ძᥱr ᥙsᥲr ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ ᥱs ᥒᥱᥴᥱsᥲrі᥆ 𝗊ᥙᥱ ᥡ᥆ sᥱᥲ ᥲძmіᥒ.`',
    unreg: `> \`ⓘ ᥒᥱᥴᥱsі𝗍ᥲs ᥱs𝗍ᥲr rᥱgіs𝗍rᥲძ᥆(ᥲ) ⍴ᥲrᥲ ᥙsᥲr ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆, ᥱsᥴrіᑲᥱ #rᥱg ⍴ᥲrᥲ rᥱgіs𝗍rᥲr𝗍ᥱ.\``,
    restrict: '> `ⓘ ᥴ᥆mᥲᥒძ᥆ rᥱs𝗍rіᥒgіძ᥆ ⍴᥆r ძᥱᥴіsі᥆ᥒ ძᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆ ძᥱᥣ ᑲ᥆𝗍.`'
  }[type];

  if (msg) return conn.reply(m.chat, msg, m).then(_ => m.react('✖️'))
}

global.sendWelcomeOrBye = sendWelcomeOrBye
global.isWelcomeEnabled = isWelcomeEnabled
global.setWelcomeState = setWelcomeState
global.makeCard = makeCard
global.detectarNumeroArabe = detectarNumeroArabe
global.verificarAntiArabe = verificarAntiArabe
global.isUserAdmin = isUserAdmin
global.paisesArabesCompletos = paisesArabesCompletos
global.initWelcomeSystem = initWelcomeSystem

let file = global.__filename(import.meta.url, true)
if (typeof file === 'function') {
  file = CURRENT_DIR;
}
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.magenta("Se actualizó 'handler.js'"))
  if (global.reloadHandler) console.log(await global.reloadHandler())
})

export default { 
  handler, 
  makeCard, 
  sendWelcomeOrBye, 
  isWelcomeEnabled, 
  setWelcomeState,
  loadWelcomeState,
  saveWelcomeState,
  detectarNumeroArabe,
  verificarAntiArabe,
  isUserAdmin,
  initWelcomeSystem
}