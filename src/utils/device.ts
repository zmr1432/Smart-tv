export function isSmartTV(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast|viera|tizen|webos.*tv|crkey|aftb|aftt|firetv|roku|bravia|hisense|philips|xiaomi|tcl/i.test(ua) ||
    window.innerWidth >= 1920 && !('ontouchstart' in window)
  );
}

export const isSmartTVDevice = isSmartTV;

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (isSmartTV()) return false;
  const ua = navigator.userAgent.toLowerCase();
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
  const isSmallScreen = window.innerWidth <= 840 || window.innerHeight <= 500;
  return isMobileUA || (isTouch && isSmallScreen);
}

/**
 * Requests landscape fullscreen on mobile while leaving TVs in normal landscape mode
 */
export async function requestMobileLandscapeFullscreen(
  element?: HTMLElement | null,
  videoElement?: HTMLVideoElement | null
): Promise<boolean> {
  // If Smart TV, do not force mobile orientation locks
  if (isSmartTV()) return true;

  try {
    const el = element || document.documentElement;
    const doc = document as any;

    const isFullscreenNow = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    // 1. Enter Fullscreen with navigationUI hidden
    if (!isFullscreenNow) {
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: 'hide' } as any).catch(() => {
          return el.requestFullscreen();
        }).catch(() => {});
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen().catch(() => {});
      } else if ((el as any).mozRequestFullScreen) {
        await (el as any).mozRequestFullScreen().catch(() => {});
      } else if ((el as any).msRequestFullscreen) {
        await (el as any).msRequestFullscreen().catch(() => {});
      } else if (videoElement && (videoElement as any).webkitEnterFullscreen) {
        try {
          (videoElement as any).webkitEnterFullscreen();
        } catch {}
      }
    }

    // 2. Lock Screen Orientation to Landscape on Mobile
    if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
      try {
        await (screen.orientation as any).lock('landscape');
      } catch {
        try {
          await (screen.orientation as any).lock('landscape-primary');
        } catch {}
      }
    }

    return true;
  } catch {
    return false;
  }
}
