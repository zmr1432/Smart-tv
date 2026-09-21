import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CategoryId, Channel, MenuSection } from '../types';
import { CATEGORIES } from '../data/channels';
import { 
  Tv, Film, Sparkles, Radio, Music2, Heart, History, Clock, 
  Play, X, ChevronRight, Satellite, Info, Trash2, CornerDownLeft,
  CheckCircle2, Star, ShieldCheck
} from 'lucide-react';
import { sfx } from '../utils/audio';

type TataSkyGenre = 'all' | CategoryId | 'favorites' | 'recent';

interface CategoryMenuProps {
  isOpen: boolean;
  activeCategoryId: CategoryId;
  currentChannel: Channel;
  channels: Channel[];
  recentlyWatched: Channel[];
  favoriteChannels: Channel[];
  favoriteChannelIds: string[];
  focusedIndex: number;
  focusedSection: MenuSection;
  onSelectCategory: (categoryId: CategoryId) => void;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onClearRecentlyWatched?: () => void;
  onClose: () => void;
  setFocusedIndex: (index: number) => void;
  setFocusedSection: (section: MenuSection) => void;
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({
  isOpen,
  activeCategoryId,
  currentChannel,
  channels,
  recentlyWatched,
  favoriteChannels,
  favoriteChannelIds,
  focusedIndex,
  focusedSection,
  onSelectCategory,
  onSelectChannel,
  onToggleFavorite,
  onClearRecentlyWatched,
  onClose,
  setFocusedIndex,
  setFocusedSection,
}) => {
  // Tata Sky Genre selection: 'all' | 'entertainment' | 'kids' | 'news' | 'music' | 'favorites' | 'recent'
  const [selectedGenre, setSelectedGenre] = useState<TataSkyGenre>(activeCategoryId);
  const [hoveredChannel, setHoveredChannel] = useState<Channel | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const channelListRef = useRef<HTMLDivElement | null>(null);

  // Sync selectedGenre when activeCategoryId changes from external trigger
  useEffect(() => {
    if (focusedSection === 'favorites') {
      setSelectedGenre('favorites');
    } else if (focusedSection === 'recent') {
      setSelectedGenre('recent');
    } else {
      setSelectedGenre(activeCategoryId);
    }
  }, [activeCategoryId, focusedSection]);

  // Live Clock & Date update in English format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute channels displayed based on Tata Sky genre
  const displayedChannels = useMemo(() => {
    if (selectedGenre === 'all') {
      return channels;
    }
    if (selectedGenre === 'favorites') {
      return favoriteChannels.length > 0 ? favoriteChannels : channels.filter(ch => favoriteChannelIds.includes(ch.id));
    }
    if (selectedGenre === 'recent') {
      return recentlyWatched.length > 0 ? recentlyWatched : [];
    }
    return channels.filter(ch => ch.categoryId === selectedGenre);
  }, [selectedGenre, channels, favoriteChannels, favoriteChannelIds, recentlyWatched]);

  // Effective preview channel (hovered, or focused, or currently playing)
  const previewChannel = useMemo(() => {
    if (hoveredChannel) return hoveredChannel;
    if (displayedChannels.length > 0) {
      const idx = Math.min(Math.max(0, focusedIndex), displayedChannels.length - 1);
      return displayedChannels[idx] || currentChannel;
    }
    return currentChannel;
  }, [hoveredChannel, displayedChannels, focusedIndex, currentChannel]);

  // Keep focused channel in view
  useEffect(() => {
    if (focusedSection === 'channels' && channelListRef.current) {
      const activeCard = channelListRef.current.children[focusedIndex] as HTMLElement;
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex, focusedSection, selectedGenre]);

  if (!isOpen) return null;

  const handleGenreClick = (genre: TataSkyGenre) => {
    sfx.playTick();
    setSelectedGenre(genre);
    if (genre === 'favorites') {
      setFocusedSection('favorites');
      setFocusedIndex(0);
    } else if (genre === 'recent') {
      setFocusedSection('recent');
      setFocusedIndex(0);
    } else if (genre === 'all') {
      setFocusedSection('channels');
      setFocusedIndex(0);
    } else {
      onSelectCategory(genre);
      setFocusedSection('channels');
      setFocusedIndex(0);
    }
  };

  const getGenreIcon = (genre: TataSkyGenre) => {
    switch (genre) {
      case 'all': return <Tv className="w-4 h-4 text-cyan-400" />;
      case 'entertainment': return <Film className="w-4 h-4 text-pink-400" />;
      case 'kids': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'news': return <Radio className="w-4 h-4 text-red-400" />;
      case 'music': return <Music2 className="w-4 h-4 text-emerald-400" />;
      case 'favorites': return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'recent': return <History className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <>
      {/* 1. Backdrop */}
      <div 
        id="tata-sky-menu-backdrop"
        className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={() => {
          sfx.playBack();
          onClose();
        }}
        title="Click to Exit Guide"
      />

      {/* 2. Main Tata Sky / Tata Play TV Guide Panel */}
      <div 
        id="tata-sky-guide-modal"
        className="fixed inset-2 sm:inset-4 md:inset-6 lg:inset-8 z-50 rounded-2xl sm:rounded-3xl bg-[#060c1e]/98 border border-[#1e3a8a]/60 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col text-white select-none overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* =========================================================================
            A. TOP TATA SKY HEADER BAR (Logo, DTH Signal, Clock, Current Channel)
           ========================================================================= */}
        <header className="px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-[#0a1638] via-[#08122c] to-[#070e24] border-b border-[#1e3a8a]/50 flex items-center justify-between shrink-0">
          {/* Left: Tata Play / Tata Sky Brand Logo & EPG Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Iconic Tata Play Pill Logo */}
            <div className="flex items-center bg-[#0d1c47] border border-cyan-500/30 px-3 py-1.5 rounded-xl shadow-inner shadow-cyan-500/10">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>tata</span>
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse" />
                <span className="text-pink-400 font-black">play</span>
              </span>
            </div>

            <div className="hidden sm:block h-6 w-px bg-blue-900/60" />

            {/* TV Guide Tag & Current Playing Info */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[11px] sm:text-xs border border-cyan-500/40 uppercase tracking-wider">
                TV GUIDE • EPG
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-neutral-300">
                <span className="text-neutral-400 font-medium">Now Playing:</span>
                <span className="font-bold text-white bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                  CH {currentChannel.number} • {currentChannel.name}
                </span>
              </span>
            </div>
          </div>

          {/* Right: Live Clock & Close Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Clock & Date */}
            <div className="text-right">
              <div className="text-sm sm:text-base font-black font-mono text-cyan-300 leading-tight">
                {currentTime}
              </div>
              <div className="text-[10px] sm:text-[11px] text-neutral-400 font-medium uppercase">
                {currentDate}
              </div>
            </div>

            {/* Close Button */}
            <button
              id="close-tata-sky-menu-btn"
              onClick={() => {
                sfx.playBack();
                onClose();
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/30 border border-white/15 hover:border-rose-400 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95 ml-1"
              title="Close Guide (Esc / Exit)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            B. MAIN TATA SKY 3-COLUMN LAYOUT:
            [Col 1: Genres / Categories] | [Col 2: Channel Grid List] | [Col 3: Program Info & Mini TV]
           ========================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#060c1e]">
          
          {/* -------------------------------------------------------------
              COLUMN 1: TATA SKY GENRES / CATEGORIES
             ------------------------------------------------------------- */}
          <nav 
            id="tata-sky-genres-column"
            className="w-full md:w-56 lg:w-64 bg-[#08122a] border-b md:border-b-0 md:border-r border-[#1e3a8a]/40 p-2 sm:p-3 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto scrollbar-none"
          >
            <div className="hidden md:flex items-center justify-between px-3 py-1.5 mb-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400/90 border-b border-[#1e3a8a]/30">
              <span>GENRES</span>
              <span>[◄ / ►]</span>
            </div>

            {/* Genre Item: ALL CHANNELS */}
            <button
              id="tata-genre-all"
              onClick={() => handleGenreClick('all')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:w-full group ${
                selectedGenre === 'all'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-[#0a1638]/60 hover:bg-[#0f2154] border-[#1e3a8a]/30 text-neutral-300'
              }`}
            >
              <div className="p-1 rounded-lg bg-black/20">{getGenreIcon('all')}</div>
              <span className="text-xs sm:text-sm font-semibold truncate flex-1">All Channels</span>
              <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono opacity-80">
                {channels.length}
              </span>
            </button>

            {/* Genre Item: ENTERTAINMENT, KIDS, NEWS, MUSIC */}
            {CATEGORIES.map((cat) => {
              const isSelected = selectedGenre === cat.id;
              const count = channels.filter(ch => ch.categoryId === cat.id).length;

              return (
                <button
                  key={cat.id}
                  id={`tata-genre-${cat.id}`}
                  onClick={() => handleGenreClick(cat.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:w-full group ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-400 text-white font-bold shadow-lg shadow-pink-500/20'
                      : 'bg-[#0a1638]/60 hover:bg-[#0f2154] border-[#1e3a8a]/30 text-neutral-300'
                  }`}
                >
                  <div className="p-1 rounded-lg bg-black/20">{getGenreIcon(cat.id)}</div>
                  <span className="text-xs sm:text-sm font-semibold truncate flex-1">{cat.nameEnglish}</span>
                  <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono opacity-80">
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Genre Item: FAVORITES */}
            <button
              id="tata-genre-favorites"
              onClick={() => handleGenreClick('favorites')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:w-full group ${
                selectedGenre === 'favorites'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 border-rose-400 text-white font-bold shadow-lg shadow-rose-500/20'
                  : 'bg-[#0a1638]/60 hover:bg-[#0f2154] border-[#1e3a8a]/30 text-neutral-300'
              }`}
            >
              <div className="p-1 rounded-lg bg-black/20">{getGenreIcon('favorites')}</div>
              <span className="text-xs sm:text-sm font-semibold truncate flex-1">Favorites</span>
              <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono opacity-80">
                {favoriteChannels.length}
              </span>
            </button>

            {/* Genre Item: RECENTLY WATCHED */}
            <button
              id="tata-genre-recent"
              onClick={() => handleGenreClick('recent')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer shrink-0 md:w-full group ${
                selectedGenre === 'recent'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 border-sky-400 text-white font-bold shadow-lg shadow-sky-500/20'
                  : 'bg-[#0a1638]/60 hover:bg-[#0f2154] border-[#1e3a8a]/30 text-neutral-300'
              }`}
            >
              <div className="p-1 rounded-lg bg-black/20">{getGenreIcon('recent')}</div>
              <span className="text-xs sm:text-sm font-semibold truncate flex-1">Recently Watched</span>
              <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono opacity-80">
                {recentlyWatched.length}
              </span>
            </button>

            {/* Clear History button if recent is selected */}
            {selectedGenre === 'recent' && recentlyWatched.length > 0 && onClearRecentlyWatched && (
              <button
                id="clear-tata-history-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playBack();
                  onClearRecentlyWatched();
                }}
                className="mt-2 text-[11px] text-neutral-400 hover:text-red-400 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </nav>

          {/* -------------------------------------------------------------
              COLUMN 2: TATA SKY CHANNEL LIST
             ------------------------------------------------------------- */}
          <main 
            id="tata-sky-channels-column"
            className="flex-1 flex flex-col min-w-0 bg-[#060c1e] border-b md:border-b-0 md:border-r border-[#1e3a8a]/40 overflow-hidden"
          >
            {/* List Sub-header */}
            <div className="px-4 py-2.5 bg-[#091535] border-b border-[#1e3a8a]/30 flex items-center justify-between text-xs text-neutral-300 shrink-0">
              <span className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-white uppercase tracking-wider">
                  {selectedGenre === 'all' && 'All Channels'}
                  {selectedGenre === 'entertainment' && 'Entertainment Channels'}
                  {selectedGenre === 'kids' && 'Kids Channels'}
                  {selectedGenre === 'news' && 'News Channels'}
                  {selectedGenre === 'music' && 'Music Channels'}
                  {selectedGenre === 'favorites' && 'Favorite Channels'}
                  {selectedGenre === 'recent' && 'Recently Watched Channels'}
                </span>
                <span className="text-cyan-400 font-mono">({displayedChannels.length})</span>
              </span>

              <span className="text-[11px] text-neutral-400 hidden sm:inline-block font-mono">
                [▲ / ▼] Browse Channels
              </span>
            </div>

            {/* Channels Scroll Area */}
            <div 
              ref={channelListRef}
              id="tata-sky-channels-scroll-area"
              className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-blue-800/40"
            >
              {displayedChannels.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center mb-3 text-neutral-500">
                    <Tv className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-300">No channels in this category</p>
                  <p className="text-xs text-neutral-500 mt-1">Select another genre or add favorites to view.</p>
                </div>
              ) : (
                displayedChannels.map((channel, idx) => {
                  const isCurrent = currentChannel.id === channel.id;
                  const isFocused = focusedSection === 'channels' && focusedIndex === idx;
                  const isHovered = hoveredChannel?.id === channel.id;
                  const isFav = favoriteChannelIds.includes(channel.id);
                  const isHighlighted = isFocused || (isHovered && !isFocused);

                  return (
                    <div
                      key={channel.id}
                      id={`tata-channel-row-${channel.id}`}
                      onClick={() => {
                        sfx.playChannelSwitch();
                        onSelectChannel(channel);
                        onClose();
                      }}
                      onMouseEnter={() => {
                        setHoveredChannel(channel);
                        setFocusedSection('channels');
                        setFocusedIndex(idx);
                      }}
                      className={`group relative px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-blue-900/40 border-cyan-400/80 shadow-md shadow-cyan-500/10' 
                          : 'bg-[#0a1638]/70 hover:bg-[#0f2258]/80 border-[#1e3a8a]/30'
                      } ${
                        isHighlighted 
                          ? 'ring-2 ring-cyan-400 bg-gradient-to-r from-blue-900/90 to-[#0e2563] text-white border-transparent shadow-lg shadow-cyan-500/25 scale-[1.01] z-10' 
                          : ''
                      }`}
                    >
                      {/* Left: Channel Number, Logo & Names */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Tata Sky Cursor indicator */}
                        <div className={`w-3 flex items-center justify-center shrink-0 ${isHighlighted ? 'text-cyan-400 font-black' : 'text-transparent'}`}>
                          ►
                        </div>

                        {/* 3-Digit Channel Number Badge */}
                        <span className={`px-2 py-1 rounded-md text-xs font-mono font-black shrink-0 ${
                          isHighlighted 
                            ? 'bg-cyan-400 text-neutral-950 shadow-sm' 
                            : 'bg-[#060c1e] text-cyan-300 border border-[#1e3a8a]/60'
                        }`}>
                          {channel.number}
                        </span>

                        {/* Channel Logo / Icon */}
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-neutral-950 border border-white/10 flex items-center justify-center shadow-sm">
                          <img 
                            src={channel.poster} 
                            alt={channel.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>

                        {/* Channel Name */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                              {channel.name}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/40">
                                PLAYING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Resolution badge, Favorite toggle, Play prompt */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
                          {channel.resolution}
                        </span>

                        {/* Favorite button */}
                        <button
                          type="button"
                          id={`tata-fav-${channel.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            sfx.playTick();
                            onToggleFavorite(channel.id);
                          }}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isFav 
                              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' 
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-rose-400 hover:bg-white/10'
                          }`}
                          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        <div className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-400 text-cyan-400 group-hover:text-neutral-950 transition-all">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>

          {/* -------------------------------------------------------------
              COLUMN 3: TATA SKY DETAILS & MINI LIVE TV
             ------------------------------------------------------------- */}
          <aside 
            id="tata-sky-program-info-column"
            className="w-full md:w-80 lg:w-96 bg-[#070f26] p-4 flex flex-col justify-between overflow-y-auto shrink-0 border-t md:border-t-0 border-[#1e3a8a]/40"
          >
            <div className="space-y-3.5">
              {/* Mini PIP TV Window / Live Preview Box */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/30 shadow-xl group">
                <img 
                  src={previewChannel.poster} 
                  alt={previewChannel.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Live Overlays */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/90 text-white font-black text-[10px] tracking-wider uppercase shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>LIVE</span>
                </div>

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-cyan-300 font-mono text-[10px] font-bold border border-white/10">
                  {previewChannel.resolution}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    CH {previewChannel.number}
                  </span>
                  <span className="text-[11px] font-bold text-white truncate max-w-[180px]">
                    {previewChannel.name}
                  </span>
                </div>
              </div>

              {/* Channel Header & Info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-blue-900/60 border border-blue-500/30 text-[10px] font-bold text-cyan-300 uppercase">
                    LIVE CHANNEL
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {previewChannel.resolution}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {previewChannel.name}
                </h3>
                <div className="text-xs text-neutral-300 font-medium mt-0.5">
                  Channel {previewChannel.number}
                </div>
              </div>

              {/* Channel Category Tag */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-900/50 border border-blue-500/30 text-xs font-bold text-cyan-300">
                  {CATEGORIES.find(c => c.id === previewChannel.categoryId)?.nameEnglish || 'Channel'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-neutral-300 font-mono">
                  {previewChannel.resolution}
                </span>
              </div>

              {/* Channel Description */}
              <div className="text-xs text-neutral-300 leading-relaxed bg-[#0a1638]/40 p-3 rounded-xl border border-white/5">
                <p>Popular television network {previewChannel.name}. Continuous 24/7 entertainment and high-definition broadcast stream.</p>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400">
                  <span>Language: <b>English / Regional</b></span>
                  <span>Audio: <b>Dolby 5.1</b></span>
                </div>
              </div>
            </div>

            {/* Tune Button */}
            <div className="mt-3 pt-3 border-t border-[#1e3a8a]/40">
              <button
                id="tata-sky-tune-now-btn"
                onClick={() => {
                  sfx.playChannelSwitch();
                  onSelectChannel(previewChannel);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Channel (CH {previewChannel.number})</span>
              </button>
            </div>
          </aside>
        </div>

        {/* =========================================================================
            C. BOTTOM TATA SKY REMOTE COLOR KEYS BAR (Red, Green, Yellow, Blue)
           ========================================================================= */}
        <footer className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#070e24] via-[#091535] to-[#070e24] border-t border-[#1e3a8a]/50 text-xs text-neutral-200 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Tata Sky 4 Color Buttons Legend */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {/* Red Key: All Channels */}
              <button 
                onClick={() => handleGenreClick('all')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer transition-colors active:scale-95"
                title="View All Channels (Red Key)"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-red-400 shadow-sm shadow-red-500/50 flex items-center justify-center text-[9px] font-black text-white">
                  R
                </span>
                <span className="font-semibold text-neutral-200">All Channels</span>
              </button>

              {/* Green Key: Favorites */}
              <button 
                onClick={() => handleGenreClick('favorites')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer transition-colors active:scale-95"
                title="Favorite Channels (Green Key)"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-300 shadow-sm shadow-emerald-500/50 flex items-center justify-center text-[9px] font-black text-white">
                  G
                </span>
                <span className="font-semibold text-neutral-200">Favorites</span>
              </button>

              {/* Yellow Key: Recent */}
              <button 
                onClick={() => handleGenreClick('recent')}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer transition-colors active:scale-95"
                title="Recently Watched (Yellow Key)"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-200 shadow-sm shadow-amber-400/50 flex items-center justify-center text-[9px] font-black text-neutral-950">
                  Y
                </span>
                <span className="font-semibold text-neutral-200">Recent</span>
              </button>

              {/* Blue Key: Toggle Favorite */}
              <button 
                onClick={() => {
                  sfx.playTick();
                  onToggleFavorite(previewChannel.id);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer transition-colors active:scale-95"
                title="Toggle Favorite for highlighted channel (Blue Key)"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-blue-300 shadow-sm shadow-blue-500/50 flex items-center justify-center text-[9px] font-black text-white">
                  B
                </span>
                <span className="font-semibold text-neutral-200">Toggle Fav</span>
              </button>
            </div>

            {/* OK & Exit Navigation Shortcuts */}
            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1 text-white">
                <kbd className="px-1.5 py-0.5 rounded bg-cyan-400 text-neutral-950 font-black font-mono text-[10px]">OK</kbd>
                <span>Tune</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">▲ / ▼</kbd>
                <span>Navigate</span>
              </span>
              <button
                onClick={() => {
                  sfx.playBack();
                  onClose();
                }}
                className="flex items-center gap-1 text-neutral-300 hover:text-white cursor-pointer"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">ESC</kbd>
                <span>Exit</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
