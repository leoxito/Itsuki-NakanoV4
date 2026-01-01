const moment = require('moment-timezone')
module.exports = {
  command: ['infogroup', 'gpinfo', 'groupinfo', 'groupi'],
  help: ['groupinfo'],
  group: true,
  description: '🌾 Muestra información detallada y configuración del grupo.',
  run: async (ms, { sylph }) => {
    try {
      // Enviar reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
      
      const metadata = await sylph.groupMetadata(ms.from)
      const admins = metadata.participants.filter(p => p.admin)
      const owner = metadata.owner || (admins.find(p => p.admin === 'superadmin')?.id || 'Desconocido')

      const creationDate = moment(metadata.creation * 1000)
        .tz('America/Mexico_City')
        .format('DD/MM/YYYY HH:mm:ss')

      const info = await getChat(ms.from) || { antiLink: 0, onlyAdmin: 0, nsfw: 0 }

      const texto = `
> 𓂂𓏸 𐅹੭੭ \`G R U P O  •  I N F O\` 🔎

> ര 🏷 Nombre        : ${metadata.subject}
> ര 📜 Descripción   : ${metadata.desc?.toString() || 'Sin descripción'}

> 𓂂𓏸 𐅹੭੭ \`D A T O S  D E L  G R U P O\` 📍

> ര 📌 Creador       : @${owner.split('@')[0]}
> ര 👑 Admins        : ${admins.length}
> ര 👥️ Miembros      : ${metadata.participants.length}
> ര 🔐 Tipo          : ${metadata.announce ? 'Cerrado' : 'Abierto'}
> ര 📆 Creado el     : ${creationDate}
> ര 🆔️ ID            : ${metadata.id}

> 𓂂𓏸 𐅹੭੭ \`C O N F I G U R A C I Ó N\` 📚

> ര 🖇 Antilink      : ${info.antiLink === 1 ? '✅' : '❌'}
> ര 👑 Modo Admin    : ${info.onlyAdmin === 1 ? '✅' : '❌'}
> ര 🔞 NSFW          : ${info.nsfw === 1 ? '✅' : '❌'}
`

      await sylph.sendMessage(ms.from, { text: texto, mentions: [owner] }, { quoted: ms })
      
      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
    } catch (error) {
      console.error('Error en comando groupinfo:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await sylph.sendMessage(ms.from, { 
        text: '❌ Ocurrió un error al obtener la información del grupo.' 
      }, { quoted: ms });
    }
  }
}