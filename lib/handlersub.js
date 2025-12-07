import pkg from '@whiskeysockets/baileys'
const { 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion, 
  Browsers, 
  DisconnectReason, 
  generateWAMessageFromContent, 
  proto, 
  prepareWAMessageMedia,
  jidNormalizedUser
} = pkg
import pino from "pino";
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'

// ⚠️ AJUSTE DE RUTA: './simple.js' porque ambos están en la carpeta 'lib'
import { protoType, serialize, makeWASocket } from './simple.js' 

// Importar el handler principal (debe estar en la raíz, un nivel arriba de /lib)
let mainHandler
try {
  // ⚠️ AJUSTE DE RUTA: '../handler.js' para subir al directorio raíz y encontrar handler.js
  ({ handler: mainHandler } = await import('../handler.js')) 
} catch (e) {
  console.error('[SUBBOT] Error importando handler principal. Asegúrate de que handler.js exista y exporte la función "handler".', e.message || e)
}

// Global para mantener el estado de los sub-bots 
if (!global.subbots) global.subbots = []

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 15000;

/**
 * Genera el mensaje interactivo con el código de emparejamiento.
 * @param {import('@whiskeysockets/baileys').WASocket} conn - Conexión del bot principal.
 * @param {object} m - Objeto de mensaje original.
 * @param {string} rawCode - Código de emparejamiento generado.
 */
async function sendPairingCodeMessage(conn, m, rawCode) {
    try {
        const imageUrl = 'https://cdn.russellxz.click/73109d7e.jpg' // URL de tu imagen de banner
        const media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: conn.waUploadToServer })

        const header = proto.Message.InteractiveMessage.Header.fromObject({
          hasMediaAttachment: true,
          imageMessage: media.imageMessage
        })

        const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
          header,
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: `> *❀ OPCIÓN-CODIGO ❀*
  
𓂃 ࣪ ִֶָ☾.  
> 1. 📲 *WhatsApp → Ajustes* > 2. ⛓️‍💥 *Dispositivos vinculados* > 3. 🔐 *Toca vincular* > 4. ✨ Copia este código:
  
> ˗ˏˋ ꕤ  ${rawCode.match(/.{1,4}/g)?.join(' ⸰ ')}  ꕤ ˎˊ˗
  
> ⌛ ⋮ *10 segundos de magia* > 🍒 ࣪𓂃 *¡Consejito dale rapidito!* ˚₊‧꒰ა ♡ ໒꒱ ‧₊˚`
          }),
          footer: proto.Message.InteractiveMessage.Footer.fromObject({
            text: "ᴄᴏᴘɪᴀ ᴇʟ ᴄᴏᴅɪɢᴏ ᴀǫᴜɪ ᴀʙᴀᴊᴏ 🌺"
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({ display_text: "𝗖𝗼𝗽𝗶𝗮 𝗘𝗹 𝗖𝗼𝗱𝗶𝗴𝗼 📋", copy_code: rawCode })
              },
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({ display_text: "𝗖𝗮𝗻𝗮𝗹 𝗢𝗳𝗶𝗰𝗮𝗹 🌷", url: "https://whatsapp.com/channel/0029VbBvZH5LNSa4ovSSbQ2N" })
              }
            ]
          })
        })

        const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { userJid: conn.user.jid, quoted: m })
        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

    } catch (e) {
        console.error('Error al generar o enviar mensaje interactivo:', e);
        await conn.reply(m.chat, `> *[❌ ERROR DE ENLACE]*\n> No se pudo generar el mensaje interactivo. Tu código es: *${rawCode}*`, m);
    }
}

/**
 * Inicia o reconecta una sesión de Sub-Bot con auto-reconexión y contador de intentos.
 * @param {string} userName - Nombre de usuario (nombre de la carpeta de sesión, ej: '57300xxxx').
 * @param {import('@whiskeysockets/baileys').WASocket} conn - Conexión del bot principal.
 * @param {object | null} m - Mensaje del chat si es un comando (es null en la auto-reconexión).
 * @param {number} [attempt=1] - Contador de intentos de reconexión.
 */
export const startSubBot = async (userName, conn, m, attempt = 1) => {
  const folder = path.join('Sessions/SubBot', userName)

  if (attempt > MAX_RECONNECT_ATTEMPTS) {
      const errBox = `\n╭─────────────────────────────◉\n│ ${chalk.white.bgRed.bold('   ❌ CONEXIÓN SUB-BOT FALLIDA   ')}\n│ 「 🤖 」${chalk.yellow(`Sesión: ${userName}`)}\n│ 「 ⚠️ 」${chalk.white(`Máximo de ${MAX_RECONNECT_ATTEMPTS} intentos alcanzado. Deteniendo.`)}\n╰─────────────────────────────◉\n`
      console.error(errBox)
      if (m) conn.reply(m.chat, `*❌ ERROR: Máximo de intentos de conexión (${MAX_RECONNECT_ATTEMPTS}) alcanzado para el Sub-Bot: ${userName}.*`, m);
      return
  }

  // Comprobar si ya existe una conexión abierta para este usuario
  const existing = global.subbots.find(c => c.id === userName && c.connection === 'open')
  if (existing) {
      if (m) conn.reply(m.chat, `*🤖 Ya eres Sub-Bot de Itsuki, sesión activa: ${userName}*`, m);
      return
  }

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

  // Reacción inicial solo si es un comando (m no es null)
  if (m) await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
  if (m) await conn.sendPresenceUpdate('composing', m.chat)

  try {
    const { state, saveCreds } = await useMultiFileAuthState(folder)
    const { version } = await fetchLatestBaileysVersion()
    
    // Obtener el número del usuario que ejecuta el comando o el nombre de la sesión
    let number = userName;
    if (m) {
        // Si viene de un comando, usar el número del sender (sin @s.whatsapp.net)
        number = m.sender.split('@')[0];
    }

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false,
      keepAliveIntervalMs: 30000, 
      getMessage: async key => ({ conversation: 'keepalive' }) 
    })

    sock.id = userName
    sock.saveCreds = saveCreds
    sock.connection = 'connecting'
    sock.reconnectAttempt = attempt // Guardar el intento actual

    // Inicializar funciones esenciales
    try { protoType(); serialize() } catch (e) { console.log(e) }

    // Vincular el handler principal a esta nueva conexión (sub-bot)
    if (mainHandler) {
      sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
          // El 'call(sock, chatUpdate)' hace que 'this' dentro del handler sea el 'sock' del sub-bot
          await mainHandler.call(sock, chatUpdate) 
        } catch (e) {
          console.error(`Error en handler subbot (${userName}):`, e)
        }
      })
    }

    sock.ev.on('creds.update', saveCreds)

    // Lógica de conexión y auto-reconexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update
      
      if (connection === 'open') {
        sock.__sessionOpenAt = Date.now()
        sock.connection = 'open'
        sock.uptime = new Date()

        // Añadir/Actualizar a la lista global
        global.subbots = global.subbots.filter(c => c.id !== userName)
        global.subbots.push(sock)

        if (m) {
          await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          await conn.reply(m.chat, `> [🌱] 𝙎𝙪𝙗-𝙗𝙤𝙩 𝘾𝙤𝙣𝙚𝙘𝙩𝙖𝙙𝙤 𝙀𝙭𝙞𝙩𝙤𝙨𝙖𝙢𝙚𝙣𝙩𝙚. Sesión: ${userName}`, m)
        } else {
             const successLog = `\n╭─────────────────────────────◉\n│ ${chalk.black.bgGreenBright.bold('     ✅ SUB-BOT RECONECTADO     ')}\n│ 「 🤖 」${chalk.yellow(`Sesión: ${userName}`)}\n│ 「 🟢 」${chalk.white(`Estado: ACTIVO | Intento: ${attempt}`)}\n╰─────────────────────────────◉\n`
             console.log(successLog)
        }
      }

      if (connection === 'close') {
        global.subbots = global.subbots.filter(c => c.id !== userName)
        const reason = lastDisconnect?.error?.output?.statusCode || 0

        // 🛑 Borrado de sesión si se desvincula manualmente
        if (reason === DisconnectReason.loggedOut) {
          fs.rmSync(folder, { recursive: true, force: true })
          if(m) return conn.reply(m.chat, `> [🔴] 𝐒𝐄𝐒𝐈Ó𝐍 𝐄𝐋𝐈𝐌𝐈𝐍𝐀𝐃𝐀 𝐏𝐎𝐑 𝐃𝐄𝐒𝐕𝐈𝐍𝐂𝐔𝐋𝐀𝐂𝐈Ó𝐍 𝐌𝐀𝐍𝐔𝐀𝐋.`, m)
          return
        }
        
        // 🔁 Intentar reconexión si no es loggedOut y no excedemos el límite
        const nextAttempt = attempt + 1
        
        if (nextAttempt <= MAX_RECONNECT_ATTEMPTS) {
            if (m) {
                await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } })
                conn.reply(m.chat, `> [🔴] 𝐂𝐎𝐍𝐄𝐗𝐈Ó𝐍 𝐂𝐄𝐑𝐑𝐀𝐃𝐀 (Razón: ${reason}). 𝐑𝐞𝐜𝐨𝐧𝐞𝐜𝐭𝐚𝐧𝐝𝐨 𝐞𝐧 ${RECONNECT_DELAY_MS / 1000}𝐬 (Intento ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS}).`, m)
            } else {
                console.log(chalk.red(`[SUBBOT] Sesión ${userName} cerrada (Razón: ${reason}). Reconectando en ${RECONNECT_DELAY_MS / 1000}s (Intento ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS}).`))
            }
            
            setTimeout(() => {
                startSubBot(userName, conn, m, nextAttempt) 
            }, RECONNECT_DELAY_MS)
        } else {
            // Si excede el límite
            if (m) conn.reply(m.chat, `*❌ ERROR: El Sub-Bot ${userName} falló tras ${MAX_RECONNECT_ATTEMPTS} intentos.*`, m);
        }
      }
    })

    // Lógica de generación de pairing code (solo si no está registrado y es la primera llamada (m != null))
    if (!state.creds?.registered && m) {
      await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

      setTimeout(async () => {
        try {
            // Asegúrate de que 'number' contiene el número limpio (ej: 57300xxxx)
            const rawCode = await sock.requestPairingCode(number)
            await conn.sendMessage(m.chat, { react: { text: '✅️', key: m.key } })
            
            await sendPairingCodeMessage(conn, m, rawCode)

          } catch (err) {
            console.error('Error al obtener pairing code:', err)
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            await conn.reply(m.chat, `*⚙️ Error al generar código de emparejamiento: ${err.message}*`, m)
          }
        }, 3000)
    }

  } catch (error) {
    console.error(`Error al crear socket para ${userName}:`, error)
    if (m) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        await conn.reply(m.chat, `*Error crítico al iniciar el Sub-Bot*: ${error.message}`, m)
    }
  }
}

export { startSubBot }
