const groupCache = new Map();
const chalk = require('chalk');
const NodeCache = require('node-cache');
const logCache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

module.exports = async function sylphyLogs(ms, sylph) {
  try {
    const messageID = ms.key?.id || ms.id;
    if (!messageID) return;
    if (logCache.has(messageID)) return;
    logCache.set(messageID, true);
    const user = ms.pushName || 'Sin nombre';
    const sender = ms.sender || 'Desconocido';
    const isGroup = ms.isGroup;
    const body = ms.body || '';
    let chatName = 'Chat Privado';
    if (isGroup) {
      if (!groupCache.has(ms.from)) {
        try {
          const metadata = await sylph.groupMetadata(ms.from);
          groupCache.set(ms.from, metadata.subject);
          setTimeout(() => groupCache.delete(ms.from), 5 * 60_000);
        } catch {
          chatName = 'Grupo desconocido';
        }
      }
      chatName = groupCache.get(ms.from);
    }
    const prefixes = ['.', '!', '#', '>'];
    const isCommand = prefixes.some(p => body.startsWith(p));
    let formattedBody;
    if (isCommand) {
      const firstSpace = body.indexOf(' ');
      const cmd = firstSpace === -1 ? body : body.slice(0, firstSpace);
      const rest = firstSpace === -1 ? '' : body.slice(firstSpace);
      formattedBody = chalk.yellow(cmd) + chalk.cyanBright(rest);
    } else {
      formattedBody = chalk.gray(body.length > 0 ? body : '(mensaje vacío)');
    }
    console.log(
      chalk.bgGreen.black(' 𝐈 𝐓 𝐒 𝐔 𝐊 𝐈 - 𝐂 𝐎 𝐍 𝐒 𝐎 𝐋 ') + '\n' +
      chalk.green(' 👤 Usuario : ') + chalk.whiteBright(user) + '\n' +
      chalk.green(' 🆔 JID     : ') + chalk.whiteBright(sender) + '\n' +
      chalk.green(' 💬 Chat    : ') + chalk.whiteBright(chatName) + '\n' +
      chalk.green(' 📥 Message : ') + formattedBody + '\n'
    );
  } catch (e) {
    console.error(chalk.bgRed.white(' 𝐄 𝐑 𝐑 𝐎 𝐑  '), chalk.red(e.message));
  }
};