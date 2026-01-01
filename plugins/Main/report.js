globalThis.reports = globalThis.reports || {}

module.exports = {
  command: ['report', 'suggest'],
  help: ['report <mensaje>', 'suggest <mensaje>'],
  description: 'Envía reportes o sugerencias al número del desarrollador.',
  run: async (ms, { sylph, text, isGroup, groupMetadata, command }) => {
    try {
      const isReport = command === 'report'
      const tipo = isReport ? 'Nuevo reporte' : 'Nueva sugerencia'
      const targetJid = '573187418668@s.whatsapp.net'
      const senderTag = '@' + ms.sender.split('@')[0]
      const groupName = isGroup ? groupMetadata.subject : 'Chat privado'

      if (!text) {
        // Enviar reacción de error
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(`❀ Por favor ingresa ${isReport ? 'el reporte, de preferencia copia el error que da el comando (si lo da)' : 'la sugerencia, de preferencia redacta bien...'}`)
      }

      // Enviar reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

      const content = ` > 𓂂𓏸 𐅹੭੭ *\`${tipo.toUpperCase()}\`* 🔎

> ര 👤 Usuario : ${senderTag}
> ര 💬 Chat    : ${groupName}

𓂂𓏸 𐅹੭੭ *\`M E N S A J E\`* 📚
\`\`\`
${text}
\`\`\`
`

      try {
        const sent = await sylph.sendMessage(targetJid, {
          text: content,
          mentions: [ms.sender]
        })

        const ownerMsgId = sent.key.id
        globalThis.reports[ownerMsgId] = {
          from: ms.from,
          participant: ms.sender,
          q: ms
        }

        // Enviar reacción de éxito
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
        
        await ms.reply(`✐ ¡Gracias por tu ${tipo.toLowerCase()}! Lo he enviado correctamente a mi creador, por favor espera una respuesta.`)
      } catch (e) {
        console.error(`Error enviando ${tipo.toLowerCase()}:`, e)
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        ms.reply('📌 No pude enviar tu mensaje, intenta de nuevo más tarde.')
      }
    } catch (error) {
      console.error('Error en comando report/suggest:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      ms.reply('Ocurrió un error al procesar tu solicitud.');
    }
  }
}