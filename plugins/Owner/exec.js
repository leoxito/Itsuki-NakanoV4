const util = require('util');
const config = require('../../config');

module.exports = {
    customPrefix: ['>', '=>'],
    help: [">", "=>"],
    description: 'Ejecuta un código sin usar la consola (solo propietario).',
    
    run: async (ms, { sylph, args, isOwner, text }) => {
        if (!isOwner) {
            return
        }

        if (!text) {
            return ms.reply('🌳 Introduzca el código que desea ejecutar.');
        }

        try {
            let result = await eval(`(async () => { ${text} })()`);
            let output = util.inspect(result, { depth: 1 });
            
            if (output.length > 4000) output = output.slice(0, 4000) + '...';

            await ms.reply('```' + output + '```');
        } catch (e) {
            await ms.reply(`🚫 Error:\n\`\`\`${e.message}\`\`\``);
        }
    }
};