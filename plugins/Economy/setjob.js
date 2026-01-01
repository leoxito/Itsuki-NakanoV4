const trabajos = [
  'Granjero',
  'Cazador',
  'Médico',
  'Ingeniero',
  'Chef',
  'Ladrón',
  'Maestro',
  'Policía',
  'Programador',
  'Streamer'
];

module.exports = {
  command: ['setjob', 'setwork'],
  help: ["setjob"],
  description: 'Elige un trabajo de la lista disponible.',
  run: async (ms, { text, sylph }) => {
    try {
      if (!text) {
        let lista = trabajos.map((t, i) => `│ ${i + 1}. ${t}`).join('\n');
        
        // Enviar reacción de búsqueda (mostrar lista)
        await sylph.sendMessage(ms.from, { react: { text: "📋", key: ms.key } });
        
        return ms.reply(
`*✐ Elige un trabajo con .setjob <nombre> o <número>*

┌─「 *Trabajos disponibles* 」
${lista}
└─`
        );
      }

      // Enviar reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

      let seleccion = text.trim().toLowerCase();
      let trabajo = null;

      if (!isNaN(seleccion)) {
        let index = parseInt(seleccion) - 1;
        if (index >= 0 && index < trabajos.length) {
          trabajo = trabajos[index];
        }
      } else {
        trabajo = trabajos.find(t => t.toLowerCase() === seleccion);
      }

      if (!trabajo) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply('*ꕥ Trabajo no válido. Usa el comando sin argumentos para ver la lista.*');
      }

      await updateUser(ms.sender, 'job', trabajo);
      
      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
      return ms.reply(`> ✦ Has elegido el trabajo: *${trabajo}*`);
      
    } catch (error) {
      console.error('Error en comando setjob:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      return ms.reply('Ocurrió un error al establecer el trabajo.');
    }
  }
};