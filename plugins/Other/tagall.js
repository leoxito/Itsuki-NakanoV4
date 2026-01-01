module.exports = {
    command: ['tagall'],
    help: ['tagall'],
    admin: true,
    isBotAdmin: true,
    group: true,
    description: '🌿 Menciona a todos los miembros del grupo con un mensaje bonito.',
    run: async (ms, { sylph, text }) => {
        // Reacción de procesamiento
        await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
        
        const groupMetadata = await sylph.groupMetadata(ms.from)
        const participants = groupMetadata.participants
        const mentions = participants.map(p => p.id)

        const txt = text ? text : '*Revivan Nenas 🫦*'

        const msg = `> ﹒⌗﹒✐ .ৎ˚₊‧  ${txt}

 ֹ ִ \`GROUP TAG\` ! ୧ ֹ ִ📚    

> 👤 \`Miembros :\` ${participants.length}
> 📌 \`Solicitado por :\` @${ms.sender.split('@')[0]}

\`\`\`˙.꒷✨️.𖦹˙ Lista de usuarios:\`\`\`
${participants.map(p => `> @${p.id.split('@')[0]}`).join('\n')}
`

        await sylph.sendMessage(ms.from, {
            text: msg,
            mentions: await ms.Mentions(msg)
        }, { quoted: ms })
        
        // Reacción de éxito
        await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
    }
}