import { Category, Channel } from '../types';
import { TELUGU_CHANNELS } from './teluguChannels';

export const CATEGORIES: Category[] = [
  {
    id: 'all',
    nameTelugu: 'అన్ని ఛానల్స్',
    nameEnglish: 'All Channels',
    icon: 'Tv',
    descriptionTelugu: 'All 52 Live Telugu Channels',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'news',
    nameTelugu: 'వార్తలు',
    nameEnglish: 'News',
    icon: 'Radio',
    descriptionTelugu: 'Live Telugu News & Headlines',
    color: 'from-red-600 to-rose-700',
  },
  {
    id: 'entertainment',
    nameTelugu: 'ఎంటర్‌టైన్‌మెంట్',
    nameEnglish: 'Entertainment',
    icon: 'Film',
    descriptionTelugu: 'Telugu Serials, Shows & Comedy',
    color: 'from-purple-600 to-indigo-600',
  },
  {
    id: 'movies',
    nameTelugu: 'సినిమాలు',
    nameEnglish: 'Movies',
    icon: 'Film',
    descriptionTelugu: 'Star Maa Movies, GNT HD, Zoy HD, 7Hills',
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: 'music',
    nameTelugu: 'సంగీతం',
    nameEnglish: 'Music',
    icon: 'Music2',
    descriptionTelugu: 'Raj Musix, ETV Beats & Telugu Songs',
    color: 'from-emerald-500 to-teal-700',
  },
  {
    id: 'religious',
    nameTelugu: 'భక్తి / ఆధ్యాత్మికం',
    nameEnglish: 'Devotional',
    icon: 'Sparkles',
    descriptionTelugu: 'SVBC TV, Subhavaartha, Keerthana, PMC',
    color: 'from-yellow-500 to-amber-600',
  },
  {
    id: 'sports',
    nameTelugu: 'స్పోర్ట్స్',
    nameEnglish: 'Sports',
    icon: 'Tv',
    descriptionTelugu: 'Sony Sports Ten 4, Star Sports 2',
    color: 'from-blue-600 to-cyan-700',
  },
];

/**
 * Active channels list
 */
export const CHANNELS: Channel[] = TELUGU_CHANNELS;
