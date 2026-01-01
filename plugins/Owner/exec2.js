const { promisify } = require('util');
const { exec: _exec } = require('child_process');
const exec = promisify(_exec);

module.exports = {
  customPrefix: "$",
  help: ["$"],
  owner: true,
  async run(ms, { sylph, text }) {
    if (!text) {
      return sylph.sendMessage(ms.from, { text: '🌾 Ingresa un comando para ejecutar.' }, { quoted: ms });
    }

    await sylph.sendMessage(ms.from, { text: '🪷 Ejecutando...' }, { quoted: ms });

    try {
      const { stdout, stderr } = await exec(text);

      if (stdout?.trim()) {
        await sylph.sendMessage(ms.from, { text: stdout.trim().slice(0, 4096) }, { quoted: ms });
      }
      if (stderr?.trim()) {
        await sylph.sendMessage(ms.from, { text: stderr.trim().slice(0, 4096) }, { quoted: ms });
      }
    } catch (err) {
      await sylph.sendMessage(ms.from, { text: `💐 Error:\n${err.message}` }, { quoted: ms });
    }
  }
};