export type CategoryId = 'entertainment' | 'kids' | 'news' | 'music';

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
  nameTelugu: string;
  logo: string;
  streamUrl: string;
  fallbackUrl?: string;
  poster: string;
  currentProgram: {
    title: string;
    titleTelugu: string;
    description: string;
    duration: string;
    rating: string;
    genre: string;
  };
  resolution: '4K HDR' | '1080p FHD' | '720p HD';
  isLive: boolean;
}

export type TVFocusTarget = 
  | 'video'
  | 'menu-categories'
  | 'menu-channels'
  | 'remote'
  | 'settings';

export type MenuSection = 'recent' | 'favorites' | 'categories' | 'channels';
