// Client Security & Anti-Theft Guard
// Prevents stream URL theft, inspection, and Dropbox source link extraction

const XOR_KEY = 0x5a;
const OBFUSCATED_SOURCE_BYTES = [
  50, 46, 46, 42, 41, 96, 117, 117, 62, 54, 116, 62, 40, 53, 42, 56, 53, 34, 47, 41,
  63, 40, 57, 53, 52, 46, 63, 52, 46, 116, 57, 53, 55, 117, 41, 57, 54, 117, 60, 51,
  117, 109, 35, 111, 61, 111, 54, 48, 104, 60, 47, 60, 44, 35, 43, 41, 40, 41, 106,
  59, 61, 47, 117, 14, 63, 54, 47, 61, 47, 116, 46, 34, 46, 101, 40, 54, 49, 63, 35,
  103, 111, 105, 62, 34, 34, 110, 34, 52, 56, 109, 42, 51, 34, 105, 42, 40, 104, 62,
  110, 61, 98, 106, 61, 98, 54, 124, 41, 46, 103, 60, 62, 45, 40, 49, 63, 109, 47,
  124, 62, 54, 103, 106,
];

/**
 * Reconstructs the source URL in memory without leaving plain-text strings in bundle
 */
export function getSecureSourceUrl(): string {
  try {
    return OBFUSCATED_SOURCE_BYTES.map((b) => String.fromCharCode(b ^ XOR_KEY)).join('');
  } catch {
    return '';
  }
}

/**
 * Scrambles data stored in localStorage so DevTools Application tab does not show plain URLs
 */
export function encryptStorage(data: string): string {
  try {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ 0x3f);
    }
    return btoa(unescape(encodeURIComponent(result)));
  } catch {
    return data;
  }
}

/**
 * Decrypts scrambled data from localStorage
 */
export function decryptStorage(cipher: string): string {
  try {
    const raw = decodeURIComponent(escape(atob(cipher)));
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ 0x3f);
    }
    return result;
  } catch {
    return cipher;
  }
}

/**
 * Anti-Tamper & Anti-Inspection Guard:
 * Prevents DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
 * and right-click inspection so casual tamperers cannot view stream sources.
 */
export function installAntiTamperProtection(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleKeydown = (e: KeyboardEvent) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element inspector)
    if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U or Cmd+U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S or Cmd+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      // Don't block our app's 'S' hotkey if not with Ctrl/Cmd
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  window.addEventListener('keydown', handleKeydown, { capture: true });
  window.addEventListener('contextmenu', handleContextMenu, { capture: true });

  return () => {
    window.removeEventListener('keydown', handleKeydown, { capture: true });
    window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
  };
}
