const fs = require('fs')
const axios = require('axios')
const FormData = require('form-data')

async function upload(buffer, opts = {}) {
  const {
    url = 'https://upload.hackstorex.com/api/upload.php',
    filename = 'image.jpg',
    fieldName = 'file',
    extraFields = {},
    timeout = 60000
  } = opts

  const form = new FormData()
  form.append(fieldName, buffer, { filename })
  for (const key of Object.keys(extraFields)) {
    form.append(key, extraFields[key])
  }

  const headers = { ...form.getHeaders(), Accept: 'application/json' }

  try {
    const res = await axios.post(url, form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout
    })
    if (res && res.data) return res.data
    throw new Error(`Respuesta inesperada del servidor (status ${res.status})`)
  } catch (err) {
    const message = err.response?.data ? JSON.stringify(err.response.data) : err.message
    throw new Error(`Error subiendo archivo: ${message}`)
  }
}

const getBuffer = async (url) => {
    try {
        if (Buffer.isBuffer(url)) {
            return url;
        }
        if (fs.existsSync(url)) {
            return fs.readFileSync(url);
        }
        const response = await axios({
            method: 'get',
            url,
            responseType: 'arraybuffer'
        });
        return response.data;
    } catch (e) {
        throw new Error('No se pudo obtener el búfer de la URL/ruta.');
    }
};

module.exports = { getBuffer, upload };