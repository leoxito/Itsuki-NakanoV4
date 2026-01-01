const fs = require('fs');
const path = require('path');

module.exports = {
  command: "del",
  help: ["del"],
  owner: true,
  async run(ms, { args }) {
    if (!args[0]) return ms.reply('> *❀ Especifica la ruta del archivo a eliminar.*');

    const filePath = path.resolve(args[0]);

    try {
      if (!fs.existsSync(filePath)) {
        return ms.reply(`*✐ El archivo no existe*:\n\`${filePath}\``);
      }

      if (fs.statSync(filePath).isDirectory()) {
        return ms.reply('⚠️ Esa ruta es una carpeta. Usa otro comando para eliminar carpetas.');
      }

      fs.unlinkSync(filePath);
      return ms.reply(`*📂 Archivo eliminado*:\n\`${filePath}\``);
    } catch (e) {
      return ms.reply(`*❀ Error al eliminar el archivo*:\n${e.message}`);
    }
  }
};