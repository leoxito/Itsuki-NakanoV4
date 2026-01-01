module.exports = {
    command: ['setname', 'setdesc'],
    help: ['setname', 'setdesc'],
    admin: true,
    BotAdmin: true,
    group: true,
    description: '🖊 Cambia el nombre o la descripción del grupo.',
    run: async (ms, { sylph, text, command }) => {
        // Reacción de procesamiento
        await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
        
        if (!text) {
            // Reacción de error
            await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
            return ms.reply(
                command === 'setname'
                    ? '*✐ Escribe el nuevo nombre del grupo.*'
                    : '*✐ Escribe la nueva descripción del grupo.*'
            )
        }

        if (command === 'setname') {
            await sylph.groupUpdateSubject(ms.from, text)
            
            // Reacción de éxito
            await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
            
            return ms.reply('*📚 Nombre del grupo actualizado con éxito.*')
        }

        if (command === 'setdesc') {
            await sylph.groupUpdateDescription(ms.from, text)
            
            // Reacción de éxito
            await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
            
            return ms.reply('*📚 Descripción del grupo actualizada con éxito.*')
        }
    }
}