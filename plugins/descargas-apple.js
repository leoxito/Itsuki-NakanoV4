import fs from 'node:fs'
import path from 'node:path'
import axios from 'axios'
import fetch from 'node-fetch'
import { pipeline } from 'node:stream/promises'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'

const BASE_URL = 'https://aaplmusicdownloader.com'
const API_PATH = '/api/composer/swd.php'
const SONG_PAGE = '/song.php'
const DEFAULT_MIME = 'application/x-www-form-urlencoded; charset=UTF-8'
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const FALLBACK_FILENAME = 'apple-track.m4a'
const CACHE_TTL_MS = 10 * 60 * 1000

const appleCache = global.__APPLE_SEARCH_CACHE__ || new Map()
global.__APPLE_SEARCH_CACHE__ = appleCache

function buildKey(chatId, messageId) {
  return `${chatId}::${messageId}`
}

function cleanupExpired() {
  const now = Date.now()
  for (const [key, entry] of appleCache.entries()) {
    if (!entry?.createdAt || now - entry.createdAt > CACHE_TTL_MS) {
      appleCache.delete(key)
    }
  }
}

function getAppleResults(chatId, messageId) {
  if (!chatId || !messageId) return null
  cleanupExpired()
  const entry = appleCache.get(buildKey(chatId, messageId))
  if (!entry) return null
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    appleCache.delete(buildKey(chatId, messageId))
    return null
  }
  return entry.results
}

function pickAppleResult(chatId, messageId, index) {
  const results = getAppleResults(chatId, messageId)
  if (!results) return null
  if (!Number.isInteger(index) || index < 1 || index > results.length) return null
  return results[index - 1]
}

function extractQuotedMeta(m) {
  if (!m || !m.quoted) return { chatId: null, messageId: null }
  const quoted = m.quoted.fakeObj || m.quoted
  const key = quoted?.key || {}
  const messageId = key.id || quoted?.id || null
  const chatId = key.remoteJid || quoted?.chat || m.chat || null
  return { chatId, messageId }
}

const { promises: fsp } = fs
const jar = new CookieJar()
const client = wrapper(
  axios.create({
    baseURL: BASE_URL,
    jar,
    withCredentials: true,
    headers: {
      'user-agent': DEFAULT_USER_AGENT,
      accept: 'application/json, text/javascript, */*; q=0.01',
      referer: `${BASE_URL}${SONG_PAGE}`
    }
  })
)

function parseArgs(tokens = []) {
  const options = {
    songName: '',
    artistName: '',
    appleUrl: '',
    quality: 'm4a',
    zipDownload: false,
    token: 'none',
    outputPath: null,
    skipDownload: false
  }
  const leftovers = []
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (!token) continue
    switch (token.toLowerCase()) {
      case '--song':
      case '-s':
        options.songName = tokens[i + 1] ?? ''
        i += 1
        break
      case '--artist':
      case '-a':
        options.artistName = tokens[i + 1] ?? ''
        i += 1
        break
      case '--url':
      case '--apple-url':
        options.appleUrl = tokens[i + 1] ?? ''
        i += 1
        break
      case '--quality':
      case '-q':
        options.quality = tokens[i + 1] ?? 'm4a'
        i += 1
        break
      case '--zip':
        options.zipDownload = true
        break
      case '--token':
        options.token = tokens[i + 1] ?? 'none'
        i += 1
        break
      case '--out':
      case '-o':
        options.outputPath = tokens[i + 1] ?? null
        i += 1
        break
      case '--skip-download':
        options.skipDownload = true
        break
      default:
        leftovers.push(token)
        break
    }
  }
  if (!options.appleUrl) {
    const candidate = leftovers.find(value => /^https?:\/\//i.test(value))
    if (candidate) options.appleUrl = candidate
  }
  if (!options.songName) options.songName = leftovers[0] && !/^https?:\/\//i.test(leftovers[0]) ? leftovers[0] : 'Unknown'
  return options
}

async function warmUpSession() {
  await client.get(SONG_PAGE, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9'
    },
    params: { cacheBust: Date.now() }
  })
}

function buildPayload({ songName, artistName, appleUrl, quality, zipDownload, token }) {
  const payload = new URLSearchParams()
  payload.set('song_name', songName)
  payload.set('artist_name', artistName)
  payload.set('url', appleUrl)
  payload.set('token', token)
  payload.set('zip_download', String(Boolean(zipDownload)))
  payload.set('quality', quality)
  return payload.toString()
}

async function requestDownloadLink(params) {
  const body = buildPayload(params)
  const response = await client.post(API_PATH, body, {
    headers: {
      'content-type': DEFAULT_MIME,
      'x-requested-with': 'XMLHttpRequest',
      origin: BASE_URL
    }
  })
  if (!response.data || response.data.status !== 'success' || !response.data.dlink) {
    throw new Error(`API responded without a download link: ${JSON.stringify(response.data)}`)
  }
  return response.data.dlink
}

function inferFilename(downloadUrl, fallback = FALLBACK_FILENAME) {
  try {
    const parsed = new URL(downloadUrl)
    const queryName = parsed.searchParams.get('fname')
    const fromQuery = queryName ? decodeURIComponent(queryName.trim()) : ''
    const pathCandidate = decodeURIComponent(parsed.pathname.split('/').pop() ?? '').trim()
    const picked = fromQuery || pathCandidate || fallback
    if (!path.extname(picked)) {
      return `${picked}.m4a`
    }
    return picked
  } catch {
    return fallback
  }
}

async function resolveOutputPath(downloadUrl, customPath) {
  const fallbackName = inferFilename(downloadUrl)
  if (!customPath) {
    const tempDir = path.join(process.cwd(), 'tmp', 'applemusic')
    await fsp.mkdir(tempDir, { recursive: true })
    return path.join(tempDir, fallbackName)
  }
  const resolved = path.resolve(customPath)
  try {
    const stats = await fsp.stat(resolved)
    if (stats.isDirectory()) {
      return path.join(resolved, fallbackName)
    }
    return resolved
  } catch {
    if (customPath.endsWith('/') || customPath.endsWith('\\')) {
      await fsp.mkdir(resolved, { recursive: true })
      return path.join(resolved, fallbackName)
    }
    await fsp.mkdir(path.dirname(resolved), { recursive: true })
    return resolved
  }
}

async function downloadFile(downloadUrl, outputPath) {
  const destination = await resolveOutputPath(downloadUrl, outputPath)
  await fsp.mkdir(path.dirname(destination), { recursive: true })
  const response = await axios.get(downloadUrl, {
    responseType: 'stream',
    headers: {
      referer: `${BASE_URL}${SONG_PAGE}`,
      'user-agent': DEFAULT_USER_AGENT,
      accept: '*/*'
    }
  })
  await pipeline(response.data, fs.createWriteStream(destination))
  return destination
}

function pickMimetype(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === '.mp3') return 'audio/mpeg'
  if (ext === '.m4a' || ext === '.mp4' || ext === '.aac') return 'audio/mp4'
  if (ext === '.zip') return 'application/zip'
  return 'application/octet-stream'
}

// Quoted especial con mini-thumbnail
async function makeFkontak() {
  try {
    const res = await fetch('https://i.postimg.cc/W3RsYXJ5/applemusic-(1)-(1)-(1)-(1).png')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: { locationMessage: { name: 'Applemusic', jpegThumbnail: thumb2 } },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return undefined
  }
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const options = parseArgs(args)
  const quotedContact = await makeFkontak()
  const numericSelection = (!options.appleUrl && args?.length) ? Number.parseInt(args[0], 10) : NaN
  if (!options.appleUrl && Number.isInteger(numericSelection) && numericSelection > 0) {
    const { chatId, messageId } = extractQuotedMeta(m)
    if (!chatId || !messageId) {
      return conn.reply(
        m.chat,
        `Responde al mensaje de resultados de ${usedPrefix}applesearch con *${usedPrefix}${command} ${numericSelection}* para elegir esa pista.`,
        quotedContact || m
      )
    }
    const picked = pickAppleResult(chatId, messageId, numericSelection)
    if (!picked?.appleUrl) {
      return conn.reply(
        m.chat,
        'Ese número no está disponible o expiró. Ejecuta de nuevo *applesearch* para actualizar la lista.',
        quotedContact || m
      )
    }
    options.appleUrl = picked.appleUrl
    options.songName = picked.title || 'Unknown'
    options.artistName = picked.artist || 'Unknown'
  }
  if (!options.appleUrl) {
    return conn.reply(
      m.chat,
      `Uso: ${usedPrefix}${command} --url <link_apple_music> [--song <nombre>] [--artist <artista>] [--quality m4a|mp3] [--skip-download]\nEjemplo: ${usedPrefix}${command} --url https://music.apple.com/... --quality mp3\n\nTambién puedes buscar con ${usedPrefix}applesearch y responder a ese mensaje con ${usedPrefix}${command} <número> para descargar.`,
      quotedContact || m
    )
  }
  await m.react?.('⏳')
  try {
    const params = {
      songName: options.songName || 'Unknown',
      artistName: options.artistName || 'Unknown',
      appleUrl: options.appleUrl,
      quality: options.quality,
      zipDownload: options.zipDownload,
      token: options.token
    }
    await warmUpSession()
    const downloadLink = await requestDownloadLink(params)
    if (options.skipDownload) {
      await conn.reply(m.chat, `URL directa:\n${downloadLink}`, quotedContact || m)
      await m.react?.('✅')
      return true
    }
    const savedTo = await downloadFile(downloadLink, options.outputPath)
    const fileBuffer = await fsp.readFile(savedTo)
    const mimetype = pickMimetype(savedTo)
    const isAudio = mimetype.startsWith('audio/')
    const caption = `Apple Music Downloader\n• Canción: ${params.songName}\n• Artista: ${params.artistName}\n• Calidad: ${params.quality}`

    if (isAudio) {
      await conn.sendMessage(
        m.chat,
        { audio: fileBuffer, mimetype, fileName: path.basename(savedTo), ptt: false },
        { quoted: quotedContact || m }
      )
    } else {
      await conn.sendMessage(
        m.chat,
        { document: fileBuffer, mimetype, fileName: path.basename(savedTo), caption },
        { quoted: quotedContact || m }
      )
    }

    await fsp.unlink(savedTo).catch(() => null)
    await m.react?.('✅')
    return true
  } catch (error) {
    await m.react?.('❌')
    const message = error?.message || 'Error desconocido'
    return conn.reply(m.chat, `Apple Music scrape falló: ${message}`, quotedContact || m)
  }
}

/*handler.help = ['applemusic', 'appledl']
handler.tags = ['dl']*/
handler.command = /^(applemusic|appledl|appletrack)$/i

export default handler
