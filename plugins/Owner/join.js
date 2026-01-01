module.exports = {
  command: ['join'],
  help: ['join <link>'],
  description: '🌿 El bot se unirá a un grupo mediante enlace de invitación.',
  owner: true,
  run: async (ms, { sylph, args }) => {
    const link = args[0];
    if (!link || !link.includes('whatsapp.com/')) {
      return ms.reply('🌴 Proporciona un enlace válido de invitación.');
    }

    const code = link.split('whatsapp.com/')[1].replace(/[^0-9A-Za-z]/g, '');
    try {
      await sylph.groupAcceptInvite(code);
      ms.reply('🍓 El bot se unió correctamente al grupo.');
    } catch (e) {
      console.error('🌲 Error al unirse al grupo:', e);
      ms.reply('🪴 No se pudo unir al grupo. El enlace podría estar vencido o ser inválido.');
    }
  }
};