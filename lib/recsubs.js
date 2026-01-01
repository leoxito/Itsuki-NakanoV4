const path = require('path');
const fs = require('fs');
const pino = require('pino');
const chalk = require('chalk');
const nodeCache = require('node-cache');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

global.sylphs = global.sylphs || [];

function setHandler(conn) {
  const handler = require('../handler');
  conn.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages[0];
      if (!m.message || m.key.remoteJid === 'status@broadcast') return;
      await handler(conn, m);
    } catch (e) {
      console.error(chalk.white.bgRed('❌️ ERROR SUBBOT '), e);
    }
  });
  conn.ev.on('creds.update', conn.saveCreds);
}

async function startSubbot(userName, sessionPath) {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Ubuntu', 'Chrome', '110.0.5585.95'],
    syncFullHistory: true
  })

  conn.id = userName;
  conn.saveCreds = saveCreds;

  conn.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode || 0;
      if (code !== DisconnectReason.loggedOut) {
        await startSubbot(userName, sessionPath);
      } else {
        global.sylphs = global.sylphs.filter(c => c.id !== userName);
      }
    } else if (connection === 'open') {
      conn.connection = "open";
      conn.uptime = new Date();
      await getSettings(userName + "@s.whatsapp.net");
      conn.settings = await getSettings(userName + "@s.whatsapp.net");
      global.sylphs = global.sylphs.filter(c => c.id !== userName);
      global.sylphs.push(conn);
      setHandler(conn);
 await joinCh(conn)
    }
  });
  conn.ev.on('group-participants.update', async (update) => {
  try {
    const chat = await global.getChat(update.id);
    if (!chat?.welcome || chat.welcome !== 1) return;

    const groupId = update.id;
    const participants = update.participants;
    const action = update.action;

    if (action === 'add') {
      for (const userId of participants) {
        const username = userId.split('@')[0];
        const pp = await conn.profilePictureUrl(userId, 'image').catch(() => "https://i.imgur.com/sVyX6PM.jpeg");
        const welcomeMsg = `👋 Hola @${username}, bienvenido al grupo!`;
        await conn.sendMessage(groupId, {
          image: pp ? { url: pp } : undefined,
          caption: welcomeMsg,
          mentions: [userId]
        });
      }
    }

    if (action === 'remove') {
      for (const userId of participants) {
        const username = userId.split('@')[0];
        const pp = await conn.profilePictureUrl(userId, 'image').catch(() => "https://i.imgur.com/ntDvs0k.jpeg");
        const byeMsg = `👋 Adiós @${username}, te extrañaremos!`;
        await conn.sendMessage(groupId, {
          image: pp ? { url: pp } : undefined,
          caption: byeMsg,
          mentions: [userId]
        });
      }
    }
  } catch (error) {
    console.error('Error en evento group-participants.update:', error);
  }
});
}

async function recsubs() {
  const basePath = path.join(__dirname, '../Sesiones/Subbots');
  if (!fs.existsSync(basePath)) return;

  const subbotFolders = fs.readdirSync(basePath).filter(folder => {
    const credsPath = path.join(basePath, folder, 'creds.json');
    return fs.existsSync(credsPath);
  });

  const total = subbotFolders.length;
  let conectados = 0;
  let eliminados = 0;

  for (const folder of subbotFolders) {
    const yaActivo = global.sylphs.find(c => c.id === folder && c.connection === 'open');
    if (yaActivo) continue;

    try {
      const sessionPath = path.join(basePath, folder);
      await startSubbot(folder, sessionPath);
      conectados++;
    } catch {
      const sessionPath = path.join(basePath, folder);
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        eliminados++;
      } catch {}
    }
  }

  const INFO = chalk.white.bgBlue(' INFO ');
  const CON = chalk.black.bgGreen(String(conectados));
  const TOTAL = chalk.red.bgWhite(String(total));
  const DEL = chalk.white.bgRed(String(eliminados));
  console.log(`${INFO} : ✅️ Se han conectado correctamente  ${CON} de ${TOTAL} subbots.`);
  console.log(`${INFO} : 🗑 Se han eliminado ${DEL} carpetas de subbots corruptos. 📂`);
}

async function joinCh(conn) {
  await conn.newsletterFollow("120363183614708156@newsletter");
}

module.exports = { recsubs };