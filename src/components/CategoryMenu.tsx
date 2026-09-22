import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Channel, CategoryId } from '../types';
import { CATEGORIES } from '../data/channels';
import { Tv, Film, Sparkles, Radio, Music2, Languages, X, CornerDownLeft } from 'lucide-react';
import { sfx } from '../utils/audio';

interface CategoryMenuProps {
  isOpen: boolean;
  currentChannel: Channel;
  channels: Channel[];
  favoriteChannelIds?: string[];
  focusedIndex: number;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite?: (channelId: string) => void;
  onClose: () => void;
  setFocusedIndex: (index: number) => void;
  // Optional backward-compatibility props
  activeCategoryId?: any;
  recentlyWatched?: Channel[];
  favoriteChannels?: Channel[];
  focusedSection?: any;
  onSelectCategory?: (categoryId: any) => void;
  onClearRecentlyWatched?: () => void;
  setFocusedSection?: (section: any) => void;
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({
  isOpen,
  currentChannel,
  channels,
  focusedIndex,
  onSelectChannel,
  onClose,
  setFocusedIndex,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>('all');
  const [focusedColumn, setFocusedColumn] = useState<'categories' | 'channels'>('categories');
  const [catIndex, setCatIndex] = useState<number>(0);
  const [chanIndex, setChanIndex] = useState<number>(0);

  const categoriesListRef = useRef<HTMLDivElement | null>(null);
  const channelListRef = useRef<HTMLDivElement | null>(null);

  // Filter channels according to the selected category
  const filteredChannels = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return channels;
    }
    return channels.filter(c => c.categoryId === selectedCategoryId);
  }, [channels, selectedCategoryId]);

  // Compute channel count for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: channels.length,
    };
    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = channels.filter(c => c.categoryId === cat.id).length;
      }
    });
    return counts;
  }, [channels]);

  // When opening, initialize active category to currentChannel's category if known
  useEffect(() => {
    if (isOpen) {
      if (currentChannel && currentChannel.categoryId) {
        const foundCatIdx = CATEGORIES.findIndex(c => c.id === currentChannel.categoryId);
        if (foundCatIdx >= 0) {
          setSelectedCategoryId(currentChannel.categoryId);
          setCatIndex(foundCatIdx);
        } else {
          setSelectedCategoryId('all');
          setCatIndex(0);
        }
      }
      setFocusedColumn('categories');
      setChanIndex(0);
    }
  }, [isOpen, currentChannel]);

  // Keep focused channel in view
  useEffect(() => {
    if (channelListRef.current && focusedColumn === 'channels') {
      const activeItem = channelListRef.current.children[chanIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [chanIndex, focusedColumn]);

  // Keep focused category in view
  useEffect(() => {
    if (categoriesListRef.current) {
      const activeCat = categoriesListRef.current.children[catIndex] as HTMLElement;
      if (activeCat) {
        activeCat.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [catIndex]);

  // Keyboard navigation inside Category & Channel Left Drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape or Backspace: Close menu
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        sfx.playBack();
        onClose();
        return;
      }

      // Left Arrow: Switch focus to categories column
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        sfx.playTick();
        setFocusedColumn('categories');
        return;
      }

      // Right Arrow: Switch focus to channels column
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        sfx.playTick();
        setFocusedColumn('channels');
        return;
      }

      // Up Arrow
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        sfx.playTick();
        if (focusedColumn === 'categories') {
          setCatIndex(prev => {
            const next = prev > 0 ? prev - 1 : CATEGORIES.length - 1;
            const newCat = CATEGORIES[next];
            if (newCat) {
              setSelectedCategoryId(newCat.id);
              setChanIndex(0);
            }
            return next;
          });
        } else {
          setChanIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, filteredChannels.length - 1)));
        }
        return;
      }

      // Down Arrow
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        sfx.playTick();
        if (focusedColumn === 'categories') {
          setCatIndex(prev => {
            const next = prev < CATEGORIES.length - 1 ? prev + 1 : 0;
            const newCat = CATEGORIES[next];
            if (newCat) {
              setSelectedCategoryId(newCat.id);
              setChanIndex(0);
            }
            return next;
          });
        } else {
          setChanIndex(prev => (prev < filteredChannels.length - 1 ? prev + 1 : 0));
        }
        return;
      }

      // Enter or OK
      if (e.key === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        if (focusedColumn === 'categories') {
          // Switch to channels column of this category
          sfx.playTick();
          setFocusedColumn('channels');
        } else {
          const selectedCh = filteredChannels[chanIndex];
          if (selectedCh) {
            sfx.playChannelSwitch();
            onSelectChannel(selectedCh);
            onClose();
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, focusedColumn, catIndex, chanIndex, filteredChannels, onSelectChannel, onClose]);

  if (!isOpen) return null;

  // Icon renderer matching the uploaded design
  const renderCategoryIcon = (id: CategoryId, isSelected: boolean) => {
    const iconClass = `w-5 h-5 shrink-0 ${isSelected ? 'text-amber-300' : ''}`;
    switch (id) {
      case 'all':
        return <Tv className={`${iconClass} ${!isSelected ? 'text-cyan-400' : ''}`} />;
      case 'telugu':
        return <Tv className={`${iconClass} ${!isSelected ? 'text-amber-400' : ''}`} />;
      case 'hindi':
        return <Languages className={`${iconClass} ${!isSelected ? 'text-rose-400' : ''}`} />;
      case 'kannada':
        return <Radio className={`${iconClass} ${!isSelected ? 'text-yellow-400' : ''}`} />;
      case 'entertainment':
        return <Film className={`${iconClass} ${!isSelected ? 'text-pink-400' : ''}`} />;
      case 'kids':
        return <Sparkles className={`${iconClass} ${!isSelected ? 'text-amber-300' : ''}`} />;
      case 'news':
        return <Radio className={`${iconClass} ${!isSelected ? 'text-red-400' : ''}`} />;
      case 'music':
        return <Music2 className={`${iconClass} ${!isSelected ? 'text-emerald-400' : ''}`} />;
      default:
        return <Tv className={`${iconClass} ${!isSelected ? 'text-cyan-400' : ''}`} />;
    }
  };

  return (
    <>
      {/* 1. Backdrop (Subtle dark overlay over video player, click anywhere to dismiss) */}
      <div 
        id="jnn-tv-menu-backdrop"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1.5px] transition-opacity duration-200 cursor-pointer"
        onClick={() => {
          sfx.playBack();
          onClose();
        }}
        title="Click to Close Menu"
      />

      {/* 2. COMPACT LEFT SIDEBAR DRAWER (Requested: Left side small, NOT fullscreen) */}
      <div 
        id="jnn-tv-guide-modal"
        className="fixed left-0 top-0 bottom-0 z-50 w-[460px] max-w-[92vw] sm:w-[480px] md:w-[500px] bg-[#050b1b]/98 border-r border-[#1e3a8a]/60 shadow-[10px_0_50px_rgba(0,0,0,0.85)] flex flex-col text-white select-none overflow-hidden animate-in slide-in-from-left duration-200"
      >
        {/* Top Header */}
        <header className="px-4 py-3 bg-gradient-to-r from-[#08122c] via-[#091535] to-[#070e24] border-b border-[#1e3a8a]/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 border border-amber-400/50 px-2.5 py-1 rounded-lg shadow-md shadow-red-950/40">
              <span className="text-xs font-black tracking-wider text-white flex items-center gap-1">
                <span className="text-amber-300">JNN</span>
                <span>TV</span>
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-neutral-200">
              Channel Guide
            </span>
          </div>

          <button
            id="close-jnn-guide-menu-btn"
            onClick={() => {
              sfx.playBack();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/30 border border-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Dual-Column Body: [Categories Column] | [Channels List Column] */}
        <div className="flex-1 flex overflow-hidden bg-[#050b1b]">
          
          {/* =========================================================================
              COLUMN 1: CATEGORIES (Designed exactly as in user photo)
             ========================================================================= */}
          <aside 
            id="jnn-categories-sidebar"
            className="w-[190px] sm:w-[210px] bg-[#060e22] border-r border-[#162758]/60 flex flex-col shrink-0 overflow-hidden"
          >
            <div className="px-3 py-2 bg-[#091433] border-b border-[#162758]/50 text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Categories</span>
              {focusedColumn === 'categories' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </div>

            <div 
              ref={categoriesListRef}
              className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-2 scrollbar-none"
            >
              {CATEGORIES.map((cat, cIdx) => {
                const isSelected = selectedCategoryId === cat.id;
                const isCatFocused = focusedColumn === 'categories' && catIndex === cIdx;
                const count = categoryCounts[cat.id] ?? 0;

                return (
                  <button
                    key={cat.id}
                    id={`category-pill-${cat.id}`}
                    onClick={() => {
                      sfx.playTick();
                      setSelectedCategoryId(cat.id);
                      setCatIndex(cIdx);
                      setFocusedColumn('channels');
                      setChanIndex(0);
                    }}
                    onMouseEnter={() => {
                      setCatIndex(cIdx);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#e91e63] to-[#c2185b] text-white shadow-lg shadow-pink-600/30 ring-2 ring-pink-400/50 scale-[1.01]'
                        : 'bg-[#0a1636]/90 hover:bg-[#0f214d] text-[#cdd7e8] border border-[#162758]/60 hover:border-blue-500/40'
                    } ${
                      isCatFocused && !isSelected ? 'ring-2 ring-cyan-400 border-transparent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderCategoryIcon(cat.id, isSelected)}
                      <span className={`truncate text-xs sm:text-[13px] leading-tight ${isSelected ? 'font-bold text-white' : 'font-semibold text-neutral-200'}`}>
                        {cat.nameEnglish}
                      </span>
                    </div>

                    {/* Count Badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-mono shrink-0 ${
                      isSelected 
                        ? 'bg-[#880e4f]/90 text-white font-bold' 
                        : 'bg-[#040a1c] text-neutral-400 border border-white/5'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* =========================================================================
              COLUMN 2: CHANNELS LIST (ONLY CHANNEL NUMBER & CHANNEL NAME)
             ========================================================================= */}
          <main 
            id="jnn-tv-channels-column"
            className="flex-1 flex flex-col min-w-0 bg-[#050b1b] overflow-hidden"
          >
            {/* List Header */}
            <div className="px-3 py-2 bg-[#08122c] border-b border-[#162758]/50 flex items-center justify-between text-[11px] text-neutral-300 shrink-0">
              <span className="font-bold flex items-center gap-1.5 truncate">
                <span className="text-white truncate">
                  {CATEGORIES.find(c => c.id === selectedCategoryId)?.nameEnglish || 'Channels'}
                </span>
                <span className="text-cyan-400 font-mono">({filteredChannels.length})</span>
              </span>

              {focusedColumn === 'channels' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </div>

            {/* Channels Scroll Area */}
            <div 
              ref={channelListRef}
              id="jnn-tv-channels-scroll-area"
              className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-blue-800/40"
            >
              {filteredChannels.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-neutral-400">
                  <Tv className="w-8 h-8 text-neutral-600 mb-2" />
                  <p className="text-xs font-semibold text-neutral-400">No channels in this category</p>
                </div>
              ) : (
                filteredChannels.map((channel, idx) => {
                  const isCurrent = currentChannel.id === channel.id;
                  const isHighlighted = focusedColumn === 'channels' && chanIndex === idx;

                  return (
                    <div
                      key={channel.id}
                      id={`jnn-channel-row-${channel.id}`}
                      onClick={() => {
                        sfx.playChannelSwitch();
                        onSelectChannel(channel);
                        onClose();
                      }}
                      onMouseEnter={() => {
                        setChanIndex(idx);
                        setFocusedColumn('channels');
                      }}
                      className={`px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer flex items-center gap-3 ${
                        isCurrent 
                          ? 'bg-blue-900/40 border-cyan-400/80 shadow-md shadow-cyan-500/10' 
                          : 'bg-[#0a1638]/70 hover:bg-[#0f2258]/80 border-[#1e3a8a]/30'
                      } ${
                        isHighlighted 
                          ? 'ring-2 ring-cyan-400 bg-gradient-to-r from-blue-900/90 via-[#0e2563] to-blue-900/90 text-white border-transparent shadow-md shadow-cyan-500/25 scale-[1.01]' 
                          : ''
                      }`}
                    >
                      {/* Channel Number */}
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-black shrink-0 ${
                        isHighlighted 
                          ? 'bg-cyan-400 text-neutral-950 shadow-sm' 
                          : 'bg-[#060c1e] text-cyan-300 border border-[#1e3a8a]/60'
                      }`}>
                        {channel.number}
                      </span>

                      {/* Channel Name */}
                      <span className="text-xs sm:text-sm font-bold text-white truncate leading-tight flex-1">
                        {channel.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>

        {/* Bottom Shortcuts Bar */}
        <footer className="px-3 py-2 bg-gradient-to-r from-[#070e24] via-[#091535] to-[#070e24] border-t border-[#1e3a8a]/50 text-[10px] sm:text-[11px] text-neutral-300 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">◄ / ►</kbd>
                <span className="hidden sm:inline">Pane</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">▲ / ▼</kbd>
                <span className="hidden sm:inline">Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-cyan-400 text-neutral-950 font-black font-mono text-[9px]">OK</kbd>
                <span>Watch</span>
              </span>
            </div>

            <button
              onClick={() => {
                sfx.playBack();
                onClose();
              }}
              className="flex items-center gap-1 text-neutral-400 hover:text-white cursor-pointer"
            >
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[9px]">ESC</kbd>
              <CornerDownLeft className="w-2.5 h-2.5" />
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};
