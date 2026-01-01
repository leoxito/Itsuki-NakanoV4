const fetch = require('node-fetch');
const { format } = require('util');

module.exports = {
  command: ["get", "fetch"],
  help: ["fetch"],
  description: "Obtener información de una Url",
  run: async (ms, { text }) => {
    if (!/^https?:\/\//.test(text)) return ms.reply('*✐ Ingresa un enlace válido que comience con http o https*');

    try {
      const _url = new URL(text);
      const params = new URLSearchParams(_url.searchParams);
      const url = `${_url.origin}${_url.pathname}${params.toString() ? '?' + params.toString() : ''}`;

      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      const contentLength = parseInt(res.headers.get('content-length') || '0');

      if (contentLength > 100 * 1024 * 1024) {
        return ms.reply(`📌 El archivo es demasiado grande.\nContent-Length: ${contentLength} bytes`);
      }

      if (/text|json/.test(contentType)) {
        let buffer = await res.buffer();
        try {
          const json = JSON.parse(buffer.toString());
          return ms.reply(format(json).slice(0, 65536));
        } catch {
          return ms.reply(buffer.toString().slice(0, 65536));
        }
      } else {
        const buffer = await res.buffer();
        return ms.media(text, buffer);
      }

    } catch (err) {
      console.error(err);
      return ms.reply('🌱 Ocurrió un error al intentar obtener el recurso :\n' + err);
    }
  }
};