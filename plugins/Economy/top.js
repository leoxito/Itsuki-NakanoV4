module.exports = {
  command: ['top', 'lb'],
  help: ["top"],
  description: 'Muestra información general de la base de datos.',
  run: async (ms, { sylph }) => {
    try {
      // Enviar reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
      
      const users = await getUser();
      const chats = await getChat();

      const totalUsers = users.length;
      const totalChats = chats.length;

      const topLevel = [...users].sort((a, b) => b.level - a.level)[0];
      const topCoin = [...users].sort((a, b) => b.coin - a.coin)[0];
      const topExp = [...users].sort((a, b) => b.exp - a.exp)[0];

      let txt = `📌 *INFORMACIÓN DE LOS TOPS USUARIOS* 📌\n\n`

      if (totalUsers > 0) {
        txt += `> *📌 Total de usuarios: ${totalUsers}*\n`;
        txt += `> *💬 Total de chats: ${totalChats}*\n\n`;
        
        txt += `*🎯 CON MAS NIVEL*:\n`;
        txt += `↳ *👤 ${topLevel?.name || "@" + topLevel?.id.split('@')[0]}*\n`;
        txt += `↳ *🎮 Nivel: ${topLevel?.level || 0}*\n\n`;
        
        txt += `💰 *CON MAS MONEDAS* :\n`;
        txt += `↳ *👤 ${topCoin?.name || "@" + topCoin?.id.split('@')[0]}*\n`;
        txt += `↳ *🪙 Coins: ${topCoin?.coin || 0}*\n\n`;
        
        txt += `✨️ *CON MAS EXPERIENCIA* :\n`;
        txt += `↳ *👤 ${topExp?.name || "@" + topExp?.id.split('@')[0]}*\n`;
        txt += `↳ *✨️ EXP: ${topExp?.exp || 0}*`;
      } else {
        txt += `*📭 No hay usuarios registrados en la base de datos.*`;
      }

      await sylph.sendMessage(ms.from, { text: txt.trim(), mentions: await ms.Mentions(txt.trim()) }, { quoted: ms })
      
      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
    } catch (error) {
      console.error('Error en comando top:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await ms.reply('Ocurrió un error al obtener la información del top.');
    }
  }
};