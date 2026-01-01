const fetch = require('node-fetch');

module.exports = {
  command: ['gdrive', 'drive'],
  help: ["gdrive"],
  description: 'Descarga archivos desde Google Drive.',
  run: async (ms, { sylph, text, args, command, prefix }) => {
    try {
      if (!text) {
        return ms.reply(`> ✐ *Ejemplo de uso:* ${prefix + command} https://drive.google.com/file/d/1-8BSwPSAycKYMqveGm_JTu2c_wIDkJIt/view?usp=drivesdk`);
      }

      // Enviar reacción de búsqueda
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

      const result = await gdriveScraper(text);

      if (!result.status) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(`*✧ Error al obtener el archivo de Google Drive:*\n${result.message}`);
      }

      const { fileName, fileSize, mimetype, downloadUrl } = result.data;

      const cap = `\`\`\`◜ 𝙂𝙊𝙊𝙂𝙇𝙀 𝘿𝙍𝙄𝙑𝙀 - 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿𝙀𝙍 ◞\`\`\`\n\n`
        + `> ❀ \`Nombre :\` ${fileName}\n`
        + `> ✰ \`Tamaño :\` ${fileSize}\n`
        + `> ❒ \`Tipo :\` ${mimetype}\n`
        + `> ✐ \`URL :\` ${text}`;

      await ms.reply(cap);
      await ms.sendDoc(fileName, fileName, downloadUrl);

      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });

    } catch (e) {
      console.error('🌺 Error en plugin GDrive:', e);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await ms.reply(`*✧ Error: ${e.message}*`);
    }
  }
};

async function gdriveScraper(url) {
  try {
    const match = url.match(/(?:\/?id=|\/d\/)([a-zA-Z0-9_-]+)/);
    const id = match?.[1];

    if (!id) throw new Error('No se encontró ID de descarga en el enlace.');

    const res = await fetch(
      `https://drive.google.com/uc?id=${id}&authuser=0&export=download`,
      {
        method: 'POST',
        headers: {
          'accept-encoding': 'gzip, deflate, br',
          'content-length': 0,
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          origin: 'https://drive.google.com',
          'user-agent': 'Mozilla/5.0',
          'x-client-data': 'CKG1yQEIkbbJAQiitskBCMS2yQEIqZ3KAQioo8oBGLeYygE=',
          'x-drive-first-party': 'DriveWebUi',
          'x-json-requested': 'true',
        }
      }
    );

    const { fileName, sizeBytes, downloadUrl } = JSON.parse((await res.text()).slice(4));

    if (!downloadUrl) throw new Error('*✦ Enlace bloqueado: límite de descargas excedido o privado.*');

    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) throw new Error('El archivo no está disponible o no se puede acceder.');

    return {
      status: true,
      data: {
        downloadUrl,
        fileName,
        fileSize: `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        mimetype: fileRes.headers.get('content-type'),
      }
    };
  } catch (error) {
    return { status: false, message: error.message };
  }
}