#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'
import axios from 'axios'
import FormData from 'form-data'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

export const LANDING_URL = 'https://www.iloveimg.com/upscale-image'
export const VALID_SCALES = new Set([2, 4, 8])
const API_VERSION = 'v1'
const APP_VERSION = 'web.0'
const DEFAULT_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9'
}

function createHttpClient() {
  const jar = new CookieJar()
  const client = wrapper(axios.create({
    headers: { ...DEFAULT_HEADERS },
    jar,
    withCredentials: true,
    timeout: 25_000,
    validateStatus: (status) => status >= 200 && status < 400
  }))
  return { client, jar }
}

export async function upscaleWithIloveimg(options = {}) {
  const {
    filePath,
    buffer,
    fileName: explicitFileName,
    mimeType: explicitMime,
    scale = 2,
    verbose = false
  } = options

  if (!VALID_SCALES.has(Number(scale))) {
    throw new Error('El multiplicador solo puede ser 2, 4 u 8.')
  }

  const log = verbose ? (...args) => console.log(...args) : () => {}

  const resolvedPath = filePath ? path.resolve(filePath) : ''
  let workingBuffer = buffer || null
  if (!workingBuffer && resolvedPath) {
    workingBuffer = await fs.promises.readFile(resolvedPath)
  }
  if (!workingBuffer) throw new Error('Falta el buffer o la ruta de archivo para subir a IloveIMG.')

  const detectedFileName = explicitFileName || (resolvedPath ? path.basename(resolvedPath) : `image-${Date.now()}.jpg`)
  const detectedMime = explicitMime || detectMime(detectedFileName)
  if (!detectedMime) throw new Error('Solo se admiten JPG/JPEG y PNG.')

  const { client } = createHttpClient()
  log('> Descargando landing...')
  const landingHtml = await fetchLandingPage(client)
  const config = extractConfig(landingHtml)
  if (!config.token) throw new Error('No encontré token en la página.')
  if (!config.taskId) throw new Error('No encontré taskId en la página.')

  const workerBaseUrl = pickWorkerServer(config)
  log(`> Usando servidor ${workerBaseUrl}`)

  const uploadResponse = await uploadFile({
    client,
    apiBaseUrl: `${workerBaseUrl}/${API_VERSION}`,
    token: config.token,
    taskId: config.taskId,
    fileBuffer: workingBuffer,
    fileName: detectedFileName,
    mimeType: detectedMime
  })

  const serverFilename = uploadResponse?.server_filename || uploadResponse?.serverFilename
  if (!serverFilename) {
    throw new Error(`Respuesta inesperada del upload: ${JSON.stringify(uploadResponse)}`)
  }
  log(`> Archivo subido como ${serverFilename}`)

  log('> Ejecutando upscale...')
  const upscaleResult = await upscaleFile({
    client,
    apiBaseUrl: `${workerBaseUrl}/${API_VERSION}`,
    token: config.token,
    taskId: config.taskId,
    serverFilename,
    scale: Number(scale)
  })

  const targetExt = pickExtension(upscaleResult.contentType) || path.extname(detectedFileName) || '.jpg'
  return {
    buffer: upscaleResult.buffer,
    contentType: upscaleResult.contentType || detectedMime,
    fileName: `${path.parse(detectedFileName).name}.x${scale}${targetExt}`
  }
}

async function fetchLandingPage(client) {
  const response = await client.get(LANDING_URL, {
    headers: {
      ...DEFAULT_HEADERS,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    responseType: 'text'
  })
  return response.data
}

function extractConfig(html) {
  const configMatch = html.match(/var\s+ilovepdfConfig\s*=\s*(\{[\s\S]*?\});/)
  if (!configMatch) {
    throw new Error('No encontré ilovepdfConfig en la página.')
  }
  const configJson = configMatch[1]
  const config = JSON.parse(configJson)
  const taskMatch = html.match(/ilovepdfConfig\.taskId\s*=\s*'([^']+)'/)
  if (taskMatch) {
    config.taskId = taskMatch[1]
  }
  return config
}

function pickWorkerServer(config) {
  const site = config.site || 'iloveimg'
  const servers = Array.isArray(config.servers) && config.servers.length ? config.servers : ['api11g']
  const chosen = servers[Math.floor(Math.random() * servers.length)].trim()
  return normaliseServerHost(chosen, site)
}

function normaliseServerHost(raw, site) {
  let host = raw
  if (host.startsWith('//')) {
    return `https:${host}`.replace(/\/$/, '')
  }
  if (!host.startsWith('http')) {
    const suffix = host.includes('.') ? host : `${host}.${site}.com`
    host = `https://${suffix}`
  }
  return host.replace(/\/$/, '')
}

async function uploadFile({ client, apiBaseUrl, token, taskId, fileBuffer, fileName, mimeType }) {
  const form = new FormData()
  form.append('task', taskId)
  form.append('preview', '0')
  form.append('pdfinfo', '0')
  form.append('pdfforms', '0')
  form.append('pdfresetforms', '0')
  form.append('v', APP_VERSION)
  form.append('chunk', '0')
  form.append('chunks', '1')
  form.append('name', fileName)
  form.append('type', mimeType)
  form.append('size', String(fileBuffer.length))
  form.append('lastModifiedDate', new Date().toUTCString())
  form.append('file', fileBuffer, {
    filename: fileName,
    contentType: mimeType,
    knownLength: fileBuffer.length
  })

  const response = await client.post(`${apiBaseUrl}/upload`, form, {
    headers: {
      ...form.getHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        Origin: 'https://www.iloveimg.com',
        Referer: LANDING_URL
      })
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  })

  return typeof response.data === 'string' ? JSON.parse(response.data) : response.data
}

async function upscaleFile({ client, apiBaseUrl, token, taskId, serverFilename, scale }) {
  const form = new FormData()
  form.append('task', taskId)
  form.append('server_filename', serverFilename)
  form.append('scale', String(scale))

  const response = await client.post(`${apiBaseUrl}/upscale`, form, {
    headers: {
      ...form.getHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        Origin: 'https://www.iloveimg.com',
        Referer: LANDING_URL
      })
    },
    responseType: 'arraybuffer',
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  })

  return { buffer: Buffer.from(response.data), contentType: response.headers['content-type'] || '' }
}

export function detectMime(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  return ''
}

export function pickExtension(contentType) {
  if (!contentType) return ''
  if (contentType.includes('png')) return '.png'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg'
  if (contentType.includes('webp')) return '.webp'
  return ''
}

async function mainCli() {
  const [inputPathArg, scaleArg = '2', outputPathArg] = process.argv.slice(2)
  if (!inputPathArg) {
    throw new Error('Uso: node iloveimgUpscale.js <ruta-imagen> [2|4|8] [salida]')
  }
  const inputPath = path.resolve(inputPathArg)
  const fileStats = await fs.promises.stat(inputPath).catch(() => null)
  if (!fileStats || !fileStats.isFile()) {
    throw new Error(`No pude leer el archivo: ${inputPath}`)
  }

  const fileName = path.basename(inputPath)
  const mimeType = detectMime(fileName)
  if (!mimeType) {
    throw new Error('Solo se admiten JPG/JPEG y PNG.')
  }

  const result = await upscaleWithIloveimg({
    filePath: inputPath,
    fileName,
    mimeType,
    scale: Number(scaleArg) || 2,
    verbose: true
  })

  const outputPath = path.resolve(
    outputPathArg || path.join(path.dirname(inputPath), result.fileName)
  )

  await fs.promises.writeFile(outputPath, result.buffer)
  console.log(`✔ Imagen generada en ${outputPath}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  mainCli().catch((err) => {
    console.error('✖', err.message || err)
    process.exit(1)
  })
}
