// ==============================================
// 🌸 Itsuki Nakano Wabot V4 🌸
// ==============================================
// 🤖 Creado por: FzTeis
// 🎨 Adaptado para: Itsuki Nakano IA V4
// 👨‍💻 Usado por: leoxitoDev.xyz
// 🔧 Base: Baileys (@whiskeysockets/baileys = "npm:wileys")
// ⚡ Versión: ^NewUpdate | V4
// ==============================================

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const NodeCache = require('node-cache');
const database = require('./lib/database');
const { recsubs } = require("./lib/recsubs");
const sessionPath = path.join(__dirname, 'Sesion');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const minReconnectDelay = 20000;
const maxReconnectDelay = 20000;

const msgRetryCounterCache = new NodeCache();
const msgRetryCounterMap = {};

let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

recsubs();
setInterval(recsubs, 120_000);

const processedMessages = new NodeCache({ stdTTL: 10 });
const ppCache = new NodeCache({ stdTTL: 300 });

async function connectToWhatsApp() {
  global.db = await database.init();
  global.getUser = database.getUser;
  global.updateUser = database.updateUser;
  global.getChat = database.getChat;
  global.updateChat = database.updateChat;
  global.getSettings = database.getSettings;
  global.updateSettings = database.updateSettings;

  const handler = require('./handler');
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const filterStrings = [
    "Q2xvc2luZyBzdGFsZSBvcGVu",
    "Q2xvc2luZyBvcGVuIHNlc3Npb24=",
    "RmFpbGVkIHRvIGRlY3J5cHQ=",
    "U2Vzc2lvbiBlcnJvcg==",
    "RXJyb3I6IEJhZCBNQUM=",
    "RGVjcnlwdGVkIG1lc3NhZ2U="
  ];

  console.info = () => {};
  console.debug = () => {};
  ['log', 'warn', 'error'].forEach(methodName => RCM(methodName, filterStrings));

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    mobile: false,
    browser: Browsers.ubuntu('Opera'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    msgRetryCounterCache,
    msgRetryCounterMap,
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') {
      console.log(chalk.bgGreen.black(' ✐ INICIANDO CONEXIÓN... '));
    } else if (connection === 'open') {
      reconnectAttempts = 0;
      console.log(chalk.bgGreen.white(' ✅ ¡Sesión establecida correctamente con WhatsApp! '));
      console.log(chalk.bgMagenta.white(` 🌸 Itsuki Nakano Wabot V4 - ^NewUpdate | V4 `));
      console.log(chalk.magenta(` 🛠️ Base: @whiskeysockets/baileys = "npm:wileys"`));
      global.sylph = sock;
      rl.close();
    } else if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect.error)?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        console.log(chalk.bgRed.white(' 📌 Conexión perdida: Credenciales no válidas. Borre la carpeta de sesión. '));
        process.exit(1);
      } else {
        reconnectAttempts++;
        if (reconnectAttempts >= maxReconnectAttempts) {
          console.log(chalk.bgRed.white(' 🔴 Demasiados intentos de reconexión. Intenta más tarde.'));
          process.exit(1);
        }
        const reconnectDelay = Math.floor(Math.random() * (maxReconnectDelay - minReconnectDelay + 1)) + minReconnectDelay;
        console.log(chalk.bgCyan.black(` 🔄 Conexión perdida. Reintentando en ${reconnectDelay / 1000} segundos... `));
        setTimeout(connectToWhatsApp, reconnectDelay);
      }
    }
  });

sock.ev.on('group-participants.update', (update) => {
  setImmediate(async () => {
    try {
      const chat = await global.getChat(update.id).catch(() => null);
      if (!chat?.welcome) return;
      const { id: groupId, participants, action } = update;
      const messages = {
        add: '👋 Hola @{}, bienvenido al grupo!',
        remove: '👋 Adiós @{}, te extrañaremos!'
      };     
      const messageTemplate = messages[action];
      if (!messageTemplate) return;
      await Promise.allSettled(participants.map(async (userId) => {
        const username = userId.split('@')[0];
        const message = messageTemplate.replace('@{}', `@${username}`);

        await sock.sendMessage(groupId, {
          text: message,
          mentions: [userId]
        }).catch(() => {});
      }));      
    } catch (error) {
    }
  });
});

  if (process.stdin.isTTY && !sock.authState.creds.registered) {
    console.log(chalk.bgYellow.black(' ❌ No se encontró sesión activa. '));
    const phoneNumber = await question(chalk.green(' ✐ Introduce el número de teléfono: '));
    const pairingCode = await sock.requestPairingCode(phoneNumber.trim());
    console.log(chalk.bgBlue.white(` 🔐 Código de emparejamiento: ${pairingCode} `));
    console.log(chalk.magenta(` 🌸 Itsuki Nakano Wabot V4 - ^NewUpdate | V4 `));
  }

  sock.ev.on('messages.upsert', async (mek) => {
    try {
      for (const m of mek.messages) {
        if (!m.message || m.key.remoteJid === 'status@broadcast') continue;
        if (processedMessages.has(m.key.id)) continue;
        processedMessages.set(m.key.id, true);
        await handler(sock, m);
      }
    } catch (e) {
      console.error(chalk.bgRed.white('📌 Error al manejar mensaje: '), e);
    }
  });

  return sock;
}

async function getProfilePic(sock, userId) {
  let pp = ppCache.get(userId);
  if (!pp) {
    pp = await sock.profilePictureUrl(userId, 'image').catch(() => "https://i.imgur.com/sVyX6PM.jpeg");
    ppCache.set(userId, pp);
  }
  return pp;
}

function RCM(method, filters) {
  const original = console[method];
  console[method] = function (...args) {
    if (typeof args[0] === 'string') {
      for (let filtro of filters) {
        if (args[0].includes(filtro)) return;
      }
    }
    original.apply(console, args);
  };
}

connectToWhatsApp().catch((err) => {
  console.error(chalk.bgRed.white('✖️ Error al iniciar el bot: '), err);
});