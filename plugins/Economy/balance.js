module.exports = {
  command: ['bal', 'balance', 'bank', 'wallet'],
  help: ["balance"],
  description: 'Muestra tu información económica y de nivel',
  run: async (ms, { sylph }) => {
    try {
      const mention = ms.mentionedJid?.[0];
      const target = mention || ms.quoted?.sender || ms.sender;

      const user = await getUser(target);

      const name = ms.pushName || `@${target.split('@')[0]}`;
      const tag = `@${target.split('@')[0]}`;
      const job = user.job || 'Ninguno';
      const level = user.level || 0;
      const exp = user.exp || 0;
      const coin = user.coin || 0;
      const gold = user.gold || 0;
      const bank = user.bank || 0;

      const text = `
> \`B A L A N C E  :\` 💰

> *❍ Usuario : ${tag}*
> *❏ Trabajo : ${job}*
> *✦ Nivel : ${level}*
> *✐ Exp : ${exp}*

> *👛 Cartera : ${coin.toLocaleString()} monedas*
> *🏦 Banco : ${bank.toLocaleString()} monedas*
> *🪙 Oro : ${gold.toLocaleString()} piezas*
`.trim();

      // Enviar reacción de búsqueda
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
      
      await sylph.sendMessage(ms.from, { text: text, mentions: await ms.Mentions(text) }, { quoted: ms })
      
      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
    } catch (error) {
      console.error('Error en comando balance:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await ms.reply('*✧ Ocurrió un error al obtener la información del balance.*');
    }
  }
};