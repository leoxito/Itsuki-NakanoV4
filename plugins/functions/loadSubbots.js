const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const qrcode = require("qrcode");
const nodeCache = require("node-cache");
const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");

if (!global.sylphs) global.sylphs = [];

function setHandler(conn, sylph) {
  const handler = require("../../handler");
  conn.ev.on("messages.upsert", async (mek) => {
    try {
      const m = mek.messages[0];
      if (!m.message || m.key.remoteJid === "status@broadcast") return;
      await handler(conn, m);
    } catch (e) {
      console.error(chalk.white.bgRed(" ERROR "), "al manejar mensaje:", e);
    }
  });
  conn.ev.on("creds.update", conn.saveCreds);
}

async function loadSubbots() {
  const MAX_SUBBOTS = 100;
  const basePath = path.join(__dirname, "../../Sesiones/Subbots");

  const folders = fs.readdirSync(basePath);
  for (const folder of folders) {
    if (global.sylphs.length >= MAX_SUBBOTS) {
      console.log(chalk.cyan(`☕ Límite de ${MAX_SUBBOTS} subbots alcanzado.`));
      break;
    }

    const sessionPath = path.join(basePath, folder);
    if (!fs.statSync(sessionPath).isDirectory()) continue;

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const msgRetry = () => {};
    const cache = new nodeCache();

    const config = {
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
      },
      printQRInTerminal: false,
      browser: Browsers.macOS("SubBot"),
      logger: pino({ level: "silent" }),
      msgRetry,
      msgRetryCache: cache,
      syncFullHistory: true,
      getMessage: async () => ({ conversation: "Subbot" })
    };

    let conn = makeWASocket(config);
    conn.id = folder;
    conn.saveCreds = saveCreds;
    setHandler(conn);

    conn.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        conn.uptime = new Date();
        conn.connection = "open";
        global.sylphs = global.sylphs.filter(c => c.id !== conn.id);
        global.sylphs.push(conn);
       // console.log(chalk.white.bgGreen(" INFO "), `Subbot ${conn.id} reconectado.`);
      }

      if (connection === "close") {
        conn.connection = "close";
        global.sylphs = global.sylphs.filter(c => c.id !== conn.id);

        const reason = (lastDisconnect?.error instanceof Boom && lastDisconnect.error.output.statusCode)
          ? lastDisconnect.error.output.statusCode
          : null;

        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          console.log(chalk.white.bgBlue(" INFO "), `Reintentando conexión del subbot ${conn.id}...`);
          try { conn.end?.(); } catch {}
          loadSubbots();
        } else {
          console.log(chalk.white.bgRed(" INFO "), `Sesión cerrada para ${conn.id}, eliminando carpeta.`);
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log(chalk.white.bgGreen(" INFO "), `Sesión de ${conn.id} eliminada.`);
          } catch (err) {
            console.error(chalk.white.bgRed(" ERROR "), `eliminando carpeta para ${conn.id}:`, err);
          }
        }
      }
    });
  }

  console.log(chalk.yellow(`🌿 Se reconectaron ${global.sylphs.length} subbots.`));
}

module.exports = { loadSubbots }