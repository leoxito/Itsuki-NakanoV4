module.exports = {
    command: ['promote', 'demote'],
    help: ['promote', 'demote'],
    admin: true,
    BotAdmin: true,
    group: true,
    description: '🌟 Da o quita admin a un usuario usando tag o respuesta.',
    run: async (ms, { sylph, command }) => {
        // Reacción de procesamiento
        await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
        
        const mentioned = ms.quoted?.msg?.contextInfo?.mentionedJid || ms.msg?.contextInfo?.mentionedJid || []
        const target = ms.quoted?.sender || (mentioned.length > 0 && mentioned[0])

        const groupMetadata = await sylph.groupMetadata(ms.from)
        const isTargetAdmin = groupMetadata.participants.find(p => p.id === target)?.admin

        if (!target) {
            // Reacción de error
            await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
            return sylph.sendMessage(ms.from, { text: '*✐ Etiqueta o responde al usuario para modificar su rol.*' }, { quoted: ms })
        }
        
        if (target === ms.sender) {
            // Reacción de error
            await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
            return sylph.sendMessage(ms.from, { text: '*✦ No puedes hacerlo sobre ti mismo.*' }, { quoted: ms })
        }
        
        if (target === sylph.user.id) {
            // Reacción de error
            await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
            return sylph.sendMessage(ms.from, { text: '*✐ Yo ya soy admin bby.*' }, { quoted: ms })
        }

        if (command === 'promote') {
            if (isTargetAdmin) {
                // Reacción de advertencia
                await sylph.sendMessage(ms.from, { react: { text: "⚠️", key: ms.key } });
                return sylph.sendMessage(ms.from, { text: '*✐ Ya es admin.*' }, { quoted: ms })
            }
            
            await sylph.groupParticipantsUpdate(ms.from, [target], 'promote')
            
            // Reacción de éxito
            await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
            
            return ms.reply('> *_✦ ¡Usuario promovido a admin!_*')
        }

        if (command === 'demote') {
            if (!isTargetAdmin) {
                // Reacción de error
                await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
                return sylph.sendMessage(ms.from, { text: '*✐ Ese usuario no es admin.*' }, { quoted: ms })
            }
            
            await sylph.groupParticipantsUpdate(ms.from, [target], 'demote')
            
            // Reacción de éxito
            await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
            
            return ms.reply('> *_✦ ¡Usuario degradado a miembro!_*')
        }
    }
}