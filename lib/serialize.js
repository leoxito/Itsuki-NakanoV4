const { proto, getContentType, downloadMediaMessage } = require('@whiskeysockets/baileys');
const baileys = require("@whiskeysockets/baileys")
const { getBuffer } = require('./functions');
const sharp = require('sharp');
const fileType = require('file-type');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fetch = require('node-fetch'); // Asegúrate de tener esta importación
const fs = require('fs'); // Asegúrate de tener esta importación

exports.serialize = async (sock, m) => {
    if (!m) return m;

    if (m.key) {
        m.id = m.key.id;
        m.isGroup = m.key?.remoteJid.endsWith('@g.us');
        m.isBaileys = m.id?.startsWith?.('BAE5') || false;
        m.from = m.key?.remoteJid;
        m.fromMe = m.key?.fromMe;
        m.sender = m.fromMe
            ? (sock.user.id.split(':')[0] + '@s.whatsapp.net' || sock.user.id)
            : (m.key.participant || m.key.remoteJid);
    }

    if (m.message) {
        m.type = getContentType(m.message);
        m.msg = m.type === 'viewOnceMessage'
            ? m.message[m.type].message[getContentType(m.message[m.type].message)]
            : m?.message[m.type];

        m.body = m?.message?.conversation ||
            m.msg?.text ||
            m.msg?.caption ||
            m?.msg?.selectedButtonId ||
            m?.msg?.singleSelectReply?.selectedRowId ||
            m.msg?.selectedId ||
            '';

        m.reply = (text) => sock.sendMessage(m.from, { text }, { quoted: m });
        m.send = (text) => sock.sendMessage(m.from, { text });
        m.target = (jid, text) => sock.sendMessage(jid, { text });
        m.sendMessage = (jid, content, options = {}) => sock.sendMessage(jid, content, options);

        m.sticker = async (media, author = '', packname = '') => {
            const buffer = await getBuffer(media);
            const isAnimated = buffer.slice(0,4).toString('hex') === '52494646';  
            const sticker = new Sticker(buffer, {
                pack: packname || '',
                author: author || '',
                type: isAnimated ? StickerTypes.ANIMATION : StickerTypes.DEFAULT,
                quality: 60,
                animated: isAnimated,
            });
            const stickerBuffer = await sticker.toBuffer();
            return await sock.sendMessage(m.from, { sticker: stickerBuffer }, { quoted: m });
        };

        m.media = async (caption, media) => {
            if (!media) {
                media = caption;
                caption = '';
            }
            const data = await getBuffer(media);
            const type = await fileType.fromBuffer(data) || { mime: 'application/octet-stream' };

            const options = /image/.test(type.mime)
                ? { image: data, caption }
                : /video/.test(type.mime)
                ? { video: data, caption }
                : /audio/.test(type.mime)
                ? { audio: data, mimetype: 'audio/mp4' }
                : {};

            return sock.sendMessage(m.from, options, { quoted: m });
        };

        m.sendAudio = async (caption, input) => {
            const data = await getBuffer(input);
            return sock.sendMessage(m.from, {
                audio: data,
                mimetype: 'audio/mp4',
                ptt: false,
                caption
            }, { quoted: m });
        };

        m.sendVideo = async (caption, input) => {
            const data = await getBuffer(input);
            return sock.sendMessage(m.from, {
                video: data,
                caption
            }, { quoted: m });
        };

        m.sendDoc = async (caption, filename, input, thumb) => {
            let data;

            if (Buffer.isBuffer(input)) {
                data = input;
            } else if (typeof input === 'string') {
                if (/^https?:\/\//.test(input)) {
                    data = await fetch(input).then(r => r.arrayBuffer()).then(Buffer.from);
                } else {
                    data = fs.readFileSync(input);
                }
            } else {
                throw new Error('input debe ser Buffer, URL o path');
            }

            const type = await fileType.fromBuffer(data) || { ext: 'bin', mime: 'application/octet-stream' };

            let thumbBuffer = null;
            if (thumb) {
                let thumbData;

                if (Buffer.isBuffer(thumb)) {
                    thumbData = thumb;
                } else if (typeof thumb === 'string') {
                    if (/^https?:\/\//.test(thumb)) {
                        thumbData = await fetch(thumb).then(r => r.arrayBuffer()).then(Buffer.from);
                    } else {
                        thumbData = fs.readFileSync(thumb);
                    }
                }

                if (thumbData) {
                    thumbBuffer = await sharp(thumbData)
                        .resize(400, 400, { fit: 'cover' })
                        .jpeg()
                        .toBuffer();
                }
            }

            return sock.sendMessage(m.from, {
                document: data,
                mimetype: type.mime,
                fileName: `${filename}.${type.ext}`,
                jpegThumbnail: thumbBuffer,
                caption
            }, { quoted: m });
        }

        m.download = () => downloadMediaMessage(m, 'buffer', {});

        const quoted = m.msg?.contextInfo;
        if (quoted?.quotedMessage) {
            const type = getContentType(quoted.quotedMessage);
            const msg = quoted.quotedMessage[type];

            m.quoted = {
                type,
                msg,
                id: quoted.stanzaId,
                sender: quoted.participant,
                user: quoted.participant,
                fromMe: quoted.participant === sock.user.id,
                isBaileys: quoted.stanzaId?.startsWith?.('BAE5') || false,
                text: msg?.text || msg?.caption || '',
                download: () => downloadMediaMessage({ message: { [type]: msg } }, 'buffer', {})
            };
        }

        // CORRECCIÓN: Función Mentions arreglada
        m.Mentions = async (text = '') => {
            try {
                if (!text || typeof text !== 'string') return [];
                
                const matches = [...text.matchAll(/@(\d{5,})/g)];
                const jids = [];

                if (m.isGroup && Array.isArray(m.participants)) {
                    for (const [, raw] of matches) {
                        let jid = `${raw}@s.whatsapp.net`;

                        // CORRECCIÓN: Verificar que m.participants y cada p existan
                        const found = m.participants.find(p => {
                            if (!p || !p.id) return false;
                            
                            // Verificar que p.id sea una string antes de llamar a .includes()
                            if (typeof p.id === 'string' && p.id.includes) {
                                return p.id.includes(raw) || p.id.replace(/\D/g, '') === raw;
                            }
                            
                            // Si p.id no es string pero tiene .toString(), usarlo
                            if (p.id && p.id.toString) {
                                const idStr = p.id.toString();
                                return idStr.includes(raw) || idStr.replace(/\D/g, '') === raw;
                            }
                            
                            return false;
                        });

                        if (found && found.id) {
                            jid = found.id;
                        }

                        jids.push(jid);
                    }
                } else {
                    for (const [, raw] of matches) {
                        jids.push(`${raw}@s.whatsapp.net`);
                    }
                }

                return [...new Set(jids)];
            } catch (error) {
                console.error('Error en m.Mentions:', error.message);
                return [];
            }
        }

        m.sendAlbum = async function (jid, medias, options = {}) {
            if (typeof jid !== "string") {
                throw new TypeError(`jid must be string, received: ${jid} (${jid?.constructor?.name})`)
            }

            for (const media of medias) {
                if (!media.type || (media.type !== "image" && media.type !== "video")) {
                    throw new TypeError(`media.type must be "image" or "video", received: ${media.type} (${media.type?.constructor?.name})`)
                }
                if (!media.data || (!media.data.url && !Buffer.isBuffer(media.data))) {
                    throw new TypeError(`media.data must have .url or Buffer, received: ${media.data} (${media.data?.constructor?.name})`)
                }
            }

            if (medias.length < 2) {
                throw new RangeError("Minimum 2 media")
            }

            const delay = !isNaN(options.delay) ? options.delay : 500
            delete options.delay

            const album = baileys.generateWAMessageFromContent(
                jid,
                {
                    messageContextInfo: {},
                    albumMessage: {
                        expectedImageCount: medias.filter(m => m.type === "image").length,
                        expectedVideoCount: medias.filter(m => m.type === "video").length,
                        ...(options.quoted
                            ? {
                                contextInfo: {
                                    remoteJid: options.quoted.key.remoteJid,
                                    fromMe: options.quoted.key.fromMe,
                                    stanzaId: options.quoted.key.id,
                                    participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                                    quotedMessage: options.quoted.message,
                                },
                            }
                            : {}),
                    },
                },
                {}
            )

            await sock.relayMessage(album.key.remoteJid, album.message, { messageId: album.key.id })

            for (let i = 0; i < medias.length; i++) {
                const { type, data, caption } = medias[i]

                const message = await baileys.generateWAMessage(
                    album.key.remoteJid,
                    { [type]: data, caption: caption || "" },
                    { upload: sock.waUploadToServer }
                )

                message.message.messageContextInfo = {
                    messageAssociation: { associationType: 1, parentMessageKey: album.key },
                }

                await sock.relayMessage(message.key.remoteJid, message.message, { messageId: message.key.id })
                await baileys.delay(delay)
            }

            return album
        }
    }

    return m;
};