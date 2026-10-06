const fs = require('fs');
const path = require('path');

const CIPHER_SECRET = 'JNN_TELUGU_SMART_IPTV_KEY_SECURE_2026_!#%';

function encryptUrl(url) {
  if (!url) return '';
  if (url.startsWith('ENC:')) return url;
  const textBytes = new TextEncoder().encode(url);
  const keyBytes = new TextEncoder().encode(CIPHER_SECRET);
  const out = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    const k = keyBytes[i % keyBytes.length];
    out[i] = (textBytes[i] ^ k ^ ((i * 31 + 17) & 0xff));
  }
  let binary = '';
  for (let i = 0; i < out.length; i++) {
    binary += String.fromCharCode(out[i]);
  }
  return 'ENC:' + btoa(binary);
}

const LOGO_MAP = {
  'SRK ENT': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'PCN HD': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'VIHARI TV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'GS GRAMEENA': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'GNT HD': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'SITY TELANGANA': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'SAMSKRUTHI': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'DBR News': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'JEE TV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'MEE TV NEWS': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'PRAJA TV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'SITICHANNEL': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'ZOY HD': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'S9CHANNAL': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'SS NEWS': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'MA TELANGANA': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'ANJALITV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  '4SIDESTV': 'https://jiotvimages.cdn.jio.com/dare_images/images/4sites.png',
  'METRO TV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'TV9 TELUGU': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/TV9_Telugu_logo.png/220px-TV9_Telugu_logo.png',
  'ZEE TELUGU NEWS': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Zee_Telugu_logo.png/220px-Zee_Telugu_logo.png',
  'RAJ NEWS': 'https://dtil.tmsimg.com/assets/s142517_ld_h15_aa.png',
  'NTV': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/NTV_Telugu_logo.png/220px-NTV_Telugu_logo.png',
  'I NEWS': 'https://cdn.pishow.tv/ott/live/411/master.m3u8',
  'CVR NEW': 'https://mumbai-edge.smartplaytv.in/CVRNews/index.m3u8',
  'ABN': 'https://dtil.tmsimg.com/assets/s142517_ld_h15_aa.png?lock=720x540',
  '99TV': 'https://cdn.pishow.tv/ott/live/1211/master.m3u8',
  'Sakshi TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Sakshi_TV_logo.png/220px-Sakshi_TV_logo.png',
  '10TV': 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_10TV/images/LOGO_HD/image.png',
  '9 PLUS': 'https://stream.ottlive.co.in/9plusnews/index.m3u8',
  '6TV': 'https://i.imgur.com/l3EcRnZ.png',
  'YSR TV': 'https://vvsolutions.in/ysrtv/ysrtv.m3u8',
  '7HILLS': 'https://server.streamwell.in/hls/7hills.m3u8',
  '1 tv': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'Harikka Star': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'NSR NEWS': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'SVBC TV': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/SVBC_TV_logo.png/220px-SVBC_TV_logo.png',
  'BATHUKAMMA TV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'MA TEL TV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'JEEVANADHITV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'SUBHAVAARTHA': 'https://2mk9qae4rwyb-hls-live.wmncdn.net/shubhavartha/live.stream/playlist.m3u8',
  'KEERTHANATV': 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
  'PMC': 'https://mumbai-edge.smartplaytv.in/PMC/index.m3u8',
  'RAJ MUSIX': 'https://cdn.pishow.tv/ott/live/1213/master.m3u8',
  'TELUGU ONE': 'https://teluguone-yupptv.vgcdn.net/v1/019be9e3f04d1ea55784338b5c3e89/019be9e4474415fc60e93459e1e808/teluguone_2500k.m3u8',
  'ETV BEATS': 'https://dtil.tmsimg.com/assets/s142510_ld_h15_ab.png?lock=720x540',
  'SONY SPORTS TEN 4': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Sony_Sports_Ten_4_logo.png/220px-Sony_Sports_Ten_4_logo.png',
  'STAR SPORTS 2': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Star_Sports_2_logo.png/220px-Star_Sports_2_logo.png',
  'STAR MAA MOVIES': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Star_Maa_Movies_logo.png/220px-Star_Maa_Movies_logo.png',
  'STUDIO ONE': 'https://cdn.pishow.tv/ott/live/276/master.m3u8',
  'ETV JOSH': 'https://cc-uyh1ow5zouoio.akamaized.net/WWBI/Amagi/ETV_Josh_IN/playlist.m3u8',
  'STAR MAA HD': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/Star_Maa_logo.png/220px-Star_Maa_logo.png'
};

async function main() {
  const rawDropboxUrl = "https://dl.dropboxusercontent.com/scl/fi/7y5g5lj2fufvyqsrs0agu/Telugu.txt?rlkey=53dxx4xnb7pix3pr2d4g80g8l&st=fdwrke7u&dl=0";
  console.log("Fetching from Dropbox:", rawDropboxUrl);
  const res = await fetch(rawDropboxUrl);
  if (!res.ok) throw new Error("Failed to fetch Telugu.txt: " + res.statusText);
  const text = await res.text();

  const blocks = text.split(/(?:^|\n)\s*No\s*:\s*/i).filter(b => b.trim().length > 0);
  console.log("Found raw blocks:", blocks.length);

  const channels = [];

  for (const block of blocks) {
    const numMatch = block.match(/^(\d+)/);
    const num = numMatch ? parseInt(numMatch[1], 10) : channels.length + 1;
    
    // Find url
    let urlMatch = block.match(/Url\s*:\s*([^\s\n\r]+)/i);
    let streamUrl = urlMatch ? urlMatch[1].trim() : "";
    if (streamUrl && !streamUrl.startsWith("http")) {
      streamUrl = "http://" + streamUrl;
    }
    
    // Specific custom user override: Channel 4 stream url
    if (num === 4) {
      streamUrl = "https://shivaganeshtelicom.in/gschannel/video.m3u8";
    }
    
    // Find name
    let nameMatch = block.match(/Name\s*:\s*([^\n\r\t]+)/i);
    let name = "";
    if (nameMatch) {
      name = nameMatch[1].trim();
    } else {
      const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const l of lines) {
        if (!l.startsWith(String(num)) && !l.toLowerCase().includes("url:")) {
          name = l.replace(/\t.*$/, "").trim();
          break;
        }
        if (l.toLowerCase().includes("url:") && !name) {
          name = l.split(/url:/i)[0].replace(/^\d+/, "").trim();
          if (name) break;
        }
      }
    }

    if (!name || !streamUrl) continue;

    // Clean name
    name = name.replace(/\r/g, '').replace(/\t/g, ' ').trim();

    // Determine category
    const lower = name.toLowerCase();
    let categoryId = 'entertainment';
    if (/news|abn|ntv|tv9|sakshi|10tv|6tv|99tv|4sides|metro|cvr|dbr|mee tv|ss news|nsr|ysr/i.test(lower)) {
      categoryId = 'news';
    } else if (/movies|film|cinema|7hills|zoy|gnt/i.test(lower)) {
      categoryId = 'movies';
    } else if (/musix|music|beats/i.test(lower)) {
      categoryId = 'music';
    } else if (/sports|ten 4/i.test(lower)) {
      categoryId = 'sports';
    } else if (/svbc|bhakti|subhavaartha|keerthana|jeevanadhi|pmc|samskruthi/i.test(lower)) {
      categoryId = 'religious';
    }

    // Determine resolution
    let resolution = '1080p FHD';
    if (/hd/i.test(name)) resolution = '1080p FHD';
    else if (/4k/i.test(name)) resolution = '4K HDR';
    else resolution = '720p HD';

    // Poster
    let poster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';
    if (categoryId === 'news') poster = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80';
    else if (categoryId === 'music') poster = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
    else if (categoryId === 'movies') poster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
    else if (categoryId === 'sports') poster = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80';
    else if (categoryId === 'religious') poster = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80';

    const safeId = `telugu-${num}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Logo
    let logo = LOGO_MAP[name] || 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg';

    // ENCRYPT THE STREAM URL
    const encryptedStreamUrl = encryptUrl(streamUrl);

    channels.push({
      id: safeId,
      number: num,
      categoryId,
      name,
      logo,
      streamUrl: encryptedStreamUrl,
      poster,
      resolution,
    });
  }

  console.log(`Successfully parsed and encrypted ${channels.length} channels.`);

  const encryptedDropboxUrl = encryptUrl(rawDropboxUrl);

  const fileContent = `import { Channel } from '../types';
import { decryptUrl } from '../utils/security';

/**
 * Encrypted Dropbox Source URL
 */
export const TELUGU_DROPBOX_URL = decryptUrl('${encryptedDropboxUrl}');

/**
 * Raw encrypted channel definitions.
 * All stream URLs are cryptographically protected and obfuscated (ENC:...).
 */
const ENCRYPTED_TELUGU_CHANNELS: Channel[] = ${JSON.stringify(channels, null, 2)};

/**
 * Exported Live Telugu Channels with on-the-fly secure decryption.
 * Total channels: ${channels.length}
 */
export const TELUGU_CHANNELS: Channel[] = ENCRYPTED_TELUGU_CHANNELS.map(channel => ({
  ...channel,
  streamUrl: decryptUrl(channel.streamUrl),
}));
`;

  const outputPath = path.join(__dirname, '../src/data/teluguChannels.ts');
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`Saved encrypted channel repository to ${outputPath} (${(fileContent.length / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
