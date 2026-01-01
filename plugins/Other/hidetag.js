module.exports = {
    command: ['hidetag', 'tag'],
    help: ['hidetag', 'tag'],
    group: true,
    isBotAdmin: true,
    admin: true,
    description: '🔕 Menciona a todos sin mostrar los @. Soporta texto o cualquier contenido citado.',
    run: async (ms, { sylph, command, text }) => {
        // Reacción de procesamiento
        await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
        
        const groupMetadata = await sylph.groupMetadata(ms.from)
        const mentions = groupMetadata.participants.map(p => p.id)

        if (command === 'tag') {
            const q = ms.quoted
            if (!q) {
                // Reacción de error
                await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
                return ms.reply('*❀ Responde a un mensaje para reenviarlo con menciones ocultas.*')
            }

            const mime = q.msg?.mimetype
            const isMedia = !!mime
            const media = isMedia ? await q.download() : null

            let payload = { mentions }

            if (isMedia) {
                const type = mime.split('/')[0]
                if (type === 'image') payload.image = media
                else if (type === 'video') payload.video = media
                else if (type === 'audio') payload.audio = media
                else payload.document = media

                payload.caption = q.text || ''
            } else if (q.text) {
                payload.text = q.text
            } else {
                // Reacción de error
                await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
                return ms.reply('*✐ Ese mensaje no contiene contenido compatible.*')
            }

            await sylph.sendMessage(ms.from, payload, { quoted: ms })
            
            // Reacción de éxito
            await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
            return
        }

        if (command === 'hidetag') {
            if (!text) {
                // Reacción de error
                await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
                return ms.reply('*✦ Escribe un texto para enviar con menciones ocultas.*')
            }
            
            await sylph.sendMessage(ms.from, {
                text,
                mentions
            }, { quoted: ms })
            
            // Reacción de éxito
            await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
        }
    }
}