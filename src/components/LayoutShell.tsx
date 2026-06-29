'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopLoader from '@/components/TopLoader';
import AppInstallBanner from '@/components/AppInstallBanner';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import LoadingScreen from '@/components/LoadingScreen';
import SkeletonLoading from '@/components/SkeletonLoading';
import WhoIsWatchingOverlay from '@/components/WhoIsWatchingOverlay';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY = 'playra_sidebar_collapsed';


interface LayoutShellProps {
  children: React.ReactNode;
  activeProfile: any; // Using any to avoid complex type imports for now, or define a basic shape
  excludeAppShell?: boolean;
}

export default function LayoutShell({ children, activeProfile: serverProfile, excludeAppShell = false }: LayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showWhoIsWatching, setShowWhoIsWatching] = useState(false);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [activeProfile, setActiveProfile] = useState(serverProfile);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingStartTime, setLoadingStartTime] = useState<number>(Date.now());
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ videos: any[]; profiles: any[] }>({ videos: [], profiles: [] });
  const [initialResults, setInitialResults] = useState<{ videos: any[]; profiles: any[] }>({ videos: [], profiles: [] });
  const searchCacheRef = useRef<Map<string, { videos: any[]; profiles: any[]; timestamp: number }>>(new Map());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync search overlay with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const isOpen = window.location.hash === '#searching';
      setIsSearchOverlayOpen(isOpen);
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Pre-fetch initial results on mount
  useEffect(() => {
    fetchInitialResults();
  }, []);

  const fetchInitialResults = async () => {
    // Check cache first
    const cached = searchCacheRef.current.get('initial');
    if (cached && (cached.videos.length > 0 || cached.profiles.length > 0) && Date.now() - cached.timestamp < 60000) {
      setInitialResults(cached);
      return;
    }

    try {
      // Try without query parameter to get any videos
      const res = await fetch(`/api/search?dropdown=true&limit=5`);
      const json = await res.json();
      const next = { videos: json.videos || [], profiles: json.profiles || [] };
      setInitialResults(next);
      // Cache for 60 seconds
      searchCacheRef.current.set('initial', { ...next, timestamp: Date.now() });
    } catch (error) {
      console.error('Error fetching initial results:', error);
      setInitialResults({ videos: [], profiles: [] });
    }
  };

  const openSearchOverlay = () => {
    window.location.hash = 'searching';
  };

  const closeSearchOverlay = () => {
    if (window.location.hash === '#searching') {
      window.history.back();
    } else {
      setIsSearchOverlayOpen(false);
    }
  };

  // Search function with debouncing
  const fetchSearchResults = async (query: string) => {
    const cached = searchCacheRef.current.get(query);
    // Only serve from cache when we have actual results (not empty), and within 15s
    if (cached && (cached.videos.length > 0 || cached.profiles.length > 0) && Date.now() - cached.timestamp < 15000) {
      setSearchResults(cached);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&dropdown=true&limit=12`);
      const json = await res.json();
      console.log('Search results:', json);
      const next = { videos: json.videos || [], profiles: json.profiles || [] };
      setSearchResults(next);
      // Only cache when we got something back
      if (next.videos.length > 0 || next.profiles.length > 0) {
        searchCacheRef.current.set(query, { ...next, timestamp: Date.now() });
      } else {
        searchCacheRef.current.set(query, { ...next, timestamp: Date.now() - 13000 });
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults({ videos: [], profiles: [] });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.length >= 1) {
      // Fire with 500ms debounce
      searchTimeoutRef.current = setTimeout(() => {
        fetchSearchResults(searchQuery);
      }, 500);
    } else {
      setSearchResults({ videos: [], profiles: [] });
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Fallback: load profile from localStorage if not available from server
  useEffect(() => {
    if (!activeProfile && typeof window !== 'undefined') {
      const stored = localStorage.getItem('playra_profile');
      if (stored) {
        try {
          setActiveProfile(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  // Save profile to localStorage when it changes
  useEffect(() => {
    if (activeProfile && typeof window !== 'undefined') {
      localStorage.setItem('playra_profile', JSON.stringify(activeProfile));
    }
  }, [activeProfile]);

  const isStylesPage = pathname?.startsWith('/styles');
  const isStudio = pathname?.startsWith('/studio');
  const isCreatePage = pathname?.startsWith('/create');

  // Load profiles helper
  const loadProfiles = async (userId: string) => {
    try {
      const { getUserProfiles } = await import('@/app/actions/profile');
      const pros = await getUserProfiles(userId);
      setUserProfiles(pros);
    } catch (e) {
      console.error("LayoutShell: Failed to load profiles", e);
    }
  };

  useEffect(() => {
    setMounted(true);

    // Initial load check - show every time for now
    setShowSplash(true);
    sessionStorage.setItem('playra_splash_seen', 'true');

    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsSignedIn(true);
        setUser(user);
        loadProfiles(user.uid);
      } else {
        setIsSignedIn(false);
        setUser(null);
        setUserProfiles([]);
      }
      
      // Calculate remaining delay to ensure minimum 600ms loading time
      const elapsed = Date.now() - loadingStartTime;
      const remainingDelay = Math.max(0, 600 - elapsed);
      
      setTimeout(() => {
        setIsPageLoading(false);
      }, remainingDelay);
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsSidebarCollapsed(stored === 'true');
    } else {
      setIsSidebarCollapsed(true);
    }

    return () => unsubscribeAuth();
  }, []);

  // Handle flow after splash
  const handleSplashFinish = () => {
    setShowSplash(false);
    setIsFirstLoad(false);

    // If signed in but no active profile, show account switcher
    if (isSignedIn && !activeProfile) {
      setShowWhoIsWatching(true);
    }
  };

  // If signed in but activeProfile disappears (e.g. cookie cleared) and we aren't showing splash
  useEffect(() => {
    if (!showSplash && isSignedIn && !activeProfile && userProfiles.length > 0 && !showWhoIsWatching && !isFirstLoad) {
      // Check if we are on an auth page, if so don't show overlay
      const isAuth = pathname === '/signin' || pathname === '/set-account' || pathname === '/select-profile';
      if (!isAuth) {
        setShowWhoIsWatching(true);
      }
    }
  }, [isSignedIn, activeProfile, showSplash, userProfiles, pathname, isFirstLoad, showWhoIsWatching]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem(STORAGE_KEY, String(newState));
  };

  const handleToggleSignIn = () => {
    if (isSignedIn) {
      router.push('/set-account');
    } else {
      router.push('/signin');
    }
  };

  const sidebarWidth = isSidebarCollapsed ? (typeof window !== 'undefined' && window.innerWidth < 768 ? '0px' : '80px') : '256px';
  const mobileSidebarWidth = '0px';

  const isAuthPage = pathname === '/signin' || pathname === '/set-account' || pathname === '/select-profile';
  const isEmbedPage = pathname.startsWith('/embed/');
  const isAboutPage = pathname === '/about';

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 text-zinc-900">
        <div suppressHydrationWarning className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
          <button className="p-2 rounded-full hover:bg-gray-100 text-zinc-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <img src="/Playra.png" alt="Playra" className="h-6 w-auto" />
          <div suppressHydrationWarning className="w-10" />
        </div>
        <div suppressHydrationWarning className="pt-32 flex flex-col items-center justify-center p-6 text-center">
          <div suppressHydrationWarning className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-6.364-2.637m4.95-4.95a3 3 0 010-4.243m0 0L2.122 2.122m5.657 5.657L5.657 5.657" /></svg>
          </div>
          <h2 className="text-2xl font-black mb-4">No connection</h2>
          <p className="text-gray-500 mb-8 max-w-sm">Connect to the internet to continue exploring Playra's next-gen discovery.</p>
          <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-3 rounded-full font-black text-sm active:scale-95 transition-all">Retry</button>
        </div>
      </div>
    );
  }

  if (isAuthPage || isEmbedPage || isAboutPage) {
    return <>{children}</>;
  }

  // Studio and Create pages have their own shell; avoid double nav/sidebars
  if (isStudio || isCreatePage) {
    return <>{children}</>;
  }

  return (
    <>
      {/* TopLoader disabled to remove circle loader */}
      <div className={isStylesPage ? 'styles-page-navbar' : ''}>
        <Navbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          isSignedIn={isSignedIn}
          onToggleSignIn={handleToggleSignIn}
          onToggleSearchOverlay={openSearchOverlay}
          activeProfile={activeProfile}
          isLoading={isPageLoading}
        />
      </div>

      <div
        suppressHydrationWarning
        className="flex bg-white min-h-screen"
      >
        <style jsx global>{`
          :root {
            --sidebar-width-mobile: 0px;
            --sidebar-width-desktop-collapsed: 80px;
            --sidebar-width-desktop-expanded: 256px;
          }
          @media (max-width: 1023px) {
            .main-shell-container { --sidebar-width: 0px; }
          }
        `}</style>
        {!isPageLoading && <Sidebar isCollapsed={isSidebarCollapsed} isSignedIn={isSignedIn} activeProfile={activeProfile} />}

        <main
          className={`flex-1 min-w-0 z-[50] bg-white ${isStylesPage ? 'h-screen overflow-hidden' : 'main-content-area'} ${isPageLoading ? '' : (isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64')
            }`}
        >
          {isPageLoading ? <SkeletonLoading /> : children}
        </main>
      </div>

      <div className={isStylesPage ? 'styles-page-mobilenav' : ''}>
        <MobileNav
          isSignedIn={isSignedIn}
          userAvatar={activeProfile?.avatar || ""}
        />
      </div>

      {isStylesPage && (
        <style jsx global>{`
          @media (max-width: 767px) {
            .styles-page-navbar { display: none !important; }
            .styles-page-mobilenav { display: none !important; }
            /* Make main content start from very top with no navbar offset */
            main { padding-top: 0 !important; margin-top: 0 !important; }
          }
        `}</style>
      )}

      <AppInstallBanner />
      <ServiceWorkerRegister />

      {/* Search Overlay */}
      {isSearchOverlayOpen && (
        <div className="fixed inset-0 z-[9998] bg-zinc-50">
          {/* Top Bar */}
          <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 flex items-center gap-3 px-4 z-[9999]">
            {/* Back Arrow */}
            <button
              onClick={closeSearchOverlay}
              className="p-2 rounded-full hover:bg-zinc-200 text-zinc-900 transition-all active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Search Input */}
            <div className="flex-1 flex items-center">
              <div className="relative w-full flex items-center">
                <input
                  type="text"
                  placeholder="Search Playra"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/results?search_query=${encodeURIComponent(searchQuery.trim())}`;
                    }
                  }}
                  autoFocus
                  className="w-full h-10 bg-zinc-100 rounded-full pl-4 pr-12 text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* X button when typing */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-12 p-1 text-zinc-500 hover:text-zinc-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Search icon inside input (right side, clickable) */}
                <button
                  onClick={() => {
                    if (searchQuery.trim()) {
                      window.location.href = `/results?search_query=${encodeURIComponent(searchQuery.trim())}`;
                    }
                  }}
                  className="absolute right-4 p-1 text-zinc-500 hover:text-zinc-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="pt-14 h-full overflow-y-auto p-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : searchQuery.trim().length >= 1 && (searchResults.videos.length > 0 || searchResults.profiles.length > 0) ? (
              // Show search results when user has typed and results exist
              <div className="space-y-4">
                  {/* Videos */}
                  {searchResults.videos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-zinc-500 mb-3 px-1">Videos</h3>
                      {searchResults.videos.map((video: any, index: number) => (
                        <Link
                          key={video.id}
                          href={`/watch/${video.id}`}
                          onClick={closeSearchOverlay}
                          className="block p-3 rounded-xl hover:bg-zinc-100 transition-colors animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <p className="text-sm font-medium text-zinc-900 line-clamp-2">{video.title}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Profiles */}
                  {searchResults.profiles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-zinc-500 mb-3 px-1">Channels</h3>
                      {searchResults.profiles.map((profile: any, index: number) => (
                        <Link
                          key={profile.id}
                          href={`/channel/${profile.id}`}
                          onClick={closeSearchOverlay}
                          className="block p-3 rounded-xl hover:bg-zinc-100 transition-colors animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${(searchResults.videos.length + index) * 100}ms` }}
                        >
                          <p className="text-sm font-medium text-zinc-900">{profile.name}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
            ) : searchQuery.trim().length >= 1 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-zinc-500">No results found</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showWhoIsWatching && !showSplash && (
        <WhoIsWatchingOverlay
          profiles={userProfiles}
          userId={user?.uid}
          onSelect={() => {
            setShowWhoIsWatching(false);
            window.location.reload(); // Refresh to pick up active profile cookie
          }}
        />
      )}
    </>
  );
}

