import React, { useState, useEffect, useRef } from 'react';
import { Tv, Upload, Image as ImageIcon, Sparkles, X, RotateCcw, Check, Heart, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface CornerLogoProps {
  channelName?: string;
  isMenuOpen?: boolean;
}

export const CornerLogo: React.FC<CornerLogoProps> = ({ isMenuOpen }) => {
  const [logoImage, setLogoImage] = useState<string>(() => {
    try {
      return localStorage.getItem('smart_tv_corner_logo_img') || '';
    } catch {
      return '';
    }
  });

  const [logoText, setLogoText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_corner_logo_text');
      if (saved && saved !== 'My Love' && saved !== 'Live TV' && saved !== 'తెలుగు TV') {
        return saved;
      }
      return 'JNN TV';
    } catch {
      return 'JNN TV';
    }
  });

  const [logoSub, setLogoSub] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_corner_logo_sub');
      if (saved && saved !== 'HD LIVE') return saved;
      return 'HD';
    } catch {
      return 'HD';
    }
  });

  // Corner position: 'bottom-right' (Right corner down) or 'top-right'
  const [position, setPosition] = useState<'bottom-right' | 'top-right'>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_corner_logo_pos');
      return (saved as 'bottom-right' | 'top-right') || 'bottom-right';
    } catch {
      return 'bottom-right';
    }
  });

  const [opacity, setOpacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_corner_logo_opacity');
      return saved ? parseInt(saved, 10) : 90;
    } catch {
      return 90;
    }
  });

  const [size, setSize] = useState<'sm' | 'md' | 'lg'>(() => {
    try {
      const saved = localStorage.getItem('smart_tv_corner_logo_size');
      return (saved as 'sm' | 'md' | 'lg') || 'md';
    } catch {
      return 'md';
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle image upload from file picker or drop
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setLogoImage(result);
        try {
          localStorage.setItem('smart_tv_corner_logo_img', result);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err) {
          console.error('Storage error', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setLogoImage('');
    setLogoText('JNN TV');
    setLogoSub('HD');
    setPosition('bottom-right');
    setOpacity(90);
    setSize('md');
    try {
      localStorage.removeItem('smart_tv_corner_logo_img');
      localStorage.setItem('smart_tv_corner_logo_text', 'JNN TV');
      localStorage.setItem('smart_tv_corner_logo_sub', 'HD');
      localStorage.removeItem('smart_tv_corner_logo_pos');
      localStorage.removeItem('smart_tv_corner_logo_opacity');
      localStorage.removeItem('smart_tv_corner_logo_size');
    } catch {}
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('smart_tv_corner_logo_text', logoText);
      localStorage.setItem('smart_tv_corner_logo_sub', logoSub);
      localStorage.setItem('smart_tv_corner_logo_pos', position);
      localStorage.setItem('smart_tv_corner_logo_opacity', opacity.toString());
      localStorage.setItem('smart_tv_corner_logo_size', size);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
      }, 800);
    } catch {}
  };

  const isLoveTheme = logoText.toLowerCase().includes('love');

  // Dimensions based on size preset
  const sizeClasses = {
    sm: {
      container: 'px-2.5 py-1.5 gap-2',
      img: 'max-h-7 max-w-[80px]',
      icon: 'w-4 h-4',
      title: 'text-xs',
      sub: 'text-[9px]',
    },
    md: {
      container: 'px-3.5 py-2 gap-2.5',
      img: 'max-h-9 max-w-[110px]',
      icon: 'w-5 h-5',
      title: 'text-sm font-black',
      sub: 'text-[10px] font-bold',
    },
    lg: {
      container: 'px-4 py-2.5 gap-3',
      img: 'max-h-12 max-w-[140px]',
      icon: 'w-6 h-6',
      title: 'text-base font-black',
      sub: 'text-xs font-bold',
    },
  }[size];

  // Position classes
  const positionClasses = position === 'bottom-right'
    ? 'bottom-5 right-5 sm:bottom-6 sm:right-6'
    : 'top-4 right-4 sm:top-6 sm:right-6';

  return (
    <>
      {/* Corner TV Watermark Logo Bug (Right side corner down) */}
      <div
        id="tv-right-corner-logo"
        className={`fixed ${positionClasses} z-30 transition-all duration-300 select-none group pointer-events-auto ${
          isMenuOpen ? 'opacity-30 hover:opacity-100' : ''
        }`}
        style={{ opacity: isMenuOpen ? 0.3 : opacity / 100 }}
      >
        <div
          onClick={() => setIsModalOpen(true)}
          title="Corner Logo (Click to change logo or position)"
          className={`relative flex items-center ${sizeClasses.container} rounded-2xl bg-neutral-950/80 hover:bg-neutral-900/95 backdrop-blur-md border border-white/15 hover:border-amber-400/40 shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer`}
        >
          {logoImage ? (
            /* User's custom uploaded logo image */
            <div className="flex items-center gap-2">
              <img
                src={logoImage}
                alt="My Custom Logo"
                className={`${sizeClasses.img} object-contain filter drop-shadow-md rounded`}
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            /* Emblem Logo Bug (No blinking red dots) */
            <div className="flex items-center gap-2.5">
              <div className={`relative flex items-center justify-center p-1.5 rounded-xl shadow-md ${
                isLoveTheme
                  ? 'bg-linear-to-br from-rose-500 to-pink-600'
                  : 'bg-linear-to-br from-red-600 to-amber-500'
              }`}>
                {isLoveTheme ? (
                  <Heart className={`${sizeClasses.icon} text-white fill-white stroke-[2]`} />
                ) : (
                  <Tv className={`${sizeClasses.icon} text-white stroke-[2.5]`} />
                )}
              </div>

              <div className="flex flex-col text-left leading-tight">
                <span className={`${sizeClasses.title} tracking-tight text-white font-extrabold drop-shadow`}>
                  {logoText}
                </span>
                <span className={`${sizeClasses.sub} tracking-widest text-amber-400 font-bold drop-shadow`}>
                  {logoSub}
                </span>
              </div>
            </div>
          )}

          {/* Subtle hover edit hint */}
          <div className={`absolute ${position === 'bottom-right' ? '-top-6' : '-bottom-6'} right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-amber-300 bg-neutral-900/90 px-2 py-0.5 rounded shadow border border-amber-500/30 whitespace-nowrap pointer-events-none`}>
            Edit
          </div>
        </div>
      </div>

      {/* Logo Customizer Modal */}
      {isModalOpen && (
        <div
          id="corner-logo-customizer-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-neutral-900 border border-white/20 p-6 shadow-2xl text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Corner Logo Settings</h3>
                  <p className="text-xs text-neutral-400">Right Corner Logo & Position</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Position Selector (Right Down vs Right Top) */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-300 mb-1.5 block">
                Screen Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('bottom-right')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    position === 'bottom-right'
                      ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow-lg'
                      : 'bg-neutral-800/80 border-white/10 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Bottom Right</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPosition('top-right')}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    position === 'top-right'
                      ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow-lg'
                      : 'bg-neutral-800/80 border-white/10 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Top Right</span>
                </button>
              </div>
            </div>

            {/* Current Logo Preview */}
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-semibold text-neutral-400 mb-2">Live Preview</span>
              <div className="p-3 rounded-2xl bg-neutral-900 border border-white/15 shadow-inner flex items-center justify-center min-h-[60px] min-w-[140px]">
                {logoImage ? (
                  <img
                    src={logoImage}
                    alt="Current Logo"
                    className="max-h-12 max-w-[160px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-xl shadow-md ${
                      isLoveTheme
                        ? 'bg-linear-to-br from-rose-500 to-pink-600'
                        : 'bg-linear-to-br from-red-600 to-amber-500'
                    }`}>
                      {isLoveTheme ? (
                        <Heart className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Tv className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-extrabold text-white">{logoText}</div>
                      <div className="text-[10px] font-bold text-amber-400 tracking-wider">
                        {logoSub}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-neutral-400">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setLogoText('JNN TV');
                  setLogoSub('HD');
                  setLogoImage('');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>JNN TV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLogoText('JNN News');
                  setLogoSub('LIVE HD');
                  setLogoImage('');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>JNN News</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLogoText('Live TV');
                  setLogoSub('HD');
                  setLogoImage('');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Live TV</span>
              </button>
            </div>

            {/* Drag & Drop / File Upload Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-white/20 bg-neutral-800/40 hover:border-amber-400/60 hover:bg-neutral-800/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-white block">
                  Upload your custom logo image
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  PNG, JPG, SVG or WebP file
                </span>
              </div>
            </div>

            {/* Text Customization (if not using image) */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 mb-1 block">Logo Title</label>
                  <input
                    type="text"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value)}
                    placeholder="e.g. JNN TV"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-800 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 mb-1 block">Badge / Subtitle</label>
                  <input
                    type="text"
                    value={logoSub}
                    onChange={(e) => setLogoSub(e.target.value)}
                    placeholder="e.g. HD LIVE"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-800 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Opacity and Size Presets */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-neutral-300 mb-1">
                    <span>Opacity</span>
                    <span className="text-amber-400 font-bold">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 mb-1 block text-right">Size</label>
                  <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl border border-white/10">
                    {(['sm', 'md', 'lg'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          size === s
                            ? 'bg-amber-500 text-neutral-950'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Reset to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
