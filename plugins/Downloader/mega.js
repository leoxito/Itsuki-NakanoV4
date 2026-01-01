const path = require("path");
const { File } = require("megajs");

module.exports = {
  command: ["mega"],
  help: ["mega"],
  description: "🌾 Descarga archivos desde enlaces de Mega.nz.",
  run: async (ms, { text, sylph }) => {
    if (!text) {
      return ms.reply(`> ✐ *Uso correcto:*\n\n> 📥 mega <enlace>\n> ✐ Ejemplo:\nmega https://mega.nz/file/ovJTHaQZ#yAbkrvQgykcH_NDKQ8eIc0zvsN7jonBbHZ_HTQL6lZ8`);
    }

    try {
      // Enviar reacción de búsqueda
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

      const file = File.fromURL(text);
      await file.loadAttributes();

      const maxSize = 300 * 1024 * 1024; 
      if (file.size >= maxSize) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(`*✰ El archivo es muy pesado. Límite de envío: 300MB*`);
      }

      const cap = `
> 乂 \`𝙈𝙀𝙂𝘼 - 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿𝙀𝙍\`

> ❏ *Nombre:* ${file.name}
> ❏ *Tamaño:* ${formatBytes(file.size)}
> ❏ *Enlace:* ${text}
`;
      await ms.reply(cap);
      const data = await file.downloadBuffer();
      const ext = path.extname(file.name).toLowerCase();
      const mimeTypes = {
        ".mp4": "video/mp4",
        ".pdf": "application/pdf",
        ".zip": "application/zip",
        ".rar": "application/x-rar-compressed",
        ".7z": "application/x-7z-compressed",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
      };
      const mimetype = mimeTypes[ext] || "application/octet-stream";
      await ms.sendDoc("", file.name, data);

      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });

    } catch (e) {
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      ms.reply(`> ❀ *Ocurrió un error:*\n${e.message}`);
    }
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}