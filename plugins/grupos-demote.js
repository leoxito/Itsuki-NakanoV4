const handler = async (m, { conn, text, participants, isAdmin, isBotAdmin }) => {
  if (!m.isGroup) return
  if (!isBotAdmin) return
  if (!isAdmin) return

  // Obtener usuario target
  let targetUser = null
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    targetUser = m.mentionedJid[0]
  } else if (m.quoted) {
    targetUser = m.quoted.sender
  }

  if (!targetUser) return

  // Verificar que el target está en el grupo
  const userInGroup = participants.find(p => p.id === targetUser)
  if (!userInGroup) return

  // No permitir quitar admin al creador
  if (userInGroup.admin === 'superadmin') return

  // Verificar si ya no es admin
  if (userInGroup.admin !== 'admin') return

  await m.react('🕒')

  try {
    // Quitar admin
    await conn.groupParticipantsUpdate(m.chat, [targetUser], 'demote')
    await m.react('✅')
    
    await conn.sendMessage(m.chat, { 
      text: `> ⓘ \`Admin removido:\` *@${targetUser.split('@')[0]}*`,
      mentions: [targetUser]
    }, { quoted: m })

  } catch (error) {
    await m.react('❌')
  }
}

handler.help = ['demote']
handler.tags = ['group']
handler.command = /^(demote|quitaradmin)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler