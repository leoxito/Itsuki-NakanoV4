// _welcome.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ruta a la carpeta de assets
const assetsPath = path.join(__dirname, '../assets')

// Función para asegurarse de que la carpeta de assets exista
const ensureAssetsDir = () => {
    if (!fs.existsSync(assetsPath)) {
        fs.mkdirSync(assetsPath, { recursive: true })
    }
}

// Función para obtener la imagen (desde URL o local)
const getImageBuffer = async (chat, chatId, type) => {
    const imageUrl = type === 'welcome' ? chat.welcomeImageUrl : chat.byeImageUrl
    if (imageUrl) {
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
            return Buffer.from(response.data, 'binary')
        } catch (error) {
            console.error(`[WELCOME] Error al descargar la imagen desde URL: ${imageUrl}`, error)
        }
    }

    const customImagePath = path.join(assetsPath, `${type}_${chatId}.jpg`)
    if (fs.existsSync(customImagePath)) {
        return fs.readFileSync(customImagePath)
    }

    const defaultImagePath = path.join(assetsPath, `default_${type}.jpg`)
    if (fs.existsSync(defaultImagePath)) {
        return fs.readFileSync(defaultImagePath)
    }

    return null
}

// Función para formatear el número de miembro
const formatMemberNumber = (num) => {
    if (num % 100 >= 11 && num % 100 <= 13) return `${num}th`
    switch (num % 10) {
        case 1: return `${num}st`
        case 2: return `${num}nd`
        case 3: return `${num}rd`
        default: return `${num}th`
    }
}

let handler = async (m, { conn }) => {
    // El código de bienvenida y despedida va aquí...
    // (El resto del código que te di antes va aquí sin cambios)
    if (!m.messageStubType) return
    
    const chatId = m.chat
    const chat = global.db.data.chats[chatId] || {}
    const groupMetadata = await conn.groupMetadata(chatId)
    const groupName = groupMetadata.subject
    const groupDesc = groupMetadata.desc?.toString() || 'Sin descripción.'
    const groupMembersCount = groupMetadata.participants.length
    
    // Mensaje de bienvenida
    if (m.messageStubType === 27) {
        const user = m.messageStubParameters[0] + '@s.whatsapp.net'
        const userName = conn.getName(user)
        const memberNumber = formatMemberNumber(groupMembersCount)
        
        let welcomeMessage = chat.welcomeMessage || 
            `╭─「 ✨ *BIENVENIDO/A* ✨ 」\n` +
            `│\n` +
            `│ 👋 ¡Hola, @${user.split('@')[0]}!\n` +
            `│\n` +
            `│ 📝 *Nombre:* ${userName}\n` +
            `│ 🏷️ *Usuario:* @${user.split('@')[0]}\n` +
            `│ 🔢 *Eres el:* ${memberNumber} miembro\n` +
            `│ 👥 *Total de miembros:* ${groupMembersCount}\n` +
            `│ 📋 *Grupo:* ${groupName}\n` +
            `│ 🆔 *ID del grupo:* ${chatId}\n` +
            `│\n` +
            `│ 📜 *Descripción del grupo:*\n` +
            `│ ${groupDesc}\n` +
            `│\n` +
            `╰─◉`
        
        await conn.sendMessage(chatId, { 
            text: welcomeMessage, 
            mentions: [user] 
        }, { quoted: m })

        const imageBuffer = await getImageBuffer(chat, chatId, 'welcome')
        if (imageBuffer) {
            await conn.sendMessage(chatId, { 
                image: imageBuffer, 
                caption: '¡Disfruta tu estancia en el grupo! 🎉'
            }, { quoted: m })
        }
    }
    
    // Mensaje de despedida
    if (m.messageStubType === 28) {
        const user = m.messageStubParameters[0] + '@s.whatsapp.net'
        const userName = conn.getName(user)
        const memberNumber = formatMemberNumber(groupMembersCount + 1)
        
        let byeMessage = chat.byeMessage || 
            `╭─「 👋 *DESPEDIDA* 👋 」\n` +
            `│\n` +
            `│ 👋 @${user.split('@')[0]} ha abandonado el grupo.\n` +
            `│\n` +
            `│ 📝 *Nombre:* ${userName}\n` +
            `│ 🏷️ *Usuario:* @${user.split('@')[0]}\n` +
            `│ 🔢 *Era el:* ${memberNumber} miembro\n` +
            `│ 👥 *Ahora hay:* ${groupMembersCount} miembros\n` +
            `│ 📋 *Grupo:* ${groupName}\n` +
            `│ 🆔 *ID del grupo:* ${chatId}\n` +
            `│\n` +
            `╰─◉`
        
        await conn.sendMessage(chatId, { 
            text: byeMessage, 
            mentions: [user] 
        }, { quoted: m })

        const imageBuffer = await getImageBuffer(chat, chatId, 'bye')
        if (imageBuffer) {
            await conn.sendMessage(chatId, { 
                image: imageBuffer, 
                caption: '¡Esperamos verte pronto! 👋'
            }, { quoted: m })
        }
    }
}

export default handler