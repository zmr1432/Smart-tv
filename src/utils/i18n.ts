// Multi-Language Localization Engine (i18n)
// Supports English, Telugu, Kannada, and Tamil

export type AppLanguage = 'en' | 'te' | 'kn' | 'ta';

export interface LanguageOption {
  id: AppLanguage;
  nameEnglish: string;
  nativeName: string;
  subtext: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  {
    id: 'en',
    nameEnglish: 'English',
    nativeName: 'English',
    subtext: 'Default Global Language',
    flag: '🇬🇧',
  },
  {
    id: 'te',
    nameEnglish: 'Telugu',
    nativeName: 'తెలుగు',
    subtext: 'ఆంధ్రప్రదేశ్ & తెలంగాణ',
    flag: '🇮🇳',
  },
  {
    id: 'kn',
    nameEnglish: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    subtext: 'ಕರ್ನಾಟಕ',
    flag: '🇮🇳',
  },
  {
    id: 'ta',
    nameEnglish: 'Tamil',
    nativeName: 'தமிழ்',
    subtext: 'தமிழ்நாடு',
    flag: '🇮🇳',
  },
];

const STORAGE_LANG_KEY = 'smart_tv_app_language';
const EVENT_LANG_CHANGED = 'app-language-changed';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    menu: 'Menu',
    epgTitle: '1. EPG',
    epgSubtitle: '6 Channels Grid',
    allChannelsTitle: '2. All Channel List',
    allChannelsSubtitle: 'Full Channels Menu',
    languageTitle: '3. App Language',
    languageSubtitle: 'English / తెలుగు / ಕನ್ನಡ / தமிழ்',
    selectLanguage: 'Select App Language',
    chooseLanguageSubtitle: 'Choose your preferred language for the TV guide & interface',
    close: 'Close',
    landscape: 'Landscape',
    favorite: 'Favorite',
    favorited: 'Favorited',
    tuningChannel: 'Tuning Channel Number',
    directNumberEntry: 'Direct number entry...',
    searchChannels: 'Search channels...',
    pressOkToWatch: 'Press OK to Watch',
    activeLanguage: 'Active Language',
    appliedSuccess: 'Language applied successfully!',
    // Remote Bar Shortcuts
    channelList: 'Channel List',
    changeChannel: 'Change Channel',
    volume: 'Volume',
    back: 'Back',
    // Mobile Gesture HUD
    nextChannel: 'Next Channel ▲',
    prevChannel: 'Prev Channel ▼',
    swipeUpNext: '▲ Swipe Up: Next CH',
    swipeDownPrev: '▼ Swipe Down: Prev CH',
    volHint: '◄ Left (Down) • Right (Up) ►',
    muted: 'Muted',
    // Activation & License
    activateNow: 'Activate Now',
    activationTitle: 'Device Activation',
    activationSubtitle: '8-Digit Unique TV Code & License Activation',
    yourDeviceCode: 'Your 8-Digit Device Code:',
    newCode: 'New Code',
    copy: 'Copy',
    copied: 'Copied!',
    deviceCodeDesc: 'This 8-digit code is unique to this TV or device. Provide this code for a license key.',
    statusLabel: 'Status:',
    statusActive: 'Active',
    statusExpired: 'Expired',
    statusInactive: 'Not Activated',
    remainingTime: 'Remaining Time:',
    expiresAt: 'Expires:',
    freeTrialHint: 'Free Trial Code:',
    enterActivationCode: 'Enter Activation Code Here:',
    codePlaceholder: 'e.g. 1432 or license code...',
    activateBtn: 'Activate',
    tvKeypad: 'TV Keypad (On-Screen)',
    clear: 'Clear',
    activationSuccess: '🎉 Activation Successful!',
    enterValidCode: 'Please enter an activation code',
    invalidCode: 'Invalid activation code! Please enter correct code.',
    daysLabel: 'Days',
    // Categories
    cat_all: 'All Channels',
    cat_news: 'News',
    cat_entertainment: 'Entertainment',
    cat_movies: 'Movies',
    cat_music: 'Music',
    cat_religious: 'Devotional',
    cat_sports: 'Sports',
  },
  te: {
    menu: 'మెనూ',
    epgTitle: '1. EPG',
    epgSubtitle: '6 ఛానల్స్ గ్రిడ్',
    allChannelsTitle: '2. అన్ని ఛానల్స్ లిస్ట్',
    allChannelsSubtitle: 'పూర్తి ఛానల్స్ మెనూ',
    languageTitle: '3. యాప్ భాష',
    languageSubtitle: 'భాషను మార్చుకోండి (Language)',
    selectLanguage: 'యాప్ భాషను ఎంచుకోండి',
    chooseLanguageSubtitle: 'టీవీ గైడ్ మరియు ఇంటర్‌ఫేస్ కోసం మీ ప్రాధాన్యత భాషను ఎంచుకోండి',
    close: 'మూసివేయి',
    landscape: 'ల్యాండ్‌స్కేప్',
    favorite: 'ఫేవరెట్',
    favorited: 'ఫేవరెట్ చేయబడింది',
    tuningChannel: 'ఛానల్ నంబర్ ట్యూనింగ్',
    directNumberEntry: 'నంబర్ నేరుగా ఎంటర్ చేయండి...',
    searchChannels: 'ఛానల్స్ వెతకండి...',
    pressOkToWatch: 'చూడటానికి OK నొక్కండి',
    activeLanguage: 'ప్రస్తుత భాష',
    appliedSuccess: 'భాష విజయవంతంగా మార్చబడింది!',
    // Remote Bar Shortcuts
    channelList: 'ఛానల్ లిస్ట్',
    changeChannel: 'ఛానల్ మార్చు',
    volume: 'వాల్యూమ్',
    back: 'వెనుకకు',
    // Mobile Gesture HUD
    nextChannel: 'తరువాతి ఛానల్ ▲',
    prevChannel: 'మునుపటి ఛానల్ ▼',
    swipeUpNext: '▲ పైకి స్వైప్: తరువాత ఛానల్',
    swipeDownPrev: '▼ క్రిందికి స్వైప్: మునుపటి ఛానల్',
    volHint: '◄ ఎడమ (తగ్గించు) • కుడి (పెంచు) ►',
    muted: 'మ్యూట్ చేయబడింది',
    // Activation & License
    activateNow: 'ఇప్పుడే యాక్టివేట్ చేయండి',
    activationTitle: 'డివైస్ యాక్టివేషన్',
    activationSubtitle: '8-అంకెల ప్రత్యేక TV కోడ్ & లైసెన్స్ యాక్టివేషన్',
    yourDeviceCode: 'మీ 8-అంకెల డివైస్ కోడ్:',
    newCode: 'కొత్త కోడ్',
    copy: 'కాపీ',
    copied: 'కాపీ అయింది!',
    deviceCodeDesc: 'ఈ 8-అంకెల కోడ్ మీ టీవీ లేదా డివైస్‌కు ప్రత్యేకమైనది. లైసెన్స్ కీ కోసం ఈ కోడ్‌ను అందించండి.',
    statusLabel: 'స్థితి:',
    statusActive: 'యాక్టివేట్ అయ్యింది',
    statusExpired: 'గడువు ముగిసింది',
    statusInactive: 'యాక్టివేట్ కాలేదు',
    remainingTime: 'మిగిలిన సమయం:',
    expiresAt: 'గడువు తేదీ:',
    freeTrialHint: 'ఉచిత ట్రయల్ కోడ్:',
    enterActivationCode: 'యాక్టివేషన్ కోడ్‌ను ఇక్కడ నమోదు చేయండి:',
    codePlaceholder: 'ఉదా: 1432 లేదా లైసెన్స్ కోడ్...',
    activateBtn: 'యాక్టివేట్ చేయండి',
    tvKeypad: 'TV కీప్యాడ్ (ఆన్-స్క్రీన్)',
    clear: 'క్లియర్',
    activationSuccess: '🎉 యాక్టివేషన్ విజయవంతమైంది!',
    enterValidCode: 'దయచేసి యాక్టివేషన్ కోడ్‌ను నమోదు చేయండి',
    invalidCode: 'తప్పుడు యాక్టివేషన్ కోడ్! దయచేసి సరైన కోడ్‌ను నమోదు చేయండి.',
    daysLabel: 'రోజులు',
    // Categories
    cat_all: 'అన్ని ఛానల్స్',
    cat_news: 'వార్తలు',
    cat_entertainment: 'ఎంటర్‌టైన్‌మెంట్',
    cat_movies: 'సినిమాలు',
    cat_music: 'సంగీతం',
    cat_religious: 'భక్తి / ఆధ్యాత్మికం',
    cat_sports: 'స్పోర్ట్స్',
  },
  kn: {
    menu: 'ಮೆನು',
    epgTitle: '1. EPG',
    epgSubtitle: '6 ಚಾನೆಲ್‌ಗಳ ಗ್ರಿಡ್',
    allChannelsTitle: '2. ಎಲ್ಲಾ ಚಾನೆಲ್‌ಗಳ ಪಟ್ಟಿ',
    allChannelsSubtitle: 'ಸಂಪೂರ್ಣ ಚಾನೆಲ್‌ಗಳ ಮೆನು',
    languageTitle: '3. ಆ್ಯಪ್ ಭಾಷೆ',
    languageSubtitle: 'ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ (Language)',
    selectLanguage: 'ಆ್ಯಪ್ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    chooseLanguageSubtitle: 'ಟಿವಿ ಗೈಡ್ ಮತ್ತು ಇಂಟರ್ಫೇಸ್‌ಗಾಗಿ ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    close: 'ಮುಚ್ಚು',
    landscape: 'ಲ್ಯಾಂಡ್‌ಸ್ಕೇಪ್',
    favorite: 'ಮೆಚ್ಚಿನವು',
    favorited: 'ಮೆಚ್ಚಿನವುಗಳಲ್ಲಿ ಸೇರಿಸಲಾಗಿದೆ',
    tuningChannel: 'ಚಾನೆಲ್ ಸಂಖ್ಯೆ ಟ್ಯೂನಿಂಗ್',
    directNumberEntry: 'ಸಂಖ್ಯೆಯನ್ನು ನೇರವಾಗಿ ನಮೂದಿಸಿ...',
    searchChannels: 'ಚಾನೆಲ್‌ಗಳನ್ನು ಹುಡುಕಿ...',
    pressOkToWatch: 'ವೀಕ್ಷಿಸಲು OK ಒತ್ತಿರಿ',
    activeLanguage: 'ಪ್ರಸ್ತುತ ಭಾಷೆ',
    appliedSuccess: 'ಭಾಷೆ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಗಿದೆ!',
    // Remote Bar Shortcuts
    channelList: 'ಚಾನೆಲ್ ಪಟ್ಟಿ',
    changeChannel: 'ಚಾನೆಲ್ ಬದಲಾಯಿಸಿ',
    volume: 'ವಾಲ್ಯೂಮ್',
    back: 'ಹಿಂದೆ',
    // Mobile Gesture HUD
    nextChannel: 'ಮುಂದಿನ ಚಾನೆಲ್ ▲',
    prevChannel: 'ಹಿಂದಿನ ಚಾನೆಲ್ ▼',
    swipeUpNext: '▲ ಮೇಲೆ ಸ್ವೈಪ್: ಮುಂದಿನ ಚಾನೆಲ್',
    swipeDownPrev: '▼ ಕೆಳಗೆ ಸ್ವೈಪ್: ಹಿಂದಿನ ಚಾನೆಲ್',
    volHint: '◄ ಎಡ (ಕಡಿಮೆ) • ಬಲ (ಹೆಚ್ಚು) ►',
    muted: 'ಮ್ಯೂಟ್ ಮಾಡಲಾಗಿದೆ',
    // Activation & License
    activateNow: 'ಈಗಲೇ ಸಕ್ರಿಯಗೊಳಿಸಿ',
    activationTitle: 'ಸಾಧನ ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆ',
    activationSubtitle: '8-ಅಂಕಿಯ ಅನನ್ಯ ಟಿವಿ ಕೋಡ್ & ಪರವಾನಗಿ ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆ',
    yourDeviceCode: 'ನಿಮ್ಮ 8-ಅಂಕಿಯ ಸಾಧನ ಕೋಡ್:',
    newCode: 'ಹೊಸ ಕೋಡ್',
    copy: 'ನಕಲಿಸಿ',
    copied: 'ನಕಲಿಸಲಾಗಿದೆ!',
    deviceCodeDesc: 'ಈ 8-ಅಂಕಿಯ ಕೋಡ್ ನಿಮ್ಮ ಟಿವಿಗೆ ಪ್ರತ್ಯೇಕವಾಗಿದೆ. ಪರವಾನಗಿ ಕೀಗಾಗಿ ಈ ಕೋಡ್ ನೀಡಿ.',
    statusLabel: 'ಸ್ಥಿತಿ:',
    statusActive: 'ಸಕ್ರಿಯವಾಗಿದೆ',
    statusExpired: 'ಅವಧಿ ಮುಗಿದಿದೆ',
    statusInactive: 'ಸಕ್ರಿಯವಾಗಿಲ್ಲ',
    remainingTime: 'ಉಳಿದ ಸಮಯ:',
    expiresAt: 'ಅವಧಿ ಮುಕ್ತಾಯ:',
    freeTrialHint: 'ಉಚಿತ ಪ್ರಾಯೋಗಿಕ ಕೋಡ್:',
    enterActivationCode: 'ಸಕ್ರಿಯಗೊಳಿಸುವ ಕೋಡ್ ಅನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ:',
    codePlaceholder: 'ಉದಾ: 1432 ಅಥವಾ ಪರವಾನಗಿ ಕೋಡ್...',
    activateBtn: 'ಸಕ್ರಿಯಗೊಳಿಸಿ',
    tvKeypad: 'ಟಿವಿ ಕೀಪ್ಯಾಡ್',
    clear: 'ತೆರವುಗೊಳಿಸಿ',
    activationSuccess: '🎉 ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆ ಯಶಸ್ವಿಯಾಗಿದೆ!',
    enterValidCode: 'ದಯವಿಟ್ಟು ಸಕ್ರಿಯಗೊಳಿಸುವ ಕೋಡ್ ನಮೂದಿಸಿ',
    invalidCode: 'ತಪ್ಪಾದ ಕೋಡ್! ದಯವಿಟ್ಟು ಸರಿಯಾದ ಕೋಡ್ ನಮೂದಿಸಿ.',
    daysLabel: 'ದಿನಗಳು',
    // Categories
    cat_all: 'ಎಲ್ಲಾ ಚಾನೆಲ್‌ಗಳು',
    cat_news: 'ಸುದ್ದಿ',
    cat_entertainment: 'ಮನರಂಜನೆ',
    cat_movies: 'ಚಲನಚಿತ್ರಗಳು',
    cat_music: 'ಸಂಗೀತ',
    cat_religious: 'ಭಕ್ತಿ / ಆಧ್ಯಾತ್ಮಿಕ',
    cat_sports: 'ಕ್ರೀಡೆ',
  },
  ta: {
    menu: 'மெனு',
    epgTitle: '1. EPG',
    epgSubtitle: '6 சேனல்கள் கிரிட்',
    allChannelsTitle: '2. அனைத்து சேனல்கள் பட்டியல்',
    allChannelsSubtitle: 'முழு சேனல்கள் மெனு',
    languageTitle: '3. ஆப் மொழி',
    languageSubtitle: 'மொழியை மாற்றவும் (Language)',
    selectLanguage: 'ஆப் மொழியைத் தேர்ந்தெடுக்கவும்',
    chooseLanguageSubtitle: 'டிவி வழிகாட்டி மற்றும் இடைமுகத்திற்கான உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    close: 'மூடு',
    landscape: 'லேண்ட்ஸ்கேப்',
    favorite: 'விருப்பமானது',
    favorited: 'விருப்பத்தில் சேர்க்கப்பட்டது',
    tuningChannel: 'சேனல் எண் ட்யூனிங்',
    directNumberEntry: 'எண்ணை நேரடியாக உள்ளிடவும்...',
    searchChannels: 'சேனல்களைத் தேடுங்கள்...',
    pressOkToWatch: 'பார்க்க OK அழுத்தவும்',
    activeLanguage: 'தற்போதைய மொழி',
    appliedSuccess: 'மொழி வெற்றிகரமாக மாற்றப்பட்டது!',
    // Remote Bar Shortcuts
    channelList: 'சேனல் பட்டியல்',
    changeChannel: 'சேனல் மாற்றவும்',
    volume: 'ஒலி அளவு',
    back: 'பின்செல்',
    // Mobile Gesture HUD
    nextChannel: 'அடுத்த சேனல் ▲',
    prevChannel: 'முந்தைய சேனல் ▼',
    swipeUpNext: '▲ மேலே ஸ்வைப்: அடுத்த சேனல்',
    swipeDownPrev: '▼ கீழே ஸ்வைப்: முந்தைய சேனல்',
    volHint: '◄ இடது (குறைக்கவும்) • வலது (அதிகரிக்கவும்) ►',
    muted: 'ஒலி முடக்கப்பட்டது',
    // Activation & License
    activateNow: 'இப்போதே செயல்படுத்தவும்',
    activationTitle: 'சாதனம் செயல்படுத்தல்',
    activationSubtitle: '8-இலக்க தனிப்பட்ட டிவி குறியீடு & உரிமச் செயலாக்கம்',
    yourDeviceCode: 'உங்கள் 8-இலக்க சாதன குறியீடு:',
    newCode: 'புதிய குறியீடு',
    copy: 'நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',
    deviceCodeDesc: 'இந்த 8-இலக்க குறியீடு உங்கள் டிவிக்கு தனித்துவமானது. உரிமக் குறியீட்டிற்கு இந்தக் குறியீட்டை வழங்கவும்.',
    statusLabel: 'நிலை:',
    statusActive: 'செயலில் உள்ளது',
    statusExpired: 'காலாவதியானது',
    statusInactive: 'செயல்படுத்தப்படவில்லை',
    remainingTime: 'மீதமுள்ள நேரம்:',
    expiresAt: 'காலாவதி:',
    freeTrialHint: 'இலவச சோதனை குறியீடு:',
    enterActivationCode: 'செயல்படுத்தும் குறியீட்டை இங்கே உள்ளிடவும்:',
    codePlaceholder: 'எ.கா: 1432 அல்லது உரிமக் குறியீடு...',
    activateBtn: 'செயல்படுத்து',
    tvKeypad: 'டிவி விசைப்பலகை',
    clear: 'அழி',
    activationSuccess: '🎉 செயல்படுத்தல் வெற்றிகரமானது!',
    enterValidCode: 'தயவுசெய்து செயல்படுத்தும் குறியீட்டை உள்ளிடவும்',
    invalidCode: 'தவறான குறியீடு! சரியான குறியீட்டை உள்ளிடவும்.',
    daysLabel: 'நாட்கள்',
    // Categories
    cat_all: 'அனைத்து சேனல்கள்',
    cat_news: 'செய்திகள்',
    cat_entertainment: 'பொழுதுபோக்கு',
    cat_movies: 'திரைப்படங்கள்',
    cat_music: 'இசை',
    cat_religious: 'பக்தி',
    cat_sports: 'விளையாட்டு',
  },
};

/**
 * Returns currently stored language (defaults to Telugu 'te' as primary regional TV audience)
 */
export function getAppLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY) as AppLanguage;
    if (saved && (saved === 'en' || saved === 'te' || saved === 'kn' || saved === 'ta')) {
      return saved;
    }
  } catch {}
  return 'te';
}

/**
 * Updates application language and notifies listeners
 */
export function setAppLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_LANG_CHANGED, { detail: { lang } }));
    }
  } catch {}
}

/**
 * Look up translation for given key
 */
export function t(key: string, lang?: AppLanguage): string {
  const currentLang = lang || getAppLanguage();
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

/**
 * Listen for language change events
 */
export function onLanguageChange(callback: (lang: AppLanguage) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => {
    if (e.detail?.lang) {
      callback(e.detail.lang);
    }
  };
  window.addEventListener(EVENT_LANG_CHANGED, handler);
  return () => {
    window.removeEventListener(EVENT_LANG_CHANGED, handler);
  };
}
