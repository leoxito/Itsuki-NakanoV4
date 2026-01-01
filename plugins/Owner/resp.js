module.exports = {
  command: ['resp', 'rs'],
  owner: true,
  help: 'resp <texto>',
  description: 'Responder a un reporte/sugerencia',
  run: async (ms, { sylph, text }) => {
    const quoted = ms.quoted
    if (!quoted) return ms.reply('🌱 Debes responder al mensaje del reporte con tu .resp.')

    const quotedId = quoted.key?.id || ms.message?.extendedTextMessage?.contextInfo?.stanzaId
    if (!quotedId) return ms.reply('🌱 No pude obtener el ID del reporte.')

    const info = globalThis.reports[quotedId]
    if (!info) return ms.reply('🌱 No encuentro datos de ese reporte (quizá reinició el bot).')

    try {
      await sylph.sendMessage(info.from, {
        text: `🌸 Respuesta de mi creador a su sugerencia o reporte :\n\n\`\`\`${text}\`\`\``,
        mentions: await ms.Mentions(text)
      }, { quoted: info.q })

      ms.reply('✅ Respuesta enviada al usuario.')
      delete globalThis.reports[quotedId]
    } catch (e) {
      ms.reply('Ocurrió un error enviando la respuesta : ' + e)
    }
  }
}