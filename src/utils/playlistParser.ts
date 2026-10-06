import { Channel, CategoryId } from '../types';
import { getSecureSourceUrl } from './securityGuard';

export const TELUGU_SOURCE_URL = getSecureSourceUrl();

// Known logos for popular Telugu & Indian channels
const KNOWN_LOGOS: Record<string, string> = {
  'TV9 TELUGU': 'https://raw.githubusercontent.com/pishowtv/logos/main/tv9_telugu.png',
  'TV9': 'https://raw.githubusercontent.com/pishowtv/logos/main/tv9_telugu.png',
  'NTV': 'https://raw.githubusercontent.com/pishowtv/logos/main/ntv.png',
  'SAKSHI TV': 'https://raw.githubusercontent.com/pishowtv/logos/main/sakshi.png',
  'SAKSHI': 'https://raw.githubusercontent.com/pishowtv/logos/main/sakshi.png',
  '10TV': 'https://raw.githubusercontent.com/pishowtv/logos/main/10tv.png',
  'ABN': 'https://raw.githubusercontent.com/pishowtv/logos/main/abn.png',
  '99TV': 'https://raw.githubusercontent.com/pishowtv/logos/main/99tv.png',
  'STAR MAA HD': 'https://raw.githubusercontent.com/pishowtv/logos/main/star_maa.png',
  'STAR MAA MOVIES': 'https://raw.githubusercontent.com/pishowtv/logos/main/star_maa_movies.png',
  'ETV JOSH': 'https://raw.githubusercontent.com/pishowtv/logos/main/etv_josh.png',
  'ETV BEATS': 'https://raw.githubusercontent.com/pishowtv/logos/main/etv_beats.png',
  'STUDIO ONE': 'https://raw.githubusercontent.com/pishowtv/logos/main/studio_one.png',
  'SVBC TV': 'https://raw.githubusercontent.com/pishowtv/logos/main/svbc.png',
  'SVBC': 'https://raw.githubusercontent.com/pishowtv/logos/main/svbc.png',
  'SONY SPORTS TEN 4': 'https://raw.githubusercontent.com/pishowtv/logos/main/sony_ten4.png',
  'STAR SPORTS 2': 'https://raw.githubusercontent.com/pishowtv/logos/main/star_sports2.png',
  'ZEE TELUGU NEWS': 'https://raw.githubusercontent.com/pishowtv/logos/main/zee_telugu.png',
  'RAJ MUSIX': 'https://raw.githubusercontent.com/pishowtv/logos/main/raj_musix.png',
  'CVR NEW': 'https://raw.githubusercontent.com/pishowtv/logos/main/cvr.png',
  'CVR NEWS': 'https://raw.githubusercontent.com/pishowtv/logos/main/cvr.png',
  'TELUGU ONE': 'https://raw.githubusercontent.com/pishowtv/logos/main/teluguone.png',
};

// Generates an inline SVG data URI badge for channels without an external image
export function generateMonogramLogo(channelName: string, categoryId: CategoryId): string {
  const cleanName = channelName.trim();
  const words = cleanName.split(/\s+/);
  const initials = words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : cleanName.slice(0, 3).toUpperCase();

  const colors: Record<CategoryId, [string, string]> = {
    all: ['#0284c7', '#0369a1'],
    telugu: ['#0284c7', '#0369a1'],
    news: ['#dc2626', '#991b1b'],
    entertainment: ['#9333ea', '#6b21a8'],
    movies: ['#d97706', '#b45309'],
    music: ['#059669', '#047857'],
    religious: ['#eab308', '#ca8a04'],
    sports: ['#2563eb', '#1d4ed8'],
    kids: ['#f43f5e', '#be123c'],
    hindi: ['#8b5cf6', '#6d28d9'],
    kannada: ['#10b981', '#047857'],
  };

  const [c1, c2] = colors[categoryId] || ['#3b82f6', '#1d4ed8'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="200" height="120" rx="16" fill="url(#g)"/>
    <text x="50%" y="48%" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">${initials}</text>
    <text x="50%" y="82%" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">${cleanName.slice(0, 16)}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Classify category intelligently based on channel name
export function detectCategory(name: string): CategoryId {
  const upper = name.toUpperCase().trim();

  // News
  if (
    upper.includes('NEWS') ||
    upper.includes('TV9') ||
    upper.includes('NTV') ||
    upper.includes('SAKSHI') ||
    upper.includes('10TV') ||
    upper.includes('ABN') ||
    upper.includes('99TV') ||
    upper.includes('CVR') ||
    upper.includes('6TV') ||
    upper.includes('DBR') ||
    upper.includes('MEE TV') ||
    upper.includes('PRAJA TV') ||
    upper.includes('SS NEWS') ||
    upper.includes('METRO TV') ||
    upper.includes('9 PLUS') ||
    upper.includes('YSR TV') ||
    upper.includes('NSR') ||
    upper.includes('HEADLINES')
  ) {
    return 'news';
  }

  // Movies
  if (
    upper.includes('MOVIES') ||
    upper.includes('CINEMA') ||
    upper.includes('FILM') ||
    upper.includes('JOSH') ||
    upper.includes('STUDIO ONE') ||
    upper.includes('TALKIES')
  ) {
    return 'movies';
  }

  // Music
  if (
    upper.includes('MUSIC') ||
    upper.includes('MUSIX') ||
    upper.includes('BEATS') ||
    upper.includes('SONGS') ||
    upper.includes('MELODY')
  ) {
    return 'music';
  }

  // Religious / Devotional
  if (
    upper.includes('SVBC') ||
    upper.includes('SUBHAVAARTHA') ||
    upper.includes('KEERTHANA') ||
    upper.includes('PMC') ||
    upper.includes('JEEVANADHI') ||
    upper.includes('BHAKTI') ||
    upper.includes('DEVOTIONAL') ||
    upper.includes('GOD') ||
    upper.includes('POOJA') ||
    upper.includes('TEMPLE') ||
    upper.includes('SAMSKRUTHI') ||
    upper.includes('BATHUKAMMA')
  ) {
    return 'religious';
  }

  // Sports
  if (
    upper.includes('SPORTS') ||
    upper.includes('CRICKET') ||
    upper.includes('FOOTBALL') ||
    upper.includes('TEN 4') ||
    upper.includes('TEN')
  ) {
    return 'sports';
  }

  // Entertainment / General
  return 'entertainment';
}

/**
 * Universal Parser for Telugu TV Playlist
 * Handles:
 * 1. "No:1Name: SRK ENT\tUrl: https://...No:2..." (custom inline or multiline format)
 * 2. "No: 15SS NEWS\tUrl:..." (missing "Name:" label)
 * 3. Standard M3U (#EXTM3U, #EXTINF:-1 tvg-name="..." tvg-logo="...", Name\nURL)
 * 4. JSON array of objects [{ number, name, url }, ...]
 * 5. Simple CSV/TSV format (Name, URL)
 */
export function parseChannelsFromText(rawText: string): Channel[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const trimmed = rawText.trim();
  const parsedChannels: Channel[] = [];

  // Case A: JSON Array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const data = JSON.parse(trimmed);
      if (Array.isArray(data)) {
        data.forEach((item, idx) => {
          const streamUrl = String(item.streamUrl || item.url || item.link || '').trim();
          if (!streamUrl.startsWith('http')) return;
          const number = Number(item.number) || idx + 1;
          const name = String(item.name || item.title || `Channel ${number}`).trim();
          const categoryId = (item.categoryId as CategoryId) || detectCategory(name);
          const logo = item.logo || item.img || KNOWN_LOGOS[name.toUpperCase()] || generateMonogramLogo(name, categoryId);
          parsedChannels.push({
            id: `telugu-${number}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            number,
            categoryId,
            name,
            logo,
            streamUrl,
            poster: item.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
            resolution: name.toUpperCase().includes('HD') ? '1080p FHD' : '720p HD',
          });
        });
        if (parsedChannels.length > 0) return parsedChannels;
      }
    } catch {}
  }

  // Case B: M3U Playlist (#EXTM3U / #EXTINF)
  if (trimmed.includes('#EXTINF')) {
    const lines = trimmed.split(/\r?\n/);
    let currentNumber = 1;
    let currentName = '';
    let currentLogo = '';
    let currentGroup = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        // Parse attributes and title
        const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
        if (logoMatch) currentLogo = logoMatch[1];
        const groupMatch = line.match(/group-title="([^"]+)"/i);
        if (groupMatch) currentGroup = groupMatch[1];
        const commaIdx = line.lastIndexOf(',');
        if (commaIdx !== -1) {
          currentName = line.slice(commaIdx + 1).trim();
        }
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        const name = currentName || `Channel ${currentNumber}`;
        const categoryId = detectCategory(currentGroup || name);
        const logo = currentLogo || KNOWN_LOGOS[name.toUpperCase()] || generateMonogramLogo(name, categoryId);
        parsedChannels.push({
          id: `telugu-${currentNumber}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          number: currentNumber,
          categoryId,
          name,
          logo,
          streamUrl: line,
          poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
          resolution: name.toUpperCase().includes('HD') ? '1080p FHD' : '720p HD',
        });
        currentNumber++;
        currentName = '';
        currentLogo = '';
        currentGroup = '';
      }
    }
    if (parsedChannels.length > 0) return parsedChannels;
  }

  // Case C: Dropbox Telugu.txt format: "No: 1 Name: SRK ENT Url: https://..."
  // Tokenize by "No:" boundary (handles inline and multiline)
  const tokens = trimmed.split(/(?=No\s*:\s*\d+)/i).filter(t => t.trim());

  tokens.forEach((tok, index) => {
    // Regex matching: No:<number> [Name:]<name> Url:<url>
    const match = tok.match(
      /No\s*:\s*(\d+)\s*(?:Name\s*:\s*)?(.*?)\s*(?:Url|URL)\s*:\s*(\S+)/is
    );

    if (match) {
      const num = parseInt(match[1], 10) || index + 1;
      let rawName = match[2].trim().replace(/^Name\s*:\s*/i, '').trim();
      let streamUrl = match[3].trim();

      // Clean protocol if missing
      if (streamUrl.startsWith('telanganatv.')) {
        streamUrl = 'http://' + streamUrl;
      }
      if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://')) {
        streamUrl = 'https://' + streamUrl;
      }

      // Ignore dummy or empty entries
      if (!rawName || rawName === 'hhhh') return;

      const categoryId = detectCategory(rawName);
      const upperName = rawName.toUpperCase();
      const logo = KNOWN_LOGOS[upperName] || generateMonogramLogo(rawName, categoryId);

      parsedChannels.push({
        id: `telugu-${num}-${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        number: num,
        categoryId,
        name: rawName,
        logo,
        streamUrl,
        poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
        resolution: upperName.includes('HD') ? '1080p FHD' : '720p HD',
      });
    }
  });

  // If still empty, try fallback line-by-line format: "Channel Name, URL" or "Channel Name | URL"
  if (parsedChannels.length === 0) {
    const lines = trimmed.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) return;

      let parts = cleanLine.split(/[,|\t]/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const urlCandidate = parts[parts.length - 1].trim();
        if (urlCandidate.startsWith('http')) {
          const num = idx + 1;
          const categoryId = detectCategory(name);
          parsedChannels.push({
            id: `telugu-${num}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            number: num,
            categoryId,
            name,
            logo: KNOWN_LOGOS[name.toUpperCase()] || generateMonogramLogo(name, categoryId),
            streamUrl: urlCandidate,
            poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
            resolution: name.toUpperCase().includes('HD') ? '1080p FHD' : '720p HD',
          });
        }
      }
    });
  }

  return parsedChannels;
}
