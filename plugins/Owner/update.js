const { execSync } = require('child_process')

module.exports = {
    command: ['update', 'up', 'actualizar'],
    help: ['update'],
    tags: ['owner'],
    description: 'Actualiza el repositorio desde GitHub',
    run: async (ms, { text, isOwner }) => {
        if (!isOwner) return

        try {
            const stdout = execSync(
                'git pull --rebase --autostash' + (ms.fromMe && text ? ' ' + text : ''),
                { stdio: 'pipe' }
            )

            let message = stdout.toString()

            if (/Already up to date|Already up-to-date/.test(message)) {
                message = '*✐ El repositorio ya está actualizado.*'
            } else {
                message = '✐ Procesando, espere un momento mientras me actualizo.\n\n' + message
            }

            await ms.reply(message)
        } catch (error) {
            let msg = '⚠︎ No se pudo realizar la actualización.'
            if (error.stderr) msg += '\n\n' + error.stderr.toString()
            else if (error.message) msg += '\n\n' + error.message
            await ms.reply(msg)
        }
    }
}
