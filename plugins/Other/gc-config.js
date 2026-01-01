module.exports = {
    command: ['group', 'grupo'],
    help: ['group'],
    group: true,
    admin: true,
    BotAdmin: true,
    description: '🔐 Abre o cierra el grupo para los miembros.',
    run: async (ms, { sylph, args }) => {
        const opcion = args[0]?.toLowerCase()
        const abrir = ['open', 'abrir', '1']
        const cerrar = ['close', 'cerrar', '0']

        if (!opcion || (!abrir.includes(opcion) && !cerrar.includes(opcion))) {
            return ms.reply(
                `*❀ Especifica una opción válida para administrar el grupo*:\n\n` +
                `┌❍ ⊹ Opciones válidas:\n` +
                `│ *✐ group abrir*\n` +
                `│ *✐ group cerrar*\n` +
                `│ *✐ group open*\n` +
                `│ *✐ group close*\n` +
                `│ *✐ group 1*\n` +
                `│ *✐ group 0*\n` +
                `└───────❍`
            )
        }

        const action = abrir.includes(opcion) ? 'not_announcement' : 'announcement'
        await sylph.groupSettingUpdate(ms.from, action)

        const msg = action === 'not_announcement'
            ? '> → El grupo ha sido *abierto*. Todos pueden escribir.💬'
            : '> → El grupo ha sido *cerrado*. Solo los admins pueden escribir.👑'

        await ms.reply(msg)
    }
}