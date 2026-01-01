const os = require('os');
const process = require('process');

function formatUptime(seconds) {
    function pad(s) {
        return (s < 10 ? '0' : '') + s;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    seconds = Math.floor(seconds % 60);
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

module.exports = {
    command: ['ping', 'p'],
    help: ["ping"],
    description: 'Verifique la velocidad de respuesta y el estado del bot.',
    run: async (ms, { sylph, args }) => {
        const startTime = Date.now();

        const tempMsg = await sylph.sendMessage(ms.from, { text: 'Calculando ping . . .' }, { quoted: ms });

        const latency = Date.now() - startTime;
        const usedMem = process.memoryUsage().heapUsed / 1024 / 1024;
        const totalMem = os.totalmem() / 1024 / 1024;
        const uptime = process.uptime();

        const responseText = `> 𓂂𓏸 𐅹੭੭ \`P O N G  •  S T A T U S\` 🏓

> *✐ Speed » ${latency} ms*
> *❐ Uptime » ${formatUptime(uptime)}*
> *❀ RAM » ${usedMem.toFixed(2)} MB / ${totalMem.toFixed(2)} MB*
`

        await sylph.sendMessage(ms.from, {
            text: responseText,
            edit: tempMsg.key
        }, { quoted: ms });
    }
};