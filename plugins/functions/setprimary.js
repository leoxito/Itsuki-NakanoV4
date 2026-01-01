module.exports = {
    command: ['primary'],
    help: ['primary add', 'primary remove', 'primary reset', 'primary list'],
    admin: true,
    group: true,
    description: 'Gestiona los bots primarios del grupo.',
    run: async (ms, { sylph, args }) => {
        const sub = args[0]
        if (!sub) await sylph.sendMessage(ms.from, { text: '✐ 𝗨𝘀𝗼:\n> • primary add\n> • primary remove\n> • primary reset\n> • primary list\n\n> ✧ 𝗥𝗲𝘀𝗽𝗼𝗻𝗱𝗲 𝗮𝗹 𝗯𝗼𝘁.' }, { quoted: ms })

        const chat = await getChat(ms.from)
        let bots = []
        try {
            bots = JSON.parse(chat.bots || '[]')
        } catch {
            bots = []
        }

        // Función segura para obtener menciones
        const getMentions = (text) => {
            if (!text) return [];
            const mentionRegex = /@(\d{10,})/g;
            const matches = [...text.matchAll(mentionRegex)];
            return matches.map(match => {
                const num = match[1];
                return num && num.trim ? (num.trim() + '@s.whatsapp.net') : null;
            }).filter(Boolean);
        }

        if (sub === 'add') {
            if (!ms.quoted?.sender) {
                return sylph.sendMessage(ms.from, { text: '*✦ 𝗥𝗲𝘀𝗽𝗼𝗻𝗱𝗲 𝗮𝗹 𝗺𝗲𝗻𝘀𝗮𝗷𝗲 𝗱𝗲𝗹 𝗯𝗼𝘁.*' }, { quoted: ms })
            }

            const quotedNumber = ms.quoted.sender.split('@')[0]
            let isSubbot = false
            if (quotedNumber === global.sylph.user.id.split(":")[0]) {
                isSubbot = true
            }
            
            if (!isSubbot && global.sylphs) {
                for (const subbot of global.sylphs) {
                    if (subbot.user && subbot.user.id) {
                        const subbotNumber = subbot.user.id.split(':')[0]
                        if (quotedNumber === subbotNumber) {
                            isSubbot = true
                            break
                        }
                    }
                }
            }

            if (!isSubbot) {
                return sylph.sendMessage(ms.from, { text: '*✧ 𝗦𝗼𝗹𝗼 𝗽𝘂𝗲𝗱𝗲𝘀 𝗮𝗴𝗿𝗲𝗴𝗮𝗿 𝘀𝘂𝗯𝗯𝗼𝘁𝘀 𝗮𝗰𝘁𝗶𝘃𝗼𝘀.*' }, { quoted: ms })
            }

            if (!bots.includes(quotedNumber)) {
                bots.push(quotedNumber)
                await updateChat(ms.from, 'bots', JSON.stringify(bots))
                const txt = `> *✐ 𝗕𝗼𝘁 𝗮𝗴𝗿𝗲𝗴𝗮𝗱𝗼*:\n> • @${quotedNumber}`
                return sylph.sendMessage(ms.from, { 
                    text: txt, 
                    mentions: [quotedNumber + '@s.whatsapp.net'] // Usar directamente en lugar de ms.Mentions()
                }, { quoted: ms })
            } else {
                return sylph.sendMessage(ms.from, { text: '✧ 𝗘𝘀𝘁𝗲 𝗯𝗼𝘁 𝘆𝗮 𝗲𝘀 𝗽𝗿𝗶𝗺𝗮𝗿𝗶𝗼.' }, { quoted: ms })
            }
        }

        if (sub === 'remove') {
            if (!ms.quoted?.sender) {
                return sylph.sendMessage(ms.from, { text: '✦ 𝗥𝗲𝘀𝗽𝗼𝗻𝗱𝗲 𝗮𝗹 𝗺𝗲𝗻𝘀𝗮𝗷𝗲 𝗱𝗲𝗹 𝗯𝗼𝘁.' }, { quoted: ms })
            }

            const quotedNumber = ms.quoted.sender.split('@')[0]

            if (bots.includes(quotedNumber)) {
                bots = bots.filter(x => x !== quotedNumber)
                await updateChat(ms.from, 'bots', JSON.stringify(bots))
                const tt = `❏ 𝗕𝗼𝘁 𝗲𝗹𝗶𝗺𝗶𝗻𝗮𝗱𝗼:\n• @${quotedNumber}`
                return sylph.sendMessage(ms.from, { 
                    text: tt, 
                    mentions: [quotedNumber + '@s.whatsapp.net'] // Usar directamente
                }, { quoted: ms })
            } else {
                return sylph.sendMessage(ms.from, { text: '✧ 𝗘𝘀𝘁𝗲 𝗯𝗼𝘁 𝗻𝗼 𝗲𝘀 𝗽𝗿𝗶𝗺𝗮𝗿𝗶𝗼.' }, { quoted: ms })
            }
        }

        if (sub === 'reset') {
            bots = []
            await updateChat(ms.from, 'bots', JSON.stringify([]))
            return sylph.sendMessage(ms.from, { text: '❏ 𝗟𝗶𝘀𝘁𝗮 𝗱𝗲 𝗯𝗼𝘁𝘀 𝗿𝗲𝗶𝗻𝗶𝗰𝗶𝗮𝗱𝗮.' }, { quoted: ms })
        }

        if (sub === 'list') {
            if (bots.length === 0) {
                return sylph.sendMessage(ms.from, { text: '✧ 𝗡𝗼 𝗵𝗮𝘆 𝗯𝗼𝘁𝘀 𝗽𝗿𝗶𝗺𝗮𝗿𝗶𝗼𝘀.' }, { quoted: ms })
            }

            const text = `❏ 𝗟𝗶𝘀𝘁𝗮 𝗱𝗲 𝗯𝗼𝘁𝘀 𝗽𝗿𝗶𝗺𝗮𝗿𝗶𝗼𝘀:\n\n${bots.map(v => `• @${v}`).join('\n')}`
            const mentions = bots.map(v => v + '@s.whatsapp.net')

            return sylph.sendMessage(ms.from, { 
                text, 
                mentions: mentions // Usar array directamente
            }, { quoted: ms })
        }
    }
}