const axios = require("axios")
const cheerio = require("cheerio")

async function pollForDownloadLink(token, retries = 15, delay = 2000) {
  const downloadPageUrl = `https://notube.net/id/download?token=${token}`;
  for (let i = 0; i < retries; i++) {
    const { data: pageData } = await axios.get(downloadPageUrl);
    const $ = cheerio.load(pageData);
    const finalDownloadUrl = $('#downloadButton').attr('href');

    if (finalDownloadUrl && finalDownloadUrl.includes('key=') && !finalDownloadUrl.endsWith('key=')) {
      const title = $('#blocLinkDownload h2').text().trim();
      return { title, dl: finalDownloadUrl };
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Suwi banget, link download-e ora ketemu. Sabar to!');
}

async function ytdl(url, format = 'mp3') {
  const serverUrl = 'https://s60.notube.net';

  try {
    const weightPayload = new URLSearchParams({ url, format, lang: 'id', subscribed: 'false' });
    const { data: weightData } = await axios.post(`${serverUrl}/recover_weight.php`, weightPayload.toString());

    const { token, name_mp4 } = weightData;
    if (!token) throw new Error('¡Ahora iso nomokke token, Rek!');

    const filePayload = new URLSearchParams({ url, format, name_mp4, lang: 'id', token, subscribed: 'false', playlist: 'false', adblock: 'false' });
    await axios.post(`${serverUrl}/recover_file.php?lang=id`, filePayload.toString());

    const conversionPayload = new URLSearchParams({ token });
    await axios.post(`${serverUrl}/conversion.php`, conversionPayload.toString());

    return await pollForDownloadLink(token);
  } catch (error) {
    throw error
  }
}
module.exports = { ytdl }