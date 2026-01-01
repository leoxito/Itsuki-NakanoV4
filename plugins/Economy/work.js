const cooldown = new Map();

const jobs = {
  Granjero: { coins: [30, 60], exp: 10 },
  Cazador: { coins: [40, 70], exp: 15 },
  Doctor: { coins: [50, 90], exp: 18 },
  Ingeniero: { coins: [45, 85], exp: 14 },
  Chef: { coins: [35, 65], exp: 12 },
  Ladrón: { coins: [60, 120], exp: 20 },
  Maestro: { coins: [25, 55], exp: 10 },
  Policía: { coins: [40, 75], exp: 16 },
  Programador: { coins: [50, 100], exp: 17 },
  Minero: { coins: [20, 50], exp: 14, gold: [1, 3] }
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function levelUp(level, exp) {
  return exp >= (level * 100 + 100);
}

module.exports = {
  command: ['work', 'job', 'w'],
  help: ["work"],
  description: 'Trabaja según tu oficio y gana monedas, experiencia y más.',
  run: async (ms, { sylph }) => {
    try {
      const user = await getUser(ms.sender);
      const trabajo = user.job;

      if (!trabajo) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply('*✐ Aún no tienes un trabajo.*\n> ✦ Usa *.setjob* para elegir uno.');
      }

      const last = cooldown.get(ms.sender) || 0;
      const now = Date.now();

      if (now - last < 30000) {
        const time = Math.ceil((30000 - (now - last)) / 1000);
        await sylph.sendMessage(ms.from, { react: { text: "⏱️", key: ms.key } });
        return ms.reply(`⏱️ Debes esperar *${time}s* antes de volver a trabajar.`);
      }

      const data = jobs[trabajo];
      if (!data) {
        await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
        return ms.reply(`> ✧ El trabajo *${trabajo}* no es válido.`);
      }

      // Enviar reacción de procesamiento
      await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });

      const coins = rand(...data.coins);
      const exp = data.exp;
      const newExp = user.exp + exp;
      const newCoins = user.coin + coins;
      let newLevel = user.level;
      let msg = `> 💼 Trabajaste como *${trabajo}*\n\n> 💰 Monedas: +${coins}\n> ✨ Exp: +${exp}`;

      if (levelUp(user.level, newExp)) {
        newLevel++;
        msg += `\n> 🆙 ¡Subiste al nivel *${newLevel}*!`;
      }

      await updateUser(ms.sender, 'coin', newCoins);
      await updateUser(ms.sender, 'exp', newExp);
      if (newLevel > user.level) await updateUser(ms.sender, 'level', newLevel);

      if (data.gold) {
        const gold = rand(...data.gold);
        const totalGold = user.gold + gold;
        await updateUser(ms.sender, 'gold', totalGold);
        msg += `\n> 🏆 ¡Encontraste ${gold} de oro mientras trabajabas!`;
      }

      const bonus = Math.random() < 0.2;
      if (bonus) {
        const bonusAmount = rand(50, 100);
        const newBank = user.bank + bonusAmount;
        await updateUser(ms.sender, 'bank', newBank);
        msg += `\n> 💎 Recibiste un bono de *${bonusAmount}* en tu banco por ser un excelente trabajador.`;
      }

      cooldown.set(ms.sender, now);
      
      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅", key: ms.key } });
      
      await ms.reply(msg);
      
    } catch (error) {
      console.error('Error en comando work:', error);
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
      await ms.reply('Ocurrió un error al procesar tu trabajo.');
    }
  }
};