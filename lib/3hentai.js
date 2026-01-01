const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function descargarImagen(url, ruta) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(ruta, res.data);
}

async function crearPDF(imagenes, nombre) {
  const pdfDoc = await PDFDocument.create();

  for (const imgPath of imagenes) {
    const buffer = fs.readFileSync(imgPath);
    let img;
    if (imgPath.endsWith('.jpg') || imgPath.endsWith('.jpeg')) {
      img = await pdfDoc.embedJpg(buffer);
    } else if (imgPath.endsWith('.png')) {
      img = await pdfDoc.embedPng(buffer);
    } else {
      continue;
    }

    const { width, height } = img.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(img, { x: 0, y: 0, width, height });
  }

  const pdfBytes = await pdfDoc.save();
  const savePath = `./downloads/${nombre}.pdf`;
  fs.mkdirSync(path.dirname(savePath), { recursive: true });
  fs.writeFileSync(savePath, pdfBytes);
  return savePath;
}

async function getComicInfo(url) {
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = res.data;
  const $ = cheerio.load(html);

  const comicId = url.match(/\/d\/(\d+)/)?.[1];
  if (!comicId) throw new Error('No se pudo extraer el ID del cómic');

  const imgs = $('img').map((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('src');
    return src;
  }).get();

  const images = imgs
    .filter(src => src && src.includes(`d${comicId}/`))
    .map(src => src.replace(/t\.jpg$/, '.jpg'));

  const title = $('h1').first().text().trim() || `comic_${comicId}`;
  return { title, images };
}

module.exports = {
  descargarImagen,
  crearPDF,
  getComicInfo
};