import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Tv, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  ShieldCheck,
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { sfx } from '../utils/audio';

interface ApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkModal: React.FC<ApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  const pwabuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentAppUrl)}`;

  const handleInstallClick = async () => {
    sfx.playOk();
    const success = await install();
    if (success) {
      setInstalledSuccess(true);
      sfx.playSuccess();
    }
  };

  const handleCopyUrl = () => {
    if (!currentAppUrl) return;
    navigator.clipboard?.writeText(currentAppUrl);
    setCopiedUrl(true);
    sfx.playTick();
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      id="apk-generation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-amber-500/30 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>APK & యాప్ ఇన్‌స్టాల్</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold uppercase">
                  WebAPK / PWA
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                Android TV & Mobile APK Package Generator
              </p>
            </div>
          </div>

          <button
            id="apk-modal-close-btn"
            onClick={() => {
              sfx.playBack();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: Direct 1-Click Android WebAPK Install */}
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
              <Sparkles className="w-4 h-4" />
              <span>పద్ధతి 1: డైరెక్ట్ ఆటోమేటిక్ ఇన్‌స్టాల్ (సిఫార్సు చేయబడింది)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-extrabold uppercase">
              1-Click
            </span>
          </div>
          <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
            Android ఫోన్ లేదా Android Smart TV బ్రౌజర్‌లో (Chrome/Brave) ఇది నేరుగా హోమ్ స్క్రీన్‌పై స్వతంత్ర <strong>WebAPK</strong> యాప్‌లా ఇన్‌స్టాల్ అవుతుంది.
          </p>

          {isInstalled || installedSuccess ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>యాప్ ఇప్పటికే మీ డివైస్‌లో విజయవంతంగా ఇన్‌స్టాల్ చేయబడింది!</span>
            </div>
          ) : isInstallable ? (
            <button
              id="direct-apk-install-btn"
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>ఇప్పుడే డివైస్‌లో ఇన్‌స్టాల్ చేయండి (Install WebAPK Now)</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-neutral-300">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Smartphone className="w-4 h-4" />
                <span>ఫోన్/టీవీ బ్రౌజర్ ద్వారా ఇన్‌స్టాల్ చేయండి:</span>
              </div>
              <div className="text-[11px] text-neutral-400 leading-relaxed">
                1. బ్రౌజర్ మెనూ (పైన కుడివైపు 3 చుక్కలు ⋮) నొక్కండి.<br />
                2. <strong>"Add to Home Screen"</strong> లేదా <strong>"Install App"</strong> ఎంచుకోండి.<br />
                3. హోమ్ స్క్రీన్ పై టీవీ యాప్ ఐకాన్ ప్రత్యక్షమై ఫుల్‌స్క్రీన్‌లో రన్ అవుతుంది.
              </div>
            </div>
          )}
        </div>

        {/* Option 2: PWABuilder Standalone .apk Package Generation */}
        <div className="mb-5 p-4 rounded-2xl bg-neutral-950/70 border border-white/10">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>పద్ధతి 2: స్వతంత్ర .apk ఫైల్ డౌన్‌లోడ్ (PWABuilder)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold">
              Standalone APK
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
            మీకు పెన్ డ్రైవ్ లేదా మెమరీ కార్డ్ ద్వారా టీవీలోకి ఎక్కించడానికి స్వతంత్ర <strong>.apk</strong> ఫైల్ కావాలంటే, అధికారిక PWABuilder ద్వారా కేవలం 1 నిమిషంలో .apk ప్యాకేజీ పొందవచ్చు.
          </p>

          <a
            href={pwabuilderUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="pwabuilder-generate-apk-link"
            className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-amber-400/50"
          >
            <span>PWABuilder లో .apk ఫైల్ జనరేట్ చేయండి</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        </div>

        {/* Option 3: App URL for Smart TV browser */}
        <div className="mb-5 p-3.5 rounded-2xl bg-neutral-950/70 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden w-full sm:w-auto">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
              <Tv className="w-4 h-4" />
            </div>
            <div className="truncate text-left">
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                స్మార్ట్ టీవీ కోసం లైవ్ వెబ్ లింక్ (App Live URL)
              </div>
              <div className="font-mono text-xs text-neutral-300 truncate max-w-xs">
                {currentAppUrl}
              </div>
            </div>
          </div>

          <button
            id="copy-apk-app-url-btn"
            onClick={handleCopyUrl}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 transition-all cursor-pointer shrink-0"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">లింక్ కాపీ అయింది</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>లింక్ కాపీ చేయండి</span>
              </>
            )}
          </button>
        </div>

        {/* Smart TV Installation Tips */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Smart TV సైడ్‌లోడ్ గైడ్:</strong> స్మార్ట్ టీవీ బ్రౌజర్‌లో ఈ లింక్ ఓపెన్ చేసి బుక్‌మార్క్/హోమ్‌స్క్రీన్‌కు పిన్ చేయవచ్చు లేదా పైన ఇచ్చిన PWABuilder APK ఫైల్‌ను పెన్‌డ్రైవ్ ద్వారా టీవీలో ఇన్‌స్టాల్ చేసుకోవచ్చు.
          </div>
        </div>
      </div>
    </div>
  );
};
