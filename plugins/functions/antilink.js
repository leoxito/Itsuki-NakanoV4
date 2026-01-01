const linkRegex = /https:\/\/chat\.whatsapp\.com\/([\w\d]+)/i;

module.exports = {
  command: ['_antilink'],
  all: async (ms, { sylph, isGroup, isAdmin, isBotAdmin }) => {
    if (!isGroup) return;

    const info = await global.getChat(ms.from);
    const antilink = info.antiLink === 1;
    const body = ms.body || '';

    const match = body.match(linkRegex);
    if (!match) return;
    if (!antilink || isAdmin || !isBotAdmin) return;
    const inviteCodeDetected = match[1]; 
    const currentGroupCode = await sylph.groupInviteCode(ms.from);
    if (inviteCodeDetected === currentGroupCode) return;

    try {
      // Reacción de procesamiento (en el mensaje que contiene el enlace)
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
      
      await sylph.sendMessage(ms.from, { delete: ms.key });
      await sylph.sendMessage(ms.from, {
        text: `> ✐ @${ms.sender.split('@')[0]} ha sido eliminado por compartir enlaces de otro grupo.`,
        mentions: [ms.sender]
      });
      await sylph.groupParticipantsUpdate(ms.from, [ms.sender], 'remove');
      
      // Reacción de completado (en el mensaje que contiene el enlace)
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
    } catch (e) {
      console.error("🌾 Error eliminando usuario:", e);
    }
  }
};