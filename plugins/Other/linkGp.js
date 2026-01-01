module.exports = {
    command: ['link', 'linkgc', 'revoke', 'resetlink'],
    help: ['link', 'revoke'],
    admin: true,
    BotAdmin: true,
    group: true,
    description: '🔗 Obtiene o reinicia el link del grupo.',
    run: async (ms, { sylph, command }) => {
        // Reacción de procesamiento
        await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
        
        if (['link', 'linkgc'].includes(command)) {
            const code = await sylph.groupInviteCode(ms.from)
            const full = `https://chat.whatsapp.com/${code}`

            let txt = `> ﹒⌗﹒📚 .ৎ˚₊‧  Aquí tienes el link del grupo:

> 📌 ֹ ִ \`GROUP LINK\` ! ୧ ֹ ִ🔗    

> ✐ \`Enlace :\` ${full}
> ❍ \`Solicitado por :\` @${ms.sender.split('@')[0]}`
            
            // Reacción de éxito
            await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
            
            await sylph.sendMessage(ms.from, { text: txt, mentions: await ms.Mentions(txt) }, { quoted: ms })
        }
        
        if (['revoke', 'resetlink'].includes(command)) {
            await sylph.groupRevokeInvite(ms.from)
            
            // Reacción de éxito
            await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
            
            return ms.reply(
                `> *✐ El enlace del grupo ha sido *establecido* con éxito.*`
            )
        }
    }
}