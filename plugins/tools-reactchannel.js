import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {

    if (!text) {
        await m.react('❓')
        return conn.reply(m.chat,
`> 🎯 *REACCIONAR CANAL* 🍙

> 📝 *Uso:* ${usedPrefix}${command} <link_del_post> <emoji(s)>
> 💡 *Ejemplo:* ${usedPrefix}${command} https://whatsapp.com/channel/ID/POSTID 😂🔥

> 📚 *Reacciona a una publicación específica del canal* ✨`,
        m)
    }

    const args = text.trim().split(/ +/)
    const link = args.shift()
    const reacts = args.join(',')

    if (!link.includes('whatsapp.com/channel/')) {
        await m.react('⚠️')
        return conn.reply(m.chat,
`> ❌ *LINK NO VÁLIDO*  
> Debes pegar el link completo del post del canal.`,
        m)
    }

    try {
        await m.react('⏳')

        const apiUrl =
            `https://api-adonix.ultraplus.click/tools/react?apikey=${global.apikey
            }&post_link=${encodeURIComponent(link)
            }&reacts=${encodeURIComponent(reacts)}`

        const res = await fetch(apiUrl)
        const data = await res.json()

        if (data.status) {
            await m.react('✅')
            conn.reply(m.chat,
`> ✅ *REACCIONES ENVIADAS* 🍙

> 📢 *Post:* ${link}
> 🎭 *Reacciones:* ${reacts}

> ✨ *¡Listo!*`,
            m)
        } else {
            await m.react('❌')
            conn.reply(m.chat,
`> ❌ *ERROR*  
> La API no pudo reaccionar al post.`,
            m)
        }

    } catch (e) {
        await m.react('❌')
        conn.reply(m.chat,
`> ❌ *ERROR EN LA API*
> ${e.message}`,
        m)
    }
}

handler.help = ['reactcanal']
handler.tags = ['tools']
handler.command = ['reactcanal', 'reaccionarcanal', 'canalreact']
handler.group = true

export default handler