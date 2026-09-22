export type CategoryId = 'all' | 'telugu' | 'hindi' | 'kannada' | 'entertainment' | 'kids' | 'news' | 'music';

export interface Category {
  id: CategoryId;
  nameTelugu: string;
  nameEnglish: string;
  icon: string;
  descriptionTelugu: string;
  color: string;
}

export interface Channel {
  id: string;
  number: number;
  categoryId: CategoryId;
  name: string;
  logo: string;
  streamUrl: string;
  fallbackUrl?: string;
  poster: string;
  resolution?: '4K HDR' | '1080p FHD' | '720p HD';
}

export type TVFocusTarget = 
  | 'video'
  | 'menu-categories'
  | 'menu-channels'
  | 'remote'
  | 'settings';

export type MenuSection = 'recent' | 'favorites' | 'categories' | 'channels';
