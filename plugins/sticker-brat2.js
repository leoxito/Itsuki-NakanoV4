import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    //Fixieada por ZzawX
    
    try {
        await m.react('🕒');

        if (!text) {
            await m.react('❔');
            return conn.reply(m.chat, 
                '> `❌ TEXTO FALTANTE`\n\n' +
                '> `📝 Debes escribir texto después del comando`\n\n' +
                '> `💡 Ejemplo:` *' + usedPrefix + command + ' texto aquí*', 
                m
            );
        }

        const username = m.pushName || m.sender.split('@')[0] || "Usuario";
        
        // API principal para sticker animado
        const primaryApiUrl = `https://apizell.web.id/tools/bratanimate?q=${encodeURIComponent(text)}`;
        
        // API secundaria como fallback
        const fallbackApiUrl = `https://api.siputzx.my.id/api/m/bratvideo?text=${encodeURIComponent(text)}`;

        let stickerBuffer;
        let apiUsed = "ZellAPI";

        try {
            console.log('🔍 Probando API principal como JSON primero...');
            
            // INTENTO 1: Probar como JSON
            try {
                const jsonResponse = await axios({
                    method: 'GET',
                    url: primaryApiUrl,
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json, */*'
                    }
                });

                console.log('📄 Respuesta JSON recibida:', typeof jsonResponse.data);
                
                if (jsonResponse.data && typeof jsonResponse.data === 'object') {
                    console.log('📊 Estructura JSON:', Object.keys(jsonResponse.data));
                    
                    // Extraer URL de imagen del JSON (como en brat original)
                    let imageUrl;
                    
                    if (jsonResponse.data.url) {
                        imageUrl = jsonResponse.data.url;
                    } else if (jsonResponse.data.result && jsonResponse.data.result.url) {
                        imageUrl = jsonResponse.data.result.url;
                    } else if (jsonResponse.data.result && typeof jsonResponse.data.result === 'string') {
                        imageUrl = jsonResponse.data.result;
                    }
                    
                    if (imageUrl) {
                        console.log('🖼️ URL encontrada en JSON:', imageUrl);
                        
                        const imageResponse = await axios({
                            method: 'GET',
                            url: imageUrl,
                            responseType: 'arraybuffer',
                            timeout: 10000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        });
                        
                        stickerBuffer = Buffer.from(imageResponse.data);
                        console.log('✅ Imagen descargada desde URL JSON:', stickerBuffer.length, 'bytes');
                    } else {
                        throw new Error('No se encontró URL en JSON');
                    }
                } else {
                    throw new Error('No es JSON válido');
                }
                
            } catch (jsonError) {
                console.log('❌ No es JSON, probando como imagen directa...');
                
                // INTENTO 2: Probar como imagen/video directo
                const directResponse = await axios({
                    method: 'GET',
                    url: primaryApiUrl,
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'image/*,video/*,*/*'
                    }
                });
                
                stickerBuffer = Buffer.from(directResponse.data);
                console.log('✅ Imagen descargada directamente:', stickerBuffer.length, 'bytes');
            }

            // Verificar que sea válido
            if (!stickerBuffer || stickerBuffer.length < 100) {
                throw new Error('Archivo inválido');
            }

        } catch (primaryError) {
            console.log('❌ API principal falló:', primaryError.message);
            console.log('🔄 Intentando con API secundaria...');
            
            try {
                // Probar API secundaria
                const fallbackResponse = await axios({
                    method: 'GET',
                    url: fallbackApiUrl,
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'image/*,video/*,*/*'
                    }
                });
                
                stickerBuffer = Buffer.from(fallbackResponse.data);
                apiUsed = "API Secundaria";
                console.log('✅ Usando API secundaria:', stickerBuffer.length, 'bytes');

            } catch (fallbackError) {
                throw new Error(`Ambas APIs fallaron`);
            }
        }

        await m.react('✅️');

        console.log(`🎨 Enviando sticker animado (Fuente: ${apiUsed})`);
        
        // Enviar sticker con metadata
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer,
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: `𝐈𝐭𝐬𝐮𝐤𝐢𝐁𝐨𝐭-𝐌𝐃`,
                    body: `𝗦𝗼𝗹𝗶𝗰𝗶𝘁𝗮𝗱𝗼 𝗽𝗼𝗿: ${username}\n𝗖𝗿𝗲𝗮𝗱𝗼𝗿: 𝗟𝗲𝗼𝗗𝗲𝘃`,
                    thumbnailUrl: 'https://files.catbox.moe/yxcu1g.png',
                    sourceUrl: 'https://whatsapp.com/channel/0029Va9VhS8J5+50254766704',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (error) {
        console.error('❌ Error en brat2:', error);
        
        await m.react('❌');
        
        let errorMessage = '> `❌ ERROR ENCONTRADO`\n\n';
        
        if (error.message.includes('Ambas APIs fallaron')) {
            errorMessage += '> `📝 Todos los servicios están temporalmente no disponibles. Intenta más tarde.`';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage += '> `⏰ Tiempo de espera agotado. Intenta de nuevo.`';
        } else if (error.response) {
            errorMessage += '> `📝 Error en la API: ' + error.response.status + '`';
        } else if (error.request) {
            errorMessage += '> `📝 No se pudo conectar con el servicio.`';
        } else {
            errorMessage += '> `📝 ' + error.message + '`';
        }

        await conn.reply(m.chat, errorMessage, m);
    }
};

handler.help = ['brat2'];
handler.tags = ['sticker'];
handler.command = ['brat2'];
handler.group = true;

export default handler;