import React from 'react';

const WATERMARK_LOGO = 'https://i.ibb.co/GfcjDRD0/1000281966-removebg-preview.png';

interface CornerLogoProps {
  isMenuOpen: boolean;
  channelName?: string;
}

export const CornerLogo: React.FC<CornerLogoProps> = ({ isMenuOpen, channelName }) => (
  <div
    id="screen-corner-watermark-logo"
    className={`fixed bottom-3 right-3 sm:bottom-4 sm:right-5 z-30 transition-all duration-300 select-none pointer-events-none ${
      isMenuOpen ? 'opacity-15' : 'opacity-85'
    }`}
  >
    <div className="flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/35 backdrop-blur-sm border border-white/10 shadow-lg">
      <img
        src={WATERMARK_LOGO}
        alt="TV Watermark Logo"
        className="h-5 sm:h-6 md:h-7 max-w-[80px] sm:max-w-[100px] object-contain filter drop-shadow"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // If image fails, fallback to styled text
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  </div>
);
