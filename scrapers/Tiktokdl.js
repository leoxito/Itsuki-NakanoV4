const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://dlpanda.com/en';

async function getDownloadLink(tiktokUrl) {
    try {
        const response1 = await axios.get(BASE_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const $1 = cheerio.load(response1.data);
        const token = $1('#token').val();
        
        if (!token) {
            throw new Error('Could not find token on the page.');
        }

        const targetUrl = `${BASE_URL}?url=${encodeURIComponent(tiktokUrl)}&t0ken=${token}`;
        
        const response2 = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Referer': BASE_URL
            }
        });

        const $2 = cheerio.load(response2.data);
        const videoLinks = new Set();

        $2('a').each((_, el) => {
            let href = $2(el).attr('href');
            if (href && (href.includes('.mp4') || href.includes('tiktokcdn') || href.includes('download'))) {
                 if (!href.includes('/article/')) {
                    if (href.startsWith('//')) {
                        href = 'https:' + href;
                    }
                    videoLinks.add(href);
                 }
            }
        });

        if (videoLinks.size > 0) {
            return Array.from(videoLinks);
        } else {
            return [];
        }

    } catch (error) {
        console.error('Error:', error.message);
        return [];
    }
}

module.exports = { getDownloadLink };