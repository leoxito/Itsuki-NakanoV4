const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database/data.db');

let db;

async function init() {
  db = await sqlite.open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT '',
      job TEXT DEFAULT '',
      level INTEGER DEFAULT 0,
      exp INTEGER DEFAULT 0,
      coin INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 0,
      bank INTEGER DEFAULT 0,
      prem BOOLEAN DEFAULT 0
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      antiLink BOOLEAN DEFAULT 0,
      onlyAdmin BOOLEAN DEFAULT 0,
      nsfw BOOLEAN DEFAULT 0,
      welcome BOOLEAN DEFAULT 0,
      bots TEXT DEFAULT '[]'
    )
  `);

  const chatColumns = await db.all(`PRAGMA table_info(chats)`);
  if (!chatColumns.some(col => col.name === 'banned')) {
    await db.run(`ALTER TABLE chats ADD COLUMN banned BOOLEAN DEFAULT 0`);
  }
  if (!chatColumns.some(col => col.name === 'welcome')) {
    await db.run(`ALTER TABLE chats ADD COLUMN welcome BOOLEAN DEFAULT 0`);
  }

  await db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      bot_name TEXT DEFAULT '',
      bot_owner TEXT DEFAULT '',
      image TEXT DEFAULT '',
      image_doc TEXT DEFAULT '',
      currency TEXT DEFAULT '',
      prefix TEXT DEFAULT '[]',
      lang TEXT DEFAULT 'es',
      footer TEXT DEFAULT '',
      alive_message TEXT DEFAULT '¡Sylphy is active!',
      welcome_msg TEXT DEFAULT '',
      bye_msg TEXT DEFAULT '',
      public_mode BOOLEAN DEFAULT 1
    )
  `);

  const settingsColumns = await db.all(`PRAGMA table_info(settings)`);
  if (!settingsColumns.some(col => col.name === 'prefix')) {
    await db.run(`ALTER TABLE settings ADD COLUMN prefix TEXT DEFAULT '[]'`);
  }

  return db;
}

async function getUser(id, options = {}) {
  if (!id) {
    const { orderBy, limit = 20, desc = true } = options;
    if (orderBy) {
      return await db.all(`SELECT * FROM users ORDER BY ${orderBy} ${desc ? 'DESC' : 'ASC'} LIMIT ?`, [limit]);
    } else {
      return await db.all('SELECT * FROM users');
    }
  }

  let user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    await db.run('INSERT INTO users (id) VALUES (?)', [id]);
    user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
  }
  return user;
}

async function getChat(id) {
  if (!id) return await db.all('SELECT * FROM chats');
  let chat = await db.get('SELECT * FROM chats WHERE id = ?', [id]);
  if (!chat) {
    await db.run('INSERT INTO chats (id) VALUES (?)', [id]);
    chat = await db.get('SELECT * FROM chats WHERE id = ?', [id]);
  }
  return chat;
}
/*
async function getSettings(id) {
  if (!id) return await db.all('SELECT * FROM settings');

  let settings = await db.get('SELECT * FROM settings WHERE id = ?', [id]);
  if (!settings) {
    await db.run('INSERT INTO settings (id) VALUES (?)', [id]);
    settings = await db.get('SELECT * FROM settings WHERE id = ?', [id]);
  }
  return settings;
}*/

async function getSettings(id) {
  let row = await db.get(`SELECT * FROM settings WHERE id = ?`, [id]);

  if (!row) {
    const defaultSettings = {
      id,
      bot_name: '',
      bot_owner: '',
      image: '',
      image_doc: '',
      currency: '',
      prefix: '[]', 
      lang: 'es',
      footer: '',
      alive_message: '¡Sylphy is active!',
      welcome_msg: '',
      bye_msg: '',
      public_mode: 1
    };

    await db.run(
      `INSERT INTO settings (
        id, bot_name, bot_owner, image, image_doc, currency, prefix, lang, footer, alive_message, welcome_msg, bye_msg, public_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        defaultSettings.id,
        defaultSettings.bot_name,
        defaultSettings.bot_owner,
        defaultSettings.image,
        defaultSettings.image_doc,
        defaultSettings.currency,
        defaultSettings.prefix,
        defaultSettings.lang,
        defaultSettings.footer,
        defaultSettings.alive_message,
        defaultSettings.welcome_msg,
        defaultSettings.bye_msg,
        defaultSettings.public_mode
      ]
    );

    row = defaultSettings;
    row.prefix = []; 
  } else {
    try {
      row.prefix = JSON.parse(row.prefix);
    } catch (e) {
      row.prefix = [];
    }
  }

  return row;
}

async function updateSettings(id, key, value) {
  let storedValue = value;
  if (Array.isArray(value) || typeof value === 'object') {
    storedValue = JSON.stringify(value);
  }
  return await db.run(`UPDATE settings SET ${key} = ? WHERE id = ?`, [storedValue, id]);
}

async function updateUser(id, field, value) {
  return db.run(`UPDATE users SET ${field} = ? WHERE id = ?`, [value, id]);
}

async function updateChat(id, field, value) {
  return db.run(`UPDATE chats SET ${field} = ? WHERE id = ?`, [value, id]);
}

module.exports = {
  init,
  getUser,
  updateUser,
  getChat,
  updateChat,
  getSettings,
  updateSettings
};
