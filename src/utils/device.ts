/**
 * Device & Platform detection utilities
 * Ensures mobile devices automatically trigger landscape fullscreen while Smart TVs and desktops remain normal.
 */

export const isSmartTVDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /SmartTV|Tizen|Web0S|NetCast|HbbTV|AppleTV|GoogleTV|BRAVIA|Viera|Roku|AFTT|Android TV|Large Screen/i.test(ua);
};

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  // If explicitly a Smart TV, return false
  if (isSmartTVDevice()) return false;

  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isSmallScreen = window.innerWidth <= 840 || window.innerHeight <= 500;

  return isMobileUA || Boolean(isTouch && isSmallScreen);
};

/**
 * Attempts to enter Fullscreen and lock the screen orientation to landscape.
 * ONLY runs on mobile devices - leaves Smart TV and desktop versions untouched.
 */
export const requestMobileLandscapeFullscreen = async (
  container?: HTMLElement | null,
  video?: HTMLVideoElement | null
): Promise<boolean> => {
  // Only trigger on mobile devices - keep TV and Desktop normal
  if (!isMobileDevice()) {
    return false;
  }

  try {
    // 1. Enter Fullscreen mode
    if (!document.fullscreenElement) {
      const target = container || document.documentElement;
      if (target.requestFullscreen) {
        await target.requestFullscreen().catch(() => {});
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen().catch(() => {});
      } else if (video && (video as any).webkitEnterFullscreen) {
        // iOS Safari video fullscreen
        (video as any).webkitEnterFullscreen();
      }
    }

    // 2. Lock screen orientation to landscape
    if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
      try {
        await (screen.orientation as any).lock('landscape');
      } catch {
        try {
          await (screen.orientation as any).lock('landscape-primary');
        } catch {
          // Handled silently if browser restrictions apply
        }
      }
    }
    return true;
  } catch {
    return false;
  }
};
