const canalOficial = "120363183614708156@newsletter";
const reactedMessageIds = new Set();

function remoji() {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "👀", "👅", "🙏", "🥺", "🤤", "😈", "😹", "😿", "🙀", "🍆"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

module.exports = {
  command: ['_reacted'],
  all: async (ms, { sylph }) => {
    try {
      if (!ms.message || (ms.from || "").trim().toLowerCase() !== canalOficial) return true;

      const rawId = ms.key.id;
      if (reactedMessageIds.has(rawId)) return true;

      const visibleId = ms.newsletterServerId?.toString();
      if (!visibleId) return true;

      const metadata = await sylph.newsletterMetadata("jid", ms.from);
      const emoji = remoji();
      await sylph.newsletterReactMessage(metadata.id, visibleId, emoji);

      reactedMessageIds.add(rawId);
      console.log(`Reaccioné con ${emoji} en canal ${metadata.name} (mensaje ${visibleId})`);
    } catch (e) {
      console.error("Error al reaccionar en canal oficial:", e);
    }

    return true;
  }
};