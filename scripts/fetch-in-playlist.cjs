const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Fetching https://iptv-org.github.io/iptv/countries/in.m3u ...');
  const res = await fetch('https://iptv-org.github.io/iptv/countries/in.m3u');
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }
  const text = await res.text();
  const lines = text.split('\n');
  console.log(`Downloaded ${lines.length} lines.`);

  const rawChannels = [];
  const seenUrls = new Set();

  const teluguRegex = /\btelugu\b|\bandhra\b|\betv\b|\btv9 telugu\b|\bsakshi\b|\b10tv\b|\babn\b|\bntv\b|\bmahaa\b|\bv6\b|\bt news\b|\bstudio one\b|\bhmtv\b|raj news telugu|raj musix telugu|zee telugu|star sports 2 telugu|sony sports ten 4 telugu/i;
  const kannadaRegex = /\bkannada\b|\bsuvarna\b|\bdighvijay\b|\bkasthuri\b|\bayush\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF')) {
      const url = lines[i + 1]?.trim() || '';
      if (!url.startsWith('http')) continue;

      // Deduplicate identical stream URLs
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      const logo = line.match(/tvg-logo="([^"]+)"/)?.[1] || '';
      const group = line.match(/group-title="([^"]+)"/)?.[1] || 'General';
      const tvgId = line.match(/tvg-id="([^"]+)"/)?.[1] || '';
      
      let name = line.split(',').slice(1).join(',').trim();
      name = name.replace(/\[Geo-blocked\]/gi, '').trim();
      name = name.replace(/\r/g, '').trim();

      // Determine resolution
      let resolution = '1080p FHD';
      if (/4k|2160p/i.test(name)) resolution = '4K HDR';
      else if (/720p|hd/i.test(name)) resolution = '720p HD';
      else if (/1080p|fhd/i.test(name)) resolution = '1080p FHD';

      // Clean name without resolution suffix for cleaner display
      const cleanName = name.replace(/\s*\(\d+p\)\s*/gi, '').trim();
      const combinedText = `${cleanName} ${tvgId} ${group}`.toLowerCase();

      // Precise categorization
      let categoryId = 'entertainment';
      if (teluguRegex.test(combinedText)) {
        categoryId = 'telugu';
      } else if (kannadaRegex.test(combinedText)) {
        categoryId = 'kannada';
      } else if (/religious/i.test(group) || /bhakti|aastha|sanskar|sadhna|ishwar|divya|shubh|dharma|santvani/i.test(combinedText)) {
        categoryId = 'religious';
      } else if (/sports/i.test(group) || /sports|cricket|football|ten/i.test(combinedText)) {
        categoryId = 'sports';
      } else if (/kids|animation/i.test(group) || /kid|cartoon|pogo|bal bharat/i.test(combinedText)) {
        categoryId = 'kids';
      } else if (/music/i.test(group) || /music|9xm|9x|jalwa|jhakaas|tashan|mastiii|beats|musix/i.test(combinedText)) {
        categoryId = 'music';
      } else if (/movies/i.test(group) || /cinema|movie|film|goldmines|b4u movies/i.test(combinedText)) {
        categoryId = 'movies';
      } else if (/news/i.test(group) || /news|samachar|khabar|today|republic|times now|wion|ndtv|aaj tak/i.test(combinedText)) {
        categoryId = 'news';
      } else if (/hindi/i.test(combinedText)) {
        categoryId = 'hindi';
      }

      // Default poster by category
      let poster = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80';
      if (categoryId === 'telugu') poster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80';
      else if (categoryId === 'news') poster = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80';
      else if (categoryId === 'music') poster = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
      else if (categoryId === 'movies') poster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
      else if (categoryId === 'sports') poster = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80';
      else if (categoryId === 'kids') poster = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80';
      else if (categoryId === 'religious') poster = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80';

      const safeId = (tvgId.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || `ch-${rawChannels.length + 1}`).slice(0, 40);

      rawChannels.push({
        id: safeId,
        name: cleanName,
        logo: logo || 'https://i.ibb.co/rGgVXGq1/IMG-20260923-143643.jpg',
        categoryId,
        streamUrl: url,
        poster,
        resolution,
      });
    }
  }

  // Sort channels: Telugu first, then Movies, Entertainment, News, Music, Sports, Kids, Religious, Kannada, Hindi
  const categoryPriority = {
    telugu: 1,
    entertainment: 2,
    movies: 3,
    news: 4,
    music: 5,
    sports: 6,
    kids: 7,
    religious: 8,
    kannada: 9,
    hindi: 10,
  };

  rawChannels.sort((a, b) => {
    const pA = categoryPriority[a.categoryId] || 99;
    const pB = categoryPriority[b.categoryId] || 99;
    if (pA !== pB) return pA - pB;
    return a.name.localeCompare(b.name);
  });

  // Assign sequential channel numbers 1, 2, 3...
  const finalChannels = rawChannels.map((ch, idx) => ({
    ...ch,
    number: idx + 1,
  }));

  console.log(`Generated ${finalChannels.length} channels from in.m3u.`);

  const fileContent = `import { Channel } from '../types';

/**
 * Live Indian TV Channels parsed directly from:
 * https://iptv-org.github.io/iptv/countries/in.m3u
 * Total channels: ${finalChannels.length}
 */
export const IN_CHANNELS: Channel[] = ${JSON.stringify(finalChannels, null, 2)};
`;

  const outputPath = path.join(__dirname, '../src/data/inChannels.ts');
  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`Saved to ${outputPath} (${(fileContent.length / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
