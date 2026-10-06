import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, LayoutGrid, ListFilter, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { sfx } from '../utils/audio';
import { getAppLanguage, onLanguageChange, t, AppLanguage } from '../utils/i18n';

interface MobileHeaderBarProps {
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  onOpenEPG: () => void;
  onOpenLanguage?: () => void;
  onOpenTVMode?: () => void;
  onRefreshChannels?: () => void;
  isSyncing?: boolean;
}

export const MobileHeaderBar: React.FC<MobileHeaderBarProps> = ({
  isMenuOpen,
  onOpenMenu,
  onOpenEPG,
  onOpenLanguage,
}) => {
  // When the category menu is already open, hide the button so it does not overlap
  if (isMenuOpen) {
    return null;
  }

  const [currentLang, setCurrentLang] = useState<AppLanguage>(() => getAppLanguage());
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return onLanguageChange((lang) => {
      setCurrentLang(lang);
    });
  }, []);

  // Show button on screen touch/interaction, auto-hide after 4 seconds if dropdown is closed
  const showButtonTemporarily = useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsDropdownOpen((open) => {
        if (!open) {
          setIsVisible(false);
        }
        return open;
      });
    }, 4000);
  }, []);

  useEffect(() => {
    const handleScreenTouch = () => {
      showButtonTemporarily();
    };

    window.addEventListener('touchstart', handleScreenTouch, { passive: true });
    window.addEventListener('pointerdown', handleScreenTouch, { passive: true });
    window.addEventListener('mousemove', handleScreenTouch, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleScreenTouch);
      window.removeEventListener('pointerdown', handleScreenTouch);
      window.removeEventListener('mousemove', handleScreenTouch);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [showButtonTemporarily]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playTick();
    setIsDropdownOpen((prev) => !prev);
    showButtonTemporarily();
  };

  const handleEpgClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playTick();
    setIsDropdownOpen(false);
    onOpenEPG();
  };

  const handleAllChannelListClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playTick();
    setIsDropdownOpen(false);
    onOpenMenu();
  };

  const handleLanguageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playTick();
    setIsDropdownOpen(false);
    if (onOpenLanguage) {
      onOpenLanguage();
    }
  };

  return (
    <div
      id="mobile-header-menu-container"
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 select-none flex flex-col items-end"
    >
      {/* Main Menu Button */}
      <button
        id="mobile-header-menu-btn"
        type="button"
        onClick={handleMenuToggle}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-2xl shadow-black/80 border border-amber-300 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-md ${
          isVisible || isDropdownOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
        title="Menu (EPG, All Channel List, App Language)"
        aria-label="Open Channels Menu"
      >
        <Menu className="w-4 h-4 stroke-[2.5] text-neutral-950" />
        <span className="text-[12px] font-black tracking-wide">{t('menu', currentLang)}</span>
        {isDropdownOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />
        )}
      </button>

      {/* Menu Sub Buttons Popup (1: EPG, 2: All Channels, 3: App Language) */}
      {isDropdownOpen && (
        <div
          id="menu-sub-buttons-popup"
          className="mt-2 flex flex-col gap-1.5 p-2 rounded-2xl bg-neutral-950/95 border border-white/20 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 min-w-[210px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. EPG (6 Channels Grid) */}
          <button
            type="button"
            id="sub-btn-epg-6ch"
            onClick={handleEpgClick}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-900/90 to-blue-800/90 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-xs border border-blue-400/40 shadow-md active:scale-95 transition-all cursor-pointer text-left"
          >
            <div className="p-1.5 rounded-lg bg-cyan-400 text-neutral-950 font-black shrink-0">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-[12px] leading-tight">{t('epgTitle', currentLang)}</span>
              <span className="text-[10px] text-cyan-300 font-medium">{t('epgSubtitle', currentLang)}</span>
            </div>
          </button>

          {/* 2. All Channel List */}
          <button
            type="button"
            id="sub-btn-all-channel-list"
            onClick={handleAllChannelListClick}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-500/15 hover:from-amber-500/35 hover:to-amber-500/25 text-amber-300 hover:text-white font-bold text-xs border border-amber-400/50 shadow-md active:scale-95 transition-all cursor-pointer text-left"
          >
            <div className="p-1.5 rounded-lg bg-amber-400 text-neutral-950 font-black shrink-0">
              <ListFilter className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-[12px] leading-tight">{t('allChannelsTitle', currentLang)}</span>
              <span className="text-[10px] text-amber-300/80 font-medium">{t('allChannelsSubtitle', currentLang)}</span>
            </div>
          </button>

          {/* 3. App Language (English / Telugu / Kannada / Tamil) */}
          <button
            type="button"
            id="sub-btn-app-language"
            onClick={handleLanguageClick}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900/90 hover:to-teal-900/90 text-emerald-300 hover:text-white font-bold text-xs border border-emerald-500/40 shadow-md active:scale-95 transition-all cursor-pointer text-left"
          >
            <div className="p-1.5 rounded-lg bg-emerald-400 text-neutral-950 font-black shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-[12px] leading-tight">{t('languageTitle', currentLang)}</span>
              <span className="text-[10px] text-emerald-300/80 font-medium">English / తెలుగు / ಕನ್ನಡ / தமிழ்</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
