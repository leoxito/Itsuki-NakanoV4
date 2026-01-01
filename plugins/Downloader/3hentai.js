const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { descargarImagen, crearPDF, getComicInfo } = require('../../lib/3hentai');

module.exports = {
  command: ['3hentai'],
  help: ["3hentai"],
  run: async (ms, { sylph, args }) => {
    if (!args[0]) return ms.reply("> *✐ Ingresa una URL válida de 3hentai.net. Ejemplo: https://es.3hentai.net/d/432601*");
    
    // Enviar reacción de búsqueda
    await sylph.sendMessage(ms.from, { react: { text: "🕔", key: ms.key } });
    
    await ms.reply("Descargando cómic . . .");

    try {
      const info = await getComicInfo(args[0]);
      const carpeta = './temp_images';
      fs.mkdirSync(carpeta, { recursive: true });
      const rutas = [];

      for (let i = 0; i < info.images.length; i++) {
        const imgUrl = info.images[i];
        const ext = path.extname(imgUrl).split('?')[0] || '.jpg';
        const imgPath = path.join(carpeta, `${i + 1}${ext}`);
        console.log(`Descargando: ${imgUrl}`);
        await descargarImagen(imgUrl, imgPath);
        rutas.push(imgPath);
      }

      const title = info.title
        .replace(/[<>:"/\\|?*\[\]]+/g, '')
        .replace(/\s+/g, ' ')
        .replace(/[^a-zA-Z0-9 _\-\.]/g, '')
        .trim();

      const pdfPath = await crearPDF(rutas, title);
      const pdfBuffer = fs.readFileSync(pdfPath);
      const portadaBuffer = fs.readFileSync(rutas[0]);
      const thumbBuffer = await sharp(portadaBuffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg()
        .toBuffer();

      await sylph.sendMessage(ms.from, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: `${title}.pdf`,
        jpegThumbnail: thumbBuffer,
        caption: title
      }, { quoted: ms });

      rutas.forEach(r => fs.unlinkSync(r));
      fs.rmdirSync(carpeta);
      fs.unlinkSync(pdfPath);

      // Enviar reacción de éxito
      await sylph.sendMessage(ms.from, { react: { text: "✅️", key: ms.key } });

    } catch (e) {
      await ms.reply("Ocurrió un error: " + e.message);
      // Enviar reacción de error (opcional)
      await sylph.sendMessage(ms.from, { react: { text: "❌", key: ms.key } });
    }
  }
};