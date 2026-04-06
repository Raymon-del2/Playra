'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocation } from '@/hooks/useLocation';
import ProfileMenu from './ProfileMenu';
import NotificationsPopup from './NotificationsPopup';
import CreateMenu from './CreateMenu';
import { submitFeedback } from '@/app/actions/feedback';

type NavbarProps = {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isSignedIn?: boolean;
  onToggleSignIn?: () => void;
  onToggleMobileDrawer?: () => void;
  activeProfile?: any;
};

export default function Navbar({
  isSidebarCollapsed,
  onToggleSidebar,
  isSignedIn = false,
  onToggleSignIn,
  onToggleMobileDrawer,
  activeProfile
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check if current page should show searchbar (home, styles, watch, or results pages)
  const shouldShowSearchbar = pathname === '/' || pathname?.startsWith('/styles') || pathname?.startsWith('/watch') || pathname?.startsWith('/results');

  const getSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  };

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    setIsSpeechSupported(Boolean(SpeechRecognition));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
    if (cached && Date.now() - cached.timestamp < 30000) {
      setSuggestions(cached);
      return;
    }

    setIsLoadingSuggest(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&dropdown=true&limit=6`);
      const json = await res.json();
      setSuggestions({ videos: json.videos || [], profiles: json.profiles || [] });
      searchCacheRef.current.set(query, { videos: json.videos || [], profiles: json.profiles || [], timestamp: Date.now() });
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

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.length >= 2 && isDropdownOpen) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    }
    // Don't clear suggestions when query is empty - keep initial suggestions

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, isDropdownOpen]);

  const startListening = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator?.language || 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setSearchQuery(transcript.trim());
        }
      };
      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  };

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <>
      <nav suppressHydrationWarning className={`fixed top-0 left-0 right-0 h-14 border-b z-[100] flex items-center transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#0f0f0f]/80 backdrop-blur-xl border-white/10' 
          : 'bg-[#0f0f0f] border-white/5'
      }`}>
        {isSearching && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-pulse" />
        )}
        <div suppressHydrationWarning className="w-full px-4">
          <div suppressHydrationWarning className="flex items-center justify-between h-14 gap-2 relative">
            
            {/* Left: Logo & Sidebar Toggle */}
            <div className={`flex items-center gap-2 transition-all duration-300 ${isSearchExpanded ? 'hidden md:flex' : 'flex'}`}>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-full hover:bg-white/10 text-white transition-all active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>

              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex p-2 rounded-full hover:bg-white/10 text-white transition-all active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>

              <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
                <div suppressHydrationWarning className="flex items-center gap-2">
                  <img src="/play-logo.png" alt="Playra" className="h-[22px] w-auto" />
                  <span className="font-[family-name:var(--font-anton)] text-white text-lg tracking-wide uppercase">Playra</span>
                </div>
                <span className="hidden xs:inline text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-1.5 py-0.5 rounded ml-1 border border-white/5">
                  {countryCode || 'KE'}
                </span>
              </Link>
            </div>

            {/* Middle: Expanding Search Bar */}
            {shouldShowSearchbar && (
              <div className={`flex items-center transition-all duration-300 ease-in-out ${
                isSearchExpanded 
                  ? 'flex-1 md:max-w-2xl mx-0 md:mx-4' 
                  : 'hidden md:flex md:flex-1 md:max-w-2xl md:mx-auto'}`}>

                <div className="flex w-full items-center gap-0">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      autoFocus={isSearchExpanded}
                      placeholder="Search"
                      value={searchQuery}
                      onFocus={() => { setIsDropdownOpen(true); setIsSearchExpanded(true); }}
                      onBlur={() => {
                        setTimeout(() => {
                          setIsDropdownOpen(false);
                          setSelectedIndex(-1);
                        }, 200);
                      }}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onKeyDown={(event) => {
                        const totalSuggestions = suggestions.profiles.length + suggestions.videos.length;
                        if (event.key === 'ArrowDown') {
                          event.preventDefault();
                          setSelectedIndex(prev => (prev < totalSuggestions - 1 ? prev + 1 : prev));
                        } else if (event.key === 'ArrowUp') {
                          event.preventDefault();
                          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                        } else if (event.key === 'Enter') {
                          if (selectedIndex >= 0) {
                            if (selectedIndex < suggestions.profiles.length) {
                              const p = suggestions.profiles[selectedIndex];
                              setIsDropdownOpen(false);
                              router.push(`/channel/${p.id}`);
                            } else {
                              const v = suggestions.videos[selectedIndex - suggestions.profiles.length];
                              setIsDropdownOpen(false);
                              router.push(`/watch/${v.id}`);
                            }
                          } else {
                            handleSearch();
                          }
                        } else if (event.key === 'Escape') {
                          setIsDropdownOpen(false);
                          setIsSearchExpanded(false);
                        }
                      }}
                      className="w-full bg-black border border-white/10 text-white placeholder-white/50 rounded-l-full py-2.5 pl-12 pr-4 focus:outline-none focus:border-white/30 transition-all font-medium text-[16px]"
                    />
                    
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleSearch()}
                    className="flex-shrink-0 bg-white/10 border border-white/10 border-l-0 rounded-r-full px-5 py-2.5 hover:bg-white/15 transition-all"
                  >
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>

                  <button
                    onClick={handleMicClick}
                    disabled={!isSpeechSupported}
                    className={`ml-3 flex-shrink-0 p-2.5 rounded-full transition-all ${isListening ? 'bg-red-600' : 'hover:bg-white/10'} ${!isSpeechSupported ? 'opacity-40' : ''}`}
                    title="Search with voice"
                  >
                    <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  </button>

                    {isDropdownOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[480px] bg-[#0f0f0f] md:bg-zinc-900 border border-white/5 rounded-xl shadow-2xl z-[110] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        {isLoadingSuggest ? (
                          <div className="px-4 py-3 text-sm text-zinc-400 flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Searching...
                          </div>
                        ) : suggestions.videos.length === 0 && suggestions.profiles.length === 0 && searchQuery.trim() ? (
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setIsDropdownOpen(false); handleSearch(searchQuery); }}
                            className="w-full px-4 py-3 text-[15px] text-zinc-200 flex items-center gap-4 hover:bg-white/5 active:bg-white/10 text-left"
                          >
                            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <span className="font-semibold">{searchQuery}</span>
                          </button>
                        ) : (
                          <div className="py-2 max-h-[75vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide">
                            {suggestions.profiles.map((p: any, idx) => (
                              <button
                                key={p.id}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setIsDropdownOpen(false); router.push(`/channel/${p.id}`); }}
                                className={`w-full px-4 py-2.5 flex items-center gap-4 transition-colors text-left ${selectedIndex === idx ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                              >
                                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/5">
                                  {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">{p.name?.[0]}</div>}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[15px] text-zinc-100 font-bold truncate">{p.name}</span>
                                  <span className="text-[12px] text-zinc-500 truncate">@{p.name?.replace(/\s+/g, '').toLowerCase()} • Profile</span>
                                </div>
                              </button>
                            ))}
                            {suggestions.videos.map((v: any, idx) => {
                              const realIdx = idx + suggestions.profiles.length;
                              return (
                                <button
                                  key={v.id}
                                  onMouseEnter={() => setSelectedIndex(realIdx)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => { setIsDropdownOpen(false); router.push(`/watch/${v.id}`); }}
                                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${selectedIndex === realIdx ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                                >
                                  <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
                                    <img 
                                      src={v.thumbnail_url || '/default-thumbnail.jpg'} 
                                      alt={v.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[15px] text-zinc-100 font-bold truncate">{v.title}</span>
                                    <span className="text-[12px] text-zinc-500 truncate">{v.channel_name} • Video</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
            )}

            {/* Be a Helper link */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Be a helper
            </button>

            {/* TV Mode link */}
            <Link
              href="/tv"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M12 6v8" />
              </svg>
              TV Mode
            </Link>

            {/* Right: Actions */}
            <div className={`flex items-center space-x-1 sm:space-x-2 flex-shrink-0 transition-all ${isSearchExpanded ? 'hidden md:flex' : 'flex'}`}>
              
              <div className="flex items-center">
                {shouldShowSearchbar && !isSearchExpanded && (
                  <button 
                    onClick={() => setIsSearchExpanded(true)}
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                )}
                
                <button className="hidden xs:flex p-2 rounded-full hover:bg-white/10 text-white active:scale-90 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5v3.375C3 17.439 3.561 18 4.125 18h3.375m-4.5-9a4.5 4.5 0 014.5-4.5h11.25a4.5 4.5 0 014.5 4.5v11.25a4.5 4.5 0 01-4.5 4.5H10.5" /><path d="M3 13.5c3.314 0 6 2.686 6 6M3 9c5.523 0 10 4.477 10 10" /></svg>
                </button>
              </div>

              {activeProfile && (
                <div suppressHydrationWarning className="relative">
                  <button
                    suppressHydrationWarning
                    onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                    className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition-all active:scale-95 border border-white/5"
                  >
                    <svg suppressHydrationWarning className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span suppressHydrationWarning>Create</span>
                  </button>

                  <CreateMenu isOpen={isCreateMenuOpen} onClose={() => setIsCreateMenuOpen(false)} />
                </div>
              )}

              <div suppressHydrationWarning className="relative">
                <button
                  suppressHydrationWarning
                  onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); if (!isNotificationsOpen) setHasUnreadNotifications(false); }}
                  className="flex p-2 rounded-full hover:bg-white/10 text-white active:scale-90 transition-all relative"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                  {hasUnreadNotifications && notificationCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-red-600 text-[9px] font-bold text-white px-1 rounded-full min-w-[14px] text-center border border-gray-900">
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

              {activeProfile ? (
                <div suppressHydrationWarning className="relative ml-1" ref={profileContainerRef}>
                  <div
                    suppressHydrationWarning
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/10 cursor-pointer active:scale-95 transition-transform"
                  >
                    {activeProfile.avatar ? (
                      <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">{activeProfile.name[0]?.toUpperCase()}</div>
                    )}
                  </div>
                  <ProfileMenu isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} activeProfile={activeProfile} />
                </div>
              ) : (
                <button
                  onClick={onToggleSignIn}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/50 text-blue-400 hover:bg-blue-400/10 transition-all font-bold text-[14px]"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  <span className="hidden xs:inline">Sign in</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Feedback Popup */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsFeedbackOpen(false)} />
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <button
              onClick={() => { setIsFeedbackOpen(false); setSubmitSuccess(false); setFeedbackMessage(''); }}
              className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Thank you!</h3>
                <p className="text-zinc-400">Your feedback helps make the app better.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-2">Be a helper</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  We are constantly doing our best to make the app be smooth and with your help it might just work.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!feedbackMessage.trim() || isSubmitting) return;
                    
                    setIsSubmitting(true);
                    const result = await submitFeedback(feedbackMessage, activeProfile?.id);
                    setIsSubmitting(false);
                    
                    if (result.success) {
                      setSubmitSuccess(true);
                      setFeedbackMessage('');
                    }
                  }}
                >
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Share your ideas for the app..."
                    className="w-full h-32 bg-zinc-800 border border-white/10 rounded-xl p-3 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-white/30 transition-colors"
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    disabled={!feedbackMessage.trim() || isSubmitting}
                    className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Feedback'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0f0f0f] border-r border-white/10 overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <img src="/play-logo.png" alt="Playra" className="h-[22px] w-auto" />
                  <span className="font-[family-name:var(--font-anton)] text-white text-lg tracking-wide uppercase">Playra</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-3 space-y-1">
              <Link href="/" className="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 10V21H9V15H15V21H20V10L12 3Z" /></svg>
                <span className="font-medium">Home</span>
              </Link>
              
              <Link href="/explore" className="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <img src="/explore.svg" alt="Explore" className="w-6 h-6 opacity-70" />
                <span className="font-medium">Explore</span>
              </Link>
              
              <Link href="/channel" className="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-medium">Your channel</span>
              </Link>
              
              <Link href="/studio" className="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span className="font-medium">Studio</span>
              </Link>
              
              <Link href="/subscriptions" className="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <img src="/subscriptions.svg" alt="Subscriptions" className="w-6 h-6 opacity-70" />
                <span className="font-medium">Subscriptions</span>
              </Link>
              
              <Link href="/styles" className="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <img src="/styles-icon.svg" alt="Styles" className="w-6 h-6 opacity-70" />
                <span className="font-medium">Styles</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
