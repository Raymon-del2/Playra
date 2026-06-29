'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocation } from '@/hooks/useLocation';
import ProfileMenu from './ProfileMenu';
import NotificationsPopup from './NotificationsPopup';
import CreateMenu from './CreateMenu';

type NavbarProps = {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isSignedIn?: boolean;
  onToggleSignIn?: () => void;
  onToggleSearchOverlay?: () => void;
  activeProfile?: any;
  isLoading?: boolean;
};

export default function Navbar({
  isSidebarCollapsed,
  onToggleSidebar,
  isSignedIn = false,
  onToggleSignIn,
  onToggleSearchOverlay,
  activeProfile,
  isLoading = false
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const countryCode = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ videos: any[]; profiles: any[] }>({ videos: [], profiles: [] });
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchCacheRef = useRef<Map<string, { videos: any[]; profiles: any[]; timestamp: number }>>(new Map());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [headerLoadStage, setHeaderLoadStage] = useState(0);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Check if current page should show searchbar (home, styles, watch, or results pages)
  const shouldShowSearchbar = pathname === '/' || pathname?.startsWith('/styles') || pathname?.startsWith('/watch') || pathname?.startsWith('/results');

  // Header loading sequence
  useEffect(() => {
    if (isLoading) {
      setHeaderLoadStage(0);
      // Stage 1: Region indicator (immediate)
      setHeaderLoadStage(1);
      
      // Stage 2: Logo (after 100ms)
      const logoTimer = setTimeout(() => setHeaderLoadStage(2), 100);
      
      // Stage 3: Search bar and remaining elements (after 200ms)
      const searchTimer = setTimeout(() => setHeaderLoadStage(3), 200);
      
      return () => {
        clearTimeout(logoTimer);
        clearTimeout(searchTimer);
      };
    } else {
      setHeaderLoadStage(3);
    }
  }, [isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Fetch user country
    fetch('https://api.country.is/')
      .then(res => res.json())
      .then(data => {
        if (data.country) {
          setUserCountry(data.country.toUpperCase());
        }
      })
      .catch(() => {
        // Silently fail - badge will remain hidden
      });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (query = searchQuery) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearching(true);
    router.push(`/results?search_query=${encodeURIComponent(trimmed)}`);
    setIsDropdownOpen(false);
    setIsSearchExpanded(false);
    setTimeout(() => setIsSearching(false), 500);
  };

  const fetchSuggestions = async (query: string) => {
    const cached = searchCacheRef.current.get(query);
    // Only serve from cache when we have actual results (not empty), and within 15s
    if (cached && (cached.videos.length > 0 || cached.profiles.length > 0) && Date.now() - cached.timestamp < 15000) {
      setSuggestions(cached);
      return;
    }

    setIsLoadingSuggest(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&dropdown=true&limit=6`);
      const json = await res.json();
      const next = { videos: json.videos || [], profiles: json.profiles || [] };
      setSuggestions(next);
      // Only cache when we got something back
      if (next.videos.length > 0 || next.profiles.length > 0) {
        searchCacheRef.current.set(query, { ...next, timestamp: Date.now() });
      } else {
        // For empty results, cache for only 2s so quick retries can recover
        searchCacheRef.current.set(query, { ...next, timestamp: Date.now() - 13000 });
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions({ videos: [], profiles: [] });
    } finally {
      setIsLoadingSuggest(false);
    }
  };

  const fetchInitialSuggestions = async () => {
    setIsLoadingSuggest(true);
    try {
      const res = await fetch(`/api/search?dropdown=true&limit=6`);
      const json = await res.json();
      setSuggestions({ videos: json.videos || [], profiles: json.profiles || [] });
      searchCacheRef.current.set('initial', { videos: json.videos || [], profiles: json.profiles || [], timestamp: Date.now() });
    } catch (error) {
      console.error('Error fetching initial suggestions:', error);
      setSuggestions({ videos: [], profiles: [] });
    } finally {
      setIsLoadingSuggest(false);
    }
  };

  // Load initial suggestions on mount
  useEffect(() => {
    if (shouldShowSearchbar) {
      fetchInitialSuggestions();
    }
  }, [shouldShowSearchbar]);

  // Close the dropdown whenever the search input is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsDropdownOpen(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.length >= 1 && isDropdownOpen) {
      // Fire immediately for snappy feel, but keep a tiny debounce to coalesce keystrokes
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 80);
    }
    // Don't clear suggestions when query is empty - keep initial suggestions

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, isDropdownOpen]);

  // Highlight matching substring within text by wrapping in <span>
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return (
      <>
        {before}
        <span className="font-bold text-zinc-900">{match}</span>
        {after}
      </>
    );
  };

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <>
      <nav suppressHydrationWarning className={`fixed top-0 left-0 right-0 h-14 z-[100] flex items-center transition-all duration-300 ${
        isScrolled 
          ? 'bg-transparent' 
          : 'bg-transparent'
      }`}>
        {isSearching && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-pulse" />
        )}
        <div suppressHydrationWarning className="w-full px-4">
          <div suppressHydrationWarning className="flex items-center justify-between h-14 gap-2 relative">
            
            {/* Left: Logo & Sidebar Toggle */}
            <div className={`flex items-center gap-2 transition-all duration-300 ${isSearchExpanded ? 'hidden md:flex' : 'flex'}`}>
              {/* Desktop hamburger menu only */}
              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 rounded-full text-zinc-900 transition-all active:scale-90 hover:bg-[#e5e5e5] active:bg-[rgba(0,0,0,0.2)]"
                style={{
                  transition: 'background-color 0.2s ease',
                  pointerEvents: isLoading ? 'none' : 'auto',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>

              {!isLoading && (
                <Link href="/" className="flex items-center gap-0 flex-shrink-0 group relative" title="Playra home" style={{ opacity: headerLoadStage >= 2 ? 1 : 0, transition: 'opacity 0.2s ease' }}>
                  <div suppressHydrationWarning className="flex items-center gap-0 relative">
                    <img src="/playra.svg" alt="Playra" className="h-[28px] w-auto" />
                    <span className="font-[family-name:var(--font-youtube-sans)] font-bold text-zinc-900 text-2xl tracking-wide ml-0 relative">
                      RA
                      {userCountry && (
                        <span className="absolute -top-1.5 -right-2.5 text-[10px] font-normal text-zinc-500" style={{ opacity: headerLoadStage >= 1 ? 1 : 0, transition: 'opacity 0.2s ease' }}>
                          {userCountry}
                        </span>
                      )}
                    </span>
                  </div>
                </Link>
              )}
            </div>

            {/* Middle: Expanding Search Bar */}
            {shouldShowSearchbar && !isLoading && (
              <div className={`flex items-center transition-all duration-300 ease-in-out ${
                isSearchExpanded 
                  ? 'flex-1 md:max-w-2xl mx-0 md:mx-4' 
                  : 'hidden md:flex md:flex-1 md:max-w-2xl md:mx-auto'}`} style={{ opacity: headerLoadStage >= 3 ? 1 : 0, transition: 'opacity 0.2s ease' }}>

                <div className="w-full">
                  <div className="flex w-full items-center gap-0">
                    <div className={`relative flex-1 min-w-0 flex items-center bg-white border transition-colors duration-200 ${
                      searchFocused ? 'border-[#1c62b9]' : 'border-[#ccc]'
                    }`} style={{ borderRadius: '40px 0 0 40px', height: '40px', boxSizing: 'border-box' }}>
                      {searchFocused && (
                        <svg
                          suppressHydrationWarning
                          className="w-5 h-5 ml-3 text-gray-700 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      <input
                        type="text"
                        autoFocus={isSearchExpanded}
                        placeholder="Search"
                        value={searchQuery}
                        onFocus={() => { setIsSearchExpanded(true); setSearchFocused(true); }}
                        onBlur={() => {
                          setSearchFocused(false);
                        }}
                        onChange={(event) => {
                          setSearchQuery(event.target.value);
                          if (event.target.value.trim()) {
                            setIsDropdownOpen(true);
                          } else {
                            setIsDropdownOpen(false);
                          }
                        }}
                        onKeyDown={(event) => {
                          const totalSuggestions = suggestions.videos.length + suggestions.profiles.length;
                          if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setSelectedIndex(prev => (prev < totalSuggestions - 1 ? prev + 1 : prev));
                          } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                          } else if (event.key === 'Enter') {
                            if (selectedIndex >= 0) {
                              if (selectedIndex < suggestions.videos.length) {
                                const v = suggestions.videos[selectedIndex];
                                setIsDropdownOpen(false);
                                router.push(`/watch/${v.id}`);
                              } else {
                                const p = suggestions.profiles[selectedIndex - suggestions.videos.length];
                                setIsDropdownOpen(false);
                                router.push(`/channel/${p.id}`);
                              }
                            } else {
                              handleSearch();
                            }
                          } else if (event.key === 'Escape') {
                            setIsDropdownOpen(false);
                            setIsSearchExpanded(false);
                          }
                        }}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-zinc-900 text-sm placeholder-zinc-400"
                        style={{ height: '100%', boxSizing: 'border-box', paddingLeft: searchFocused ? '2.5rem' : '1rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mr-3 p-1 text-zinc-500 hover:text-zinc-900 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleSearch()}
                      suppressHydrationWarning
                      className="flex-shrink-0 flex items-center justify-center text-gray-700 hover:text-zinc-900 transition-colors border-[#ccc] border-t border-r border-b border-l-0 bg-[#f8f8f8"
                      style={{ borderRadius: '0 40px 40px 0', height: '40px', width: '40px', boxSizing: 'border-box', margin: 0 }}
                      aria-label="Search"
                    >
                      <svg
                        suppressHydrationWarning
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[640px] max-w-[calc(100vw-2rem)] bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      {suggestions.videos.length === 0 && suggestions.profiles.length === 0 && searchQuery.trim() ? (
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setIsDropdownOpen(false); handleSearch(searchQuery); }}
                          className="w-full px-4 py-4 text-[15px] text-zinc-800 flex items-center gap-4 hover:bg-zinc-100/80 active:bg-zinc-200/80 text-left"
                        >
                          <svg className="w-5 h-5 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate">Search for "{searchQuery}"</span>
                            <span className="text-[12px] text-zinc-500">No exact matches found</span>
                          </div>
                        </button>
                      ) : suggestions.videos.length === 0 && suggestions.profiles.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-zinc-500 flex items-center gap-3">
                          <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          <span>Start typing to search videos and channels</span>
                        </div>
                      ) : (
                        <div className="max-h-[70vh] overflow-y-auto scrollbar-hide py-2">
                          {/* Videos first - search icon + name only */}
                          {suggestions.videos.length > 0 && suggestions.videos.map((v: any, idx) => (
                            <button
                              key={`v-${v.id}`}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setIsDropdownOpen(false); router.push(`/watch/${v.id}`); }}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${selectedIndex === idx ? 'bg-zinc-100' : 'hover:bg-zinc-100/60'}`}
                            >
                              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                              <span className="text-[14px] text-zinc-800 truncate flex-1">
                                {highlightMatch(v.title || '', searchQuery)}
                              </span>
                            </button>
                          ))}

                          {/* Creators / Channels - search icon + name + @username + small avatar on right */}
                          {suggestions.profiles.length > 0 && suggestions.profiles.map((p: any, idx) => {
                            const realIdx = idx + suggestions.videos.length;
                            const username = `@${(p.name || '').replace(/^@+/, '').replace(/\s+/g, '').toLowerCase()}`;
                            return (
                              <button
                                key={`p-${p.id}`}
                                onMouseEnter={() => setSelectedIndex(realIdx)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setIsDropdownOpen(false); router.push(`/channel/${p.id}`); }}
                                className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${selectedIndex === realIdx ? 'bg-zinc-100' : 'hover:bg-zinc-100/60'}`}
                              >
                                <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[14px] text-zinc-800 truncate">
                                      {highlightMatch(p.name || '', searchQuery)}
                                    </span>
                                    {p.verified && (
                                      <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17l-5-5 1.41-1.41L11 16.17l7.59-7.59L20 10l-9 9z"/>
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-[12px] text-zinc-500 truncate">{username}</span>
                                </div>
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 flex-shrink-0">
                                  {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-zinc-500">{p.name?.[0]?.toUpperCase()}</div>}
                                </div>
                              </button>
                            );
                          })}

                          {/* Search all results link */}
                          {searchQuery.trim() && (suggestions.videos.length > 0 || suggestions.profiles.length > 0) && (
                            <>
                              <div className="h-px bg-zinc-100/80 mx-3 my-1" />
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSearch(searchQuery)}
                                className="w-full px-4 py-2.5 text-[13px] text-zinc-700 hover:bg-zinc-100/80 active:bg-zinc-200/80 text-left flex items-center gap-3"
                              >
                                <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <span className="truncate">Search all results for "<span className="font-semibold text-zinc-900">{searchQuery}</span>"</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right: Actions */}
            <div className={`flex items-center space-x-1 sm:space-x-2 flex-shrink-0 transition-all ${isSearchExpanded ? 'hidden md:flex' : 'flex'}`}>
              {isLoading ? (
                // Skeleton placeholders during loading
                <>
                  <div className="w-10 h-10 rounded-full bg-[#f0f0f0]" style={{ pointerEvents: 'none' }} />
                  <div className="w-10 h-10 rounded-full bg-[#f0f0f0]" style={{ pointerEvents: 'none' }} />
                  <div className="w-10 h-10 rounded-full bg-[#f0f0f0]" style={{ pointerEvents: 'none' }} />
                </>
              ) : (
                // Actual icons after loading
                <>
                  {/* Mobile: Search icon - always show on mobile */}
                  <button
                    suppressHydrationWarning
                    onClick={() => onToggleSearchOverlay ? onToggleSearchOverlay() : setIsSearchExpanded(true)}
                    className="sm:hidden p-2 rounded-full hover:bg-zinc-200 text-zinc-900 transition-all active:scale-95"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {activeProfile && (
                    <div suppressHydrationWarning className="relative">
                      <button
                        suppressHydrationWarning
                        onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-zinc-900 font-bold text-sm transition-all active:scale-95"
                      >
                        <svg suppressHydrationWarning className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span suppressHydrationWarning>Create</span>
                      </button>

                      <CreateMenu isOpen={isCreateMenuOpen} onClose={() => setIsCreateMenuOpen(false)} profileId={activeProfile?.id} />
                    </div>
                  )}

                  {activeProfile && (
                    <div suppressHydrationWarning className="relative">
                      <button
                        suppressHydrationWarning
                        onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); if (!isNotificationsOpen) setHasUnreadNotifications(false); }}
                        className="flex p-2 rounded-full hover:bg-zinc-200 text-zinc-900 active:scale-90 transition-all relative"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                        {hasUnreadNotifications && notificationCount > 0 && (
                          <span className="absolute top-0.5 right-0.5 bg-red-600 text-[9px] font-bold text-zinc-900 px-1 rounded-full min-w-[14px] text-center border border-gray-900">
                            {notificationCount}
                          </span>
                        )}
                      </button>

                      <NotificationsPopup
                        isOpen={isNotificationsOpen}
                        onClose={() => setIsNotificationsOpen(false)}
                        onCountChange={(count) => {
                          setNotificationCount(count);
                          if (count > 0) setHasUnreadNotifications(true);
                          else setHasUnreadNotifications(false);
                        }}
                        activeProfile={activeProfile}
                      />
                    </div>
                  )}

                  {activeProfile ? (
                    <div suppressHydrationWarning className="relative ml-1 hidden sm:flex" ref={profileContainerRef}>
                      <div
                        suppressHydrationWarning
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="w-8 h-8 rounded-full overflow-hidden border border-zinc-200 cursor-pointer active:scale-95 transition-transform"
                      >
                        {activeProfile.avatar ? (
                          <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">{activeProfile.name[0]?.toUpperCase()}</div>
                        )}
                      </div>
                      <ProfileMenu isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} activeProfile={activeProfile} />
                    </div>
                  ) : (
                    <button
                      onClick={onToggleSignIn}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 text-blue-600 hover:bg-zinc-200/80 transition-all font-semibold text-sm w-fit"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      <span>Sign in</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
