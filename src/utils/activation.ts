/**
 * Smart TV & Mobile Device Activation Engine
 * 
 * Supports 8-digit Device Code generation for TV & Mobile devices:
 * - 3 Minute Trial Code: '1432' (Only 1 time use per device!)
 * - 30 Days Plan: tvCode / 3 (e.g. 14320099 / 3 = 4773366)
 * - 60 Days Plan: tvCode / 6
 * - 365 Days Plan (1 Year): tvCode / 36.5
 */

export interface ActivationData {
  isActivated: boolean;
  deviceCode: string;
  activatedAt: number;
  expiresAt: number;
  daysGranted: number;
  durationMs?: number;
  planName: string;
  lastCodeUsed?: string;
  isTrial?: boolean;
}

export interface ActivationStatus {
  isActivated: boolean;
  isExpired: boolean;
  wasTrialExpired?: boolean;
  deviceCode: string;
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
  remainingSeconds: number;
  remainingTimeFormatted: string;
  expiresAtDate: string;
  daysGranted: number;
  planName: string;
  trialUsed: boolean;
  trialRemainingUses: number;
}

const STORAGE_KEY_DEVICE_CODE = 'smart_tv_device_code';
const STORAGE_KEY_ACTIVATION = 'smart_tv_activation_data';
const STORAGE_KEY_TRIAL_3MIN_1432 = 'smart_tv_trial_3min_1432_used_once';

// In-memory fallback tracking for robustness
const memoryTrialUsed: Record<string, boolean> = {};
let memoryActivationData: ActivationData | null = null;

/**
 * Checks whether the 3-minute trial code 1432 has already been used on this device.
 */
export function hasUsed3MinTrial(deviceCode?: string): boolean {
  const code = deviceCode || 'default_device';
  if (memoryTrialUsed[code] || memoryTrialUsed['global']) {
    return true;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const specificVal = localStorage.getItem(`${STORAGE_KEY_TRIAL_3MIN_1432}_${code}`);
      if (specificVal === 'true' || specificVal === '1') {
        return true;
      }
      const globalVal = localStorage.getItem(STORAGE_KEY_TRIAL_3MIN_1432);
      if (globalVal === 'true' || globalVal === '1') {
        return true;
      }
    }
  } catch {}
  return false;
}

/**
 * Marks the 3-minute trial code 1432 as used on this device (strictly 1 time only).
 */
export function mark3MinTrialUsed(deviceCode?: string): void {
  const code = deviceCode || 'default_device';
  memoryTrialUsed[code] = true;
  memoryTrialUsed['global'] = true;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_TRIAL_3MIN_1432}_${code}`, 'true');
      localStorage.setItem(STORAGE_KEY_TRIAL_3MIN_1432, 'true');
    }
  } catch {}
}

/**
 * Gets remaining uses for 3-minute trial (1 if not used, 0 if used).
 */
export function getTrial1432RemainingUses(deviceCode?: string): number {
  return hasUsed3MinTrial(deviceCode) ? 0 : 1;
}

/**
 * Gets or creates a persistent 8-digit device code for this TV or Mobile device.
 */
export function getDeviceCode(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_DEVICE_CODE);
    if (existing && /^\d{8}$/.test(existing.trim())) {
      return existing.trim();
    }

    // Generate random 8-digit number (10000000 - 99999999)
    const newCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    localStorage.setItem(STORAGE_KEY_DEVICE_CODE, newCode);
    return newCode;
  } catch {
    return '14320099';
  }
}

/**
 * Allows setting or resetting the device code.
 */
export function setDeviceCode(code: string): string {
  const clean = code.trim().replace(/\D/g, '').slice(0, 8);
  const finalCode = clean.length === 8 ? clean : getDeviceCode();
  try {
    localStorage.setItem(STORAGE_KEY_DEVICE_CODE, finalCode);
  } catch {}
  return finalCode;
}

/**
 * Generates a brand new 8-digit device code.
 */
export function generateNewDeviceCode(): string {
  const newCode = Math.floor(10000000 + Math.random() * 90000000).toString();
  try {
    localStorage.setItem(STORAGE_KEY_DEVICE_CODE, newCode);
  } catch {}
  return newCode;
}

/**
 * Calculates official activation codes for any 8-digit TV/Device code:
 * - 30 Days: tvCode / 3 or (tvCode / 30)
 * - 60 Days: tvCode / 6
 * - 365 Days (1 Year): tvCode / 36.5
 */
export function calculateActivationCodes(deviceCode: string) {
  const num = parseInt(deviceCode.replace(/\D/g, ''), 10) || 14320099;
  
  // 30 Days Code: tvCode / 3 (e.g. 14320099 / 3 = 4773366)
  const code30Days = Math.floor(num / 3).toString();
  
  // Alternative 30 Days Code: direct tvCode / 30
  const code30DaysAlt = Math.floor(num / 30).toString();

  // 60 Days: tvCode / 6
  const code60Days = Math.floor(num / 6).toString();

  // 365 Days (1 Year): tvCode / 36.5
  const code365Days = Math.floor(num / 36.5).toString();

  return {
    code30Days,
    code30DaysAlt,
    code60Days,
    code365Days,
  };
}

/**
 * Validates entered activation code against the device code.
 */
export function validateActivationCode(enteredCode: string, deviceCode: string): {
  valid: boolean;
  days: number;
  durationMs?: number;
  planName: string;
  isTrial?: boolean;
  error?: string;
} {
  const cleanCode = enteredCode.trim().replace(/\D/g, '');
  const cleanDevice = deviceCode.trim().replace(/\D/g, '');

  if (!cleanCode) {
    return { valid: false, days: 0, planName: '', error: 'దయచేసి యాక్టివేషన్ కోడ్ ఎంటర్ చేయండి' };
  }

  // 1. Fixed 3-Minute Activation Code '1432' (Only 1 time use!)
  if (cleanCode === '1432') {
    if (hasUsed3MinTrial(cleanDevice)) {
      return { 
        valid: false, 
        days: 0, 
        planName: '', 
        error: '3 నిమిషాల ట్రయల్ కోడ్ 1432 ఇప్పటికే ఒకసారి ఉపయోగించబడింది (1 సారి మాత్రమే అనుమతించబడుతుంది).' 
      };
    }
    return { 
      valid: true, 
      days: 3 / 1440, 
      durationMs: 3 * 60 * 1000, // 3 minutes = 180 seconds
      planName: '3 Minute Trial (3 నిమిషాల ఉచిత ట్రయల్)',
      isTrial: true,
    };
  }

  if (cleanDevice.length !== 8) {
    return { valid: false, days: 0, planName: '', error: 'చెల్లని 8-అంకెల TV డివైస్ కోడ్' };
  }

  const { code30Days, code30DaysAlt, code60Days, code365Days } = calculateActivationCodes(cleanDevice);

  // 2. Check 30 Days match (tvCode / 3 or tvCode / 30)
  if (cleanCode === code30Days || cleanCode === code30DaysAlt) {
    return { valid: true, days: 30, durationMs: 30 * 24 * 60 * 60 * 1000, planName: '30 Days Activation (30 రోజుల ప్లాన్)' };
  }

  // 3. Check 60 Days match
  if (cleanCode === code60Days) {
    return { valid: true, days: 60, durationMs: 60 * 24 * 60 * 60 * 1000, planName: '60 Days Plan (2 నెలల ప్లాన్)' };
  }

  // 4. Check 365 Days match
  if (cleanCode === code365Days) {
    return { valid: true, days: 365, durationMs: 365 * 24 * 60 * 60 * 1000, planName: '1 Year License (1 సంవత్సరం ప్లాన్)' };
  }

  // 5. Master / Admin Override Keys for testing
  if (cleanCode === '99999999' || cleanCode === '77777777' || cleanCode === '999999' || cleanCode === '777777') {
    return { valid: true, days: 365, durationMs: 365 * 24 * 60 * 60 * 1000, planName: 'Master Admin License (1 సంవత్సరం)' };
  }

  return { 
    valid: false, 
    days: 0, 
    planName: '', 
    error: 'చెల్లని యాక్టివేషన్ కోడ్! దయచేసి సరైన కోడ్ ఎంటర్ చేయండి.' 
  };
}

/**
 * Gets current activation status from local storage.
 */
export function getActivationStatus(): ActivationStatus {
  const deviceCode = getDeviceCode();
  const trialUsed = hasUsed3MinTrial(deviceCode);
  const trialRemainingUses = trialUsed ? 0 : 1;

  try {
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(STORAGE_KEY_ACTIVATION);
    }
    if (!raw && memoryActivationData) {
      raw = JSON.stringify(memoryActivationData);
    }

    if (!raw) {
      return {
        isActivated: false,
        isExpired: false,
        wasTrialExpired: false,
        deviceCode,
        remainingDays: 0,
        remainingHours: 0,
        remainingMinutes: 0,
        remainingSeconds: 0,
        remainingTimeFormatted: '0s',
        expiresAtDate: 'యాక్టివేట్ కాలేదు',
        daysGranted: 0,
        planName: 'Not Activated',
        trialUsed,
        trialRemainingUses,
      };
    }

    const data: ActivationData = JSON.parse(raw);
    const now = Date.now();

    // Check device code match
    if (data.deviceCode && data.deviceCode !== deviceCode) {
      return {
        isActivated: false,
        isExpired: false,
        wasTrialExpired: false,
        deviceCode,
        remainingDays: 0,
        remainingHours: 0,
        remainingMinutes: 0,
        remainingSeconds: 0,
        remainingTimeFormatted: '0s',
        expiresAtDate: 'డివైస్ మారినది',
        daysGranted: 0,
        planName: 'Device Mismatch',
        trialUsed,
        trialRemainingUses,
      };
    }

    const remainingMs = data.expiresAt - now;

    if (remainingMs <= 0) {
      return {
        isActivated: false,
        isExpired: true,
        wasTrialExpired: Boolean(data.isTrial),
        deviceCode,
        remainingDays: 0,
        remainingHours: 0,
        remainingMinutes: 0,
        remainingSeconds: 0,
        remainingTimeFormatted: '0s',
        expiresAtDate: new Date(data.expiresAt).toLocaleDateString('te-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        daysGranted: data.daysGranted,
        planName: data.isTrial ? '3-Minute Trial Expired' : 'Expired (గడువు ముగిసింది)',
        trialUsed,
        trialRemainingUses,
      };
    }

    const remainingTotalSecs = Math.max(0, Math.floor(remainingMs / 1000));
    const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const secComponent = remainingTotalSecs % 60;

    let remainingTimeFormatted = '';
    if (remainingDays >= 1) {
      remainingTimeFormatted = `${remainingDays} ${remainingDays === 1 ? 'Day' : 'Days'}`;
    } else if (remainingHours >= 1) {
      remainingTimeFormatted = `${remainingHours}h ${remainingMinutes % 60}m`;
    } else if (remainingMinutes >= 1) {
      remainingTimeFormatted = `${remainingMinutes}m ${secComponent}s`;
    } else {
      remainingTimeFormatted = `${remainingTotalSecs}s`;
    }

    const expiresDate = new Date(data.expiresAt);
    const formattedDate = expiresDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      isActivated: true,
      isExpired: false,
      wasTrialExpired: false,
      deviceCode,
      remainingDays,
      remainingHours,
      remainingMinutes,
      remainingSeconds: secComponent,
      remainingTimeFormatted,
      expiresAtDate: formattedDate,
      daysGranted: data.daysGranted,
      planName: data.planName,
      trialUsed,
      trialRemainingUses,
    };
  } catch {
    return {
      isActivated: false,
      isExpired: false,
      wasTrialExpired: false,
      deviceCode,
      remainingDays: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingSeconds: 0,
      remainingTimeFormatted: '0s',
      expiresAtDate: 'Not Activated',
      daysGranted: 0,
      planName: 'Not Activated',
      trialUsed,
      trialRemainingUses,
    };
  }
}

/**
 * Applies activation code and saves persistent license state.
 */
export function applyActivation(enteredCode: string, deviceCode: string): {
  success: boolean;
  days: number;
  durationMs?: number;
  planName: string;
  expiresAt?: number;
  error?: string;
} {
  const result = validateActivationCode(enteredCode, deviceCode);

  if (!result.valid) {
    return {
      success: false,
      days: 0,
      planName: '',
      error: result.error,
    };
  }

  const cleanCode = enteredCode.trim().replace(/\D/g, '');
  if (cleanCode === '1432') {
    mark3MinTrialUsed(deviceCode);
  }

  const now = Date.now();
  let baseTime = now;

  // If already active with time left, extend from current expiry
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVATION);
    if (raw) {
      const existing: ActivationData = JSON.parse(raw);
      if (existing.expiresAt && existing.expiresAt > now && existing.deviceCode === deviceCode) {
        baseTime = existing.expiresAt;
      }
    }
  } catch {}

  const additionalMs = result.durationMs ? result.durationMs : (result.days * 24 * 60 * 60 * 1000);
  const newExpiresAt = baseTime + additionalMs;

  const activationData: ActivationData = {
    isActivated: true,
    deviceCode,
    activatedAt: now,
    expiresAt: newExpiresAt,
    daysGranted: result.days,
    durationMs: additionalMs,
    planName: result.planName,
    lastCodeUsed: enteredCode.trim(),
    isTrial: result.isTrial,
  };

  memoryActivationData = activationData;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ACTIVATION, JSON.stringify(activationData));
    }
  } catch (err) {
    console.error('Storage error while saving activation:', err);
  }

  return {
    success: true,
    days: result.days,
    durationMs: additionalMs,
    planName: result.planName,
    expiresAt: newExpiresAt,
  };
}

/**
 * Resets / deactivates current activation data.
 */
export function resetActivation(): void {
  memoryActivationData = null;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVATION);
  } catch {}
}
