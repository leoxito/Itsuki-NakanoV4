const fs = require('fs');
const path = require('path');

module.exports = {
  command: "save",
  help: ["save"],
  owner: true,
  async run(ms, { sylph, args }) {
    if (!args[0]) return ms.reply('📁 Especifica el nombre del archivo.');

    const filePath = path.resolve(args[0]);

    if (!ms.quoted) return ms.reply('🌿 Responde a un mensaje con texto o archivo.');

    const quoted = ms.quoted;
    const content = quoted.msg || '';

    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      if (content && typeof content === 'string' && content.trim()) {
        if (filePath.endsWith('.js')) {
          try {
            fs.writeFileSync(filePath + '.tmp', content);
            require(filePath + '.tmp');
            fs.writeFileSync(filePath, content);
            fs.unlinkSync(filePath + '.tmp');
            return ms.reply(`🌱 Código guardado en:\n\`${filePath}\``);
          } catch (err) {
            fs.unlinkSync(filePath + '.tmp');
            return ms.reply(`🌷 Error de sintaxis :\n\n${err.message}`);
          }
        }

        fs.writeFileSync(filePath, content);
        return ms.reply(`🌺 Texto guardado en:\n\`${filePath}\``);
      }

      const buffer = await quoted.download();
      if (!buffer) return ms.reply('🌾 No se pudo descargar el archivo.');

      fs.writeFileSync(filePath, buffer);
      return ms.reply(`🌿 Archivo guardado en:\n\`${filePath}\``);
    } catch (e) {
      return ms.reply(`🪷 Error al guardar:\n${e.message}`);
    }
  }
};