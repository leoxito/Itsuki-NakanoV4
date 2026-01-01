module.exports = {
    command: ['setppgroup', 'setppgc'],
    help: ['setppgroup'],
    admin: true,
    BotAdmin: true,
    group: true,
    description: '🖼 Cambia la foto del grupo con una imagen enviada o citada.',
    run: async (ms, { sylph }) => {
        // Reacción de procesamiento
        await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
        
        let q = ms.quoted ? ms.quoted : ms
        if (!q.msg.mimetype || !q.msg.mimetype.includes('image')) {
            // Reacción de error
            await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
            return ms.reply('*✐ Solo puedes usar imágenes. Responde o envía una imagen para establecerla como foto del grupo.*')
        }

        let media = await q.download()
        await sylph.updateProfilePicture(ms.from, media)
        
        // Reacción de éxito
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
        
        await ms.reply('*🖼 Foto del grupo actualizada con éxito.*')
    }
}