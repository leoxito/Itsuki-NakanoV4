const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: ['s', 'sticker'],
  help: ["sticker"],
  description: 'Crea stickers a partir de imágenes o videos.',

  run: async (ms, { sylph }) => {
    // Reacción de procesamiento
    await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
    
    let mediaSource = null;
    const quotedMessage = ms.msg?.contextInfo?.quotedMessage;

    if (quotedMessage && /imageMessage|videoMessage/.test(Object.keys(quotedMessage)[0])) {
      mediaSource = { message: quotedMessage };
    } else if (/imageMessage|videoMessage/.test(ms.type)) {
      mediaSource = ms;
    } else {
      // Reacción de error
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      return ms.reply('> *✐ Por favor, responde a una imagen o video, o envía uno con el comando* `.s`.');
    }

    try {
      const buffer = await downloadMediaMessage(mediaSource, 'buffer', {});
      await ms.sticker(buffer);
      
      // Reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
    } catch (e) {
      console.error(e);
      // Reacción de error
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await ms.reply(`📍 No se pudo crear el sticker.\nError: ${e.message}`);
    }
  }
};