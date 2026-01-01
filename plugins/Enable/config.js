module.exports = {
  command: ['enable', 'disable', 'on', 'off'],
  help: ['enable', 'disable', 'on', 'off'],
  admin: true,
  isBotAdmin: true,
  group: true,
  description: '⚙️ Activa o desactiva funciones como antilink, onlyadmin y nsfw.',
  run: async (ms, { sylph, args, command }) => {
    try {
      if (args.length < 1) {
        // Enviar reacción de información (ayuda)
        await sylph.sendMessage(ms.from, { react: { text: "ℹ️", key: ms.key } });
        
        return ms.reply(
          `*✦ Usa*:\n` +
          `┌❏ ⊹\n` +
          `│ *✐ on nsfw*\n` +
          `│ *✐ off antilink*\n` +
          `│ *✐ enable onlyadmin*\n` +
          `│ *✐ enable welcome*\n` +
          `└───────❏`
        )
      }

      // Enviar reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

      const field = args[0].toLowerCase()
      const validFields = ['antilink', 'onlyadmin', 'nsfw', 'welcome']

      if (!validFields.includes(field)) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(`*✐ Opción inválida. Usa: antilink, onlyadmin, nsfw o welcome.*`)
      }

      const value = ['enable', 'on'].includes(command) ? 1 : 0
      const dbField = field === 'antilink' ? 'antiLink' : field

      await updateChat(ms.from, dbField, value)

      const estado = value ? 'activado' : 'desactivado'
      
      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
      return ms.reply(`> ❀ Función *${field}* *${estado}* correctamente.`)
      
    } catch (error) {
      console.error('Error en comando enable/disable:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      return ms.reply('Ocurrió un error al actualizar la configuración del grupo.');
    }
  }
}