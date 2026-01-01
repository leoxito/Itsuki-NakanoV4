const axios = require('axios');

module.exports = {
command: ["ia", "ai", "gpt", "chatgpt"],
help: ["chatgpt"],
run: async(ms, { sylph, text }) => {
if (!text) return ms.reply("> *✐ Ingresa un texto o petición.*")
try {
const resp = await gpt(text)
await ms.reply(resp)
} catch(e) {
ms.reply("Ocurrió un error : " + e)
     }
  }
}
async function gpt(prompt) {
    try {
        const { data } = await axios.post('https://us-central1-openaiprojects-1fba2.cloudfunctions.net/chat_gpt_ai/api.live.text.gen', {
            model: 'gpt-4o-mini',
            temperature: 0.2,
            top_p: 0.2,
            prompt: prompt
        }, {
            headers: {
                'content-type': 'application/json; charset=UTF-8'
            }
        });
        
        return data.choices[0].message.content;
    } catch (error) {
        throw new Error(error.message);
    }
}