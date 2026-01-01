module.exports = {
    command: ['kick', 'sacar'],
    help: ['kick'],
    admin: true,
    BotAdmin: true,
    group: true,
    description: '👢 Expulsa a un usuario del grupo por tag o mensaje citado.',
    run: async (ms, { sylph }) => {
        // Reacción de procesamiento
        await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
        
        const mentioned = ms.quoted?.msg?.contextInfo?.mentionedJid || ms.msg?.contextInfo?.mentionedJid || []
        const target = ms.quoted?.sender || (mentioned.length > 0 && mentioned[0])

        const groupMetadata = await sylph.groupMetadata(ms.from)
        const isTargetAdmin = groupMetadata.participants.find(p => p.id === target)?.admin

        if (!target) {
            // Reacción de error
            await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
            return sylph.sendMessage(ms.from, { text: '*✐ Etiqueta o responde al usuario que quieres sacar.*' }, { quoted: ms })
        }
        
        if (target === ms.sender) {
            // Reacción de error
            await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
            return sylph.sendMessage(ms.from, { text: '*✐ No puedes sacarte a ti mismo.*' }, { quoted: ms })
        }
        
        if (target === sylph.user.id) {
            // Reacción de error
            await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
            return sylph.sendMessage(ms.from, { text: '*❀ No puedo sacarme a mí mismo*' }, { quoted: ms })
        }
        
        if (isTargetAdmin) {
            // Reacción de advertencia
            await sylph.sendMessage(ms.from, { react: { text: "⚠️", key: ms.key } });
            return sylph.sendMessage(ms.from, { text: '*✦ No puedo sacar a otro admin.*' }, { quoted: ms })
        }
        
        await sylph.groupParticipantsUpdate(ms.from, [target], 'remove')
        
        // Reacción de éxito
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
        
        await ms.reply("> *_✐ ¡Usuario eliminado con éxito!_*")
    }
}