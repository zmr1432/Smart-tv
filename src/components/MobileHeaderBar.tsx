import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { sfx } from '../utils/audio';
import { isSmartTVDevice } from '../utils/device';

interface MobileHeaderBarProps {
  isMenuOpen: boolean;
  onOpenMenu: () => void;
}

export const MobileHeaderBar: React.FC<MobileHeaderBarProps> = ({
  isMenuOpen,
  onOpenMenu,
}) => {
  // STRICT CONSTRAINT: Do NOT render in TV version (Smart TV UA or TV screen)
  if (isSmartTVDevice()) {
    return null;
  }

  // When the category menu is already open, hide the button so it does not overlap
  if (isMenuOpen) {
    return null;
  }

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Show button for exactly 3 seconds on screen touch, then automatically hide
  const showButtonTemporarily = useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3000); // 3 seconds timeout
  }, []);

  useEffect(() => {
    // Listen for touch/click on screen to show the Menu button
    const handleScreenTouch = () => {
      showButtonTemporarily();
    };

    window.addEventListener('touchstart', handleScreenTouch, { passive: true });
    window.addEventListener('pointerdown', handleScreenTouch, { passive: true });
    window.addEventListener('click', handleScreenTouch, { passive: true });

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      window.removeEventListener('touchstart', handleScreenTouch);
      window.removeEventListener('pointerdown', handleScreenTouch);
      window.removeEventListener('click', handleScreenTouch);
    };
  }, [showButtonTemporarily]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playOk();
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setIsVisible(false);
    onOpenMenu();
  };

  return (
    <div
      id="mobile-header-menu-container"
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 select-none block lg:hidden"
    >
      {/* Small Menu Button on Right Side (Visible ONLY for 3s on screen touch, Mobile only) */}
      <button
        id="mobile-header-menu-btn"
        type="button"
        onClick={handleMenuClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-xl shadow-black/60 border border-amber-300 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-md ${
          isVisible
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
        title="చానల్స్ మెనూ (Menu)"
        aria-label="Open Channels Menu"
      >
        <Menu className="w-3.5 h-3.5 stroke-[2.5] text-neutral-950" />
        <span className="text-[11px] font-black tracking-wide">మెనూ</span>
      </button>
    </div>
  );
};

