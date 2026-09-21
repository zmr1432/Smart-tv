/**
 * Activation state & device identifier utilities for Smart TV & Mobile app
 */

const STORAGE_KEY_ACTIVATION = 'smart_tv_activation';
const STORAGE_KEY_DEVICE_ID = 'smart_tv_device_id';

export interface ActivationData {
  isActivated: boolean;
  code: string;
  activatedAt: string;
  deviceId: string;
}

/**
 * Returns a stable unique Device ID / MAC ID for this TV or Mobile device.
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'TV-8821-AP';
  try {
    const existing = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (existing) return existing;

    // Generate a sleek Smart TV MAC & Device serial
    const hex = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `TV-${randomNum}-${hex()}${hex()}`;
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, generatedId);
    return generatedId;
  } catch {
    return 'TV-8821-AP';
  }
};

/**
 * Checks if the application is currently activated.
 */
export const getActivationData = (): ActivationData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVATION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.isActivated) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Activates the application with a code.
 * Accepts standard 4-8 character codes, numeric pins, or master codes.
 */
export const activateWithCode = (code: string): { success: boolean; message: string } => {
  const trimmed = code.trim().toUpperCase();

  if (!trimmed || trimmed.length < 4) {
    return {
      success: false,
      message: 'దయచేసి కనీసం 4 అంకెల సరైన యాక్టివేషన్ కోడ్ నమోదు చేయండి (Please enter at least 4 digits)',
    };
  }

  // Accepted criteria: Any alphanumeric code with 4 to 12 chars
  const isValidFormat = /^[A-Z0-9-]{4,12}$/.test(trimmed);
  if (!isValidFormat) {
    return {
      success: false,
      message: 'కోడ్ కేవలం అంకెలు మరియు అక్షరాలను మాత్రమే కలిగి ఉండాలి (Invalid code format)',
    };
  }

  const deviceId = getDeviceId();
  const activationRecord: ActivationData = {
    isActivated: true,
    code: trimmed,
    activatedAt: new Date().toISOString(),
    deviceId,
  };

  try {
    localStorage.setItem(STORAGE_KEY_ACTIVATION, JSON.stringify(activationRecord));
    return {
      success: true,
      message: 'యాప్ విజయవంతంగా యాక్టివేట్ చేయబడింది! (Activated successfully)',
    };
  } catch (err) {
    return {
      success: false,
      message: 'యాక్టివేషన్ సేవ్ చేయడంలో లోపం సంభవించింది',
    };
  }
};

/**
 * Deactivates the application (for testing or re-activation).
 */
export const deactivateApp = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVATION);
  } catch {
    // Silent catch
  }
};
