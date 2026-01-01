// ==============================================
// 🌸 Itsuki Nakano Wabot V4 🌸
// ==============================================
// 🤖 Handler System
// 🎨 Adaptado para: Itsuki Nakano IA V4
// 👨‍💻 Usado por: leoxitoDev.xyz
// 🔧 Base: Baileys (@whiskeysockets/baileys = "npm:wileys")
// ⚡ Versión: ^NewUpdate | V4
// ==============================================

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const config = require('./config');
//const settings = require('./settings')
const { serialize } = require('./lib/serialize');
const sylphyLogs = require('./lib/sylphyLog');
const NodeCache = require('node-cache');

const plugins = new Map();
const pluginDir = path.join(__dirname, 'plugins');

const cmdIndex = new Map();
const aliasIndex = new Map();
const customIdx = new Map();

const gcCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const setCache = new NodeCache({ stdTTL: 300 });
const respCache = new NodeCache({ stdTTL: 3600 });

class CmdQueue {
  constructor(max = 3) {
    this.queue = [];
    this.running = new Set();
    this.max = max;
  }

  async add(task) {
    return new Promise((res, rej) => {
      this.queue.push({ task, res, rej });
      this.run();
    });
  }

  async run() {
    if (this.running.size >= this.max || this.queue.length === 0) return;

    const { task, res, rej } = this.queue.shift();
    this.running.add(task);

    try {
      const result = await task();
      res(result);
    } catch (err) {
      rej(err);
    } finally {
      this.running.delete(task);
      this.run();
    }
  }
}

const cmdQueue = new CmdQueue(3);

async function loadPlugin(pPath) {
  delete require.cache[require.resolve(pPath)];

  if (require.main && process.versions.node >= '14.0.0') {
    try {
      const mod = await import(`file://${pPath}`);
      return mod.default || mod;
    } catch {
      return require(pPath);
    }
  }

  return require(pPath);
}

function regPlugin(p, file) {
  const cmds = Array.isArray(p.command) ? p.command : [p.command];

  cmds.forEach(cmd => {
    if (cmd) {
      const key = cmd.toLowerCase();
      plugins.set(key, p);
      cmdIndex.set(key, p);
    }
  });

  if (p.customPrefix) {
    const prefixes = Array.isArray(p.customPrefix) ? p.customPrefix : [p.customPrefix];
    prefixes.forEach(prefix => {
      if (prefix) {
        const key = prefix.toLowerCase();
        plugins.set(key, p);
        customIdx.set(key, p);
      }
    });
  }

  if (p.help) {
    const helps = Array.isArray(p.help) ? p.help : [p.help];
    helps.forEach(h => {
      if (h) aliasIndex.set(h.toLowerCase(), cmds[0]?.toLowerCase());
    });
  }
}

async function loadPlugins() {
  plugins.clear();
  cmdIndex.clear();
  aliasIndex.clear();
  customIdx.clear();

  const cats = await fs.readdir(pluginDir, { withFileTypes: true });

  for (const cat of cats) {
    if (!cat.isDirectory()) continue;

    const catPath = path.join(pluginDir, cat.name);
    const files = await fs.readdir(catPath);

    for (const file of files) {
      if (!file.endsWith('.js')) continue;

      try {
        const pPath = path.join(catPath, file);
        const plugin = await loadPlugin(pPath);
        regPlugin(plugin, file);
      } catch (e) {
        console.error(`❌ Error plugin ${file}:`, e.message);
      }
    }
  }
}

loadPlugins();

chokidar.watch(pluginDir, { ignoreInitial: true })
  .on('add', loadPlugins)
  .on('change', async file => {
    const fPath = path.resolve(file);
    try {
      delete require.cache[require.resolve(fPath)];
      const plugin = await loadPlugin(fPath);
      const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];

      cmds.forEach(cmd => {
        if (cmd) plugins.set(cmd.toLowerCase(), plugin);
      });

      console.log('🔁 Plugin reload:', path.basename(file));
    } catch (e) {
      console.error('❌ Reload error:', e.message);
    }
  })
  .on('unlink', file => {
    const fPath = path.resolve(file);
    delete require.cache[require.resolve(fPath)];

    for (const [cmd, p] of plugins.entries()) {
      if (fPath.includes(p?.help?.[0])) plugins.delete(cmd);
    }
  });

async function getGC(jid, sylph, force = false) {
  if (!force) {
    const cached = gcCache.get(jid);
    if (cached) return cached;
  }

  try {
    const meta = await sylph.groupMetadata(jid);
    const lightMeta = {
      id: meta.id,
      subject: meta.subject,
      participants: meta.participants?.map(p => ({
        jid: p.jid,
        admin: p.admin
      })),
      owner: meta.owner
    };

    gcCache.set(jid, lightMeta);
    return lightMeta;
  } catch (e) {
    if (e.message?.includes('rate-over-limit')) {
      await new Promise(r => setTimeout(r, 1500));
      return getGC(jid, sylph, true);
    }
    return { participants: [] };
  }
}

async function runWithRetry(p, ms, ctx, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      await p.run(ms, ctx);
      break;
    } catch (e) {
      if (e.message?.includes('rate-over-limit')) {
        await new Promise(r => setTimeout(r, 1500));
      } else {
        console.error(`💐 Error ${ctx.command}:`, e);
        ms.reply(`🌺 Error: ${e.message}`);
        break;
      }
    }
  }
}

function findCmd(body, prefixes) {
  const lowBody = body.toLowerCase();

  const usedP = prefixes.find(p => body.startsWith(p));
  if (usedP) {
    const cmd = body.slice(usedP.length).trim().split(/ +/)[0]?.toLowerCase();
    if (!cmd) return null;

    let p = cmdIndex.get(cmd);
    if (!p) {
      const mainCmd = aliasIndex.get(cmd);
      p = mainCmd ? cmdIndex.get(mainCmd) : null;
    }

    if (p) {
      return {
        p,
        prefix: usedP,
        cmd,
        args: body.slice(usedP.length + cmd.length).trim(),
        type: 'std'
      };
    }
  }

  for (const [prefix, plugin] of customIdx.entries()) {
    if (lowBody.startsWith(prefix)) {
      return {
        p: plugin,
        prefix,
        cmd: prefix,
        args: body.slice(prefix.length).trim(),
        type: 'custom'
      };
    }
  }

  return null;
}

module.exports = async (sylph, m) => {
  if (!m?.message) return;

  const ms = await serialize(sylph, m);

  if (ms.isBaileys) return;

  const normJid = id => id?.split('@')[0]?.split(':')[0];
  global.owner = Array.isArray(config.ownerNumber)
    ? config.ownerNumber.map(n => n.toString())
    : [config.ownerNumber.toString()];

  const isOwn = global.owner.includes(normJid(ms.sender));
  if (!config.isPublic && !isOwn && ms.sender !== sylph.user.id) return;

  const [usrData, chatData] = await Promise.allSettled([
    global.getUser(ms.sender),
    global.getChat(ms.from)
  ]);

  if (chatData.status === 'fulfilled' && chatData.value?.banned === 1) {
    if (sylph.user.id !== global?.sylph?.user?.id) return;
  }

  if (!ms.body?.trim()) return;

  const botId = sylph.user.id;
  const me = (botId || '').split(':')[0].replace(/@.*$/, '');
  const isBot = ms.sender === me + "@s.whatsapp.net";

  let groupMeta = { participants: [] };
  let parts = [];
  let isGrp = ms.isGroup;
  let isAdm = false;
  let isBotAdm = false;

  if (isGrp) {
    try {
      groupMeta = await getGC(ms.from, sylph);
      parts = groupMeta.participants || [];
      ms.participants = parts;

      const sender = parts.find(p => p.jid === ms.sender);
      const bot = parts.find(p => p.jid === me + "@s.whatsapp.net");
      isAdm = sender?.admin === 'admin' || sender?.admin === 'superadmin';
      isBotAdm = bot?.admin === 'admin' || bot?.admin === 'superadmin';
    } catch (e) {
      console.error('🪷 Group meta error:', e.message);
    }
  }

  sylphyLogs(ms, sylph).catch(() => {});
  if (config.autoRead) sylph.readMessages([ms.key]).catch(() => {});

  const cacheKey = `set_${me}`;
  let subbot = setCache.get(cacheKey);
  if (!subbot) {
    subbot = await getSettings(me + "@s.whatsapp.net");
    setCache.set(cacheKey, subbot);
  }

  const prefs = Array.isArray(subbot?.prefix) && subbot?.prefix?.length > 0
    ? subbot.prefix
    : (Array.isArray(config.prefix) ? config.prefix : [config.prefix]);

  const found = findCmd(ms.body, prefs);
  if (!found) {
    for (const p of plugins.values()) {
      if (typeof p.all === 'function') {
        p.all(ms, {
          sylph, isOwn, isBot, isAdm, isBotAdm, isGrp,
          participants: parts, groupMeta
        }).catch(e => console.error(`all error:`, e.message));
      }
    }
    return;
  }

  const isPrem = Array.isArray(config.premList) && config.premList.includes(ms.sender);
  const isSub = ms.sender.split('@')[0] === me || ms.sender === sylph.user.lid;

  const ctx = {
    sylph,
    args: found.args.split(/ +/),
    text: found.args,
    command: found.cmd,
    prefix: found.prefix,
    isOwner: isOwn,
    isBot,
    isAdmin: isAdm,
    isBotAdmin: isBotAdm,
    isGroup: isGrp,
    participants: parts,
    groupMeta,
    isPrem,
    isSub
  };

  if (isGrp) {
    const chatSet = await getChat(ms.from);
    if (chatSet?.onlyAdmin === 1 && !isAdm) return;

    let mainBots = [];
    try {
      mainBots = JSON.parse(chatSet.bots || '[]');
    } catch {
      mainBots = [];
    }

    if (mainBots.length > 0 && !mainBots.includes(me)) {
      return;
    }
  }

  const dfail = respCache.get('dfail') || (() => {
    const messages = {
      owner: '*✐ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ ᥱs s᥆ᥣ᥆ ⍴ᥲrᥲ ᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆.*',
      admin: '*✎ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ ᥱs s᥆ᥣ᥆ ⍴ᥲrᥲ ᥲძmіᥒіs𝗍rᥲძ᥆rᥱs.*',
      botAdmin: '*✦ ᥱᥣ ᑲ᥆𝗍 ᥒᥱᥴᥱsі𝗍ᥲ sᥱr ᥲძmіᥒіs𝗍rᥲძ᥆r.*',
      group: '*✧ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ ძіs⍴᥆ᥒіᑲᥣᥱ ⍴ᥲrᥲ grᥙ⍴᥆.*',
      private: '*✿ ᥴ᥆mᥲᥒძ᥆s s᥆ᥣ᥆ ძіs⍴᥆ᥒіᑲᥣᥱ ᥱᥒ ᥴhᥲ𝗍 ⍴rі᥎ᥲძ᥆.*',
      premium: '*❀ s᥆ᥣ᥆ ᥙsᥙᥲrі᥆s ⍴rᥱmіᥙm.*'
    };
    respCache.set('dfail', messages);
    return messages;
  })();

  let NSFW = false;
  if (isGrp) {
    NSFW = await getChat(ms.from).then(v => v.nsfw === 1);
  }

  const p = found.p;
  if (p.owner && !isOwn) return ms.reply(dfail.owner);
  if (p.group && !isGrp) return ms.reply(dfail.group);
  if (p.admin && !isAdm) return ms.reply(dfail.admin);
  if (p.botAdmin && !isBotAdm) return ms.reply(dfail.botAdmin);
  if (p.private && isGrp) return ms.reply(dfail.private);
  if (p.premium && !isPrem) return ms.reply(dfail.premium);
  if (p.nsfw && isGrp && !NSFW) return ms.reply(dfail.nsfw);

  if (config.autoTyping) sylph.sendPresenceUpdate('composing', ms.from).catch(() => {});

  try {
    await cmdQueue.add(async () => {
      await runWithRetry(p, ms, ctx);
    });
  } catch (error) {
    console.error('❌ Error en cmdQueue:', error.message);
  }
};