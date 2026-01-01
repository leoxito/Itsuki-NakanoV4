const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

module.exports = {
  command: 'getfile',
  help: ["getfile"],
  owner: true,
  description: 'Envía un archivo o carpeta como documento.',
  run: async (ms, { text }) => {
    if (!text) return ms.reply('🌾 Ejemplo de uso:\n.getfile lib\n.getfile ./\n.getfile lib/util.js');

    const filePath = path.resolve(text);
    if (!fs.existsSync(filePath)) return ms.reply('🪷 El archivo o carpeta no existe.');

    const stat = fs.statSync(filePath);
    const baseName = path.basename(filePath);

    if (stat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const buffer = fs.readFileSync(filePath);
      const mimeTypes = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
        '.mp4': 'video/mp4', '.txt': 'text/plain',
        '.js': 'application/javascript', '.json': 'application/json',
        '.pdf': 'application/pdf', '.zip': 'application/zip',
        '.rar': 'application/vnd.rar'
      };
      const mime = mimeTypes[ext] || 'application/octet-stream';

      if (['.js', '.txt', '.json'].includes(ext)) {
        const content = buffer.toString('utf-8').slice(0, 190000);
        await ms.reply(content);
        return await ms.sendDoc(baseName, baseName.split(".")[0], buffer);
      }

      if (ext === '.mp3' || ext === '.wav') return await ms.sendAudio(baseName, buffer);
      if (['.jpg', '.jpeg', '.png', '.gif', '.mp4'].includes(ext)) {
        return await ms.media(baseName, buffer)
      }

      return await ms.sendDoc(baseName, baseName.split(".")[0], buffer);
    }
    const zipName = `${baseName || 'backup'}_${Date.now()}.zip`;
    const zipPath = path.join(os.tmpdir(), zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    archive.glob('**/*', {
      cwd: filePath,
      ignore: [
        '**/node_modules/**',
        '**/package-lock.json',
        '**/.env',
        '**/*.log',
        '**/*.sqlite',
        '**/*.db',
        '**/.git/**',
        '**/npm-debug.log'
      ]
    });

    await archive.finalize();

    await new Promise(resolve => output.on('close', resolve));

    const zipBuffer = fs.readFileSync(zipPath);
    await ms.sendDoc(zipName, zipName, zipBuffer);
    fs.unlinkSync(zipPath);
  }
};