'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ComingSoonSection from './ComingSoonSection';

type SidebarProps = {
  isCollapsed: boolean;
  isSignedIn?: boolean;
  activeProfile?: any;
};

export default function Sidebar({ isCollapsed, isSignedIn = false, activeProfile }: SidebarProps) {
  const pathname = usePathname();

  // Combine auth states
  const isUserAuthenticated = isSignedIn || !!activeProfile;

  const mainItems = [
    { icon: 'home', label: 'Home', path: '/' },
    { icon: 'styles', label: 'Style', path: '/styles' },
    { icon: 'subscriptions', label: 'Subscriptions', path: '/subscriptions', protected: true },
  ];

  const youItems = [
    ...(activeProfile ? [{ icon: 'yourChannel', label: 'Your channel', path: '/channel' }] : []),
    { icon: 'history', label: 'History', path: '/history' },
    { icon: 'playlists', label: 'Playlists', path: '/playlists' },
    { icon: 'watchLater', label: 'Watch later', path: '/watch-later' },
    { icon: 'liked', label: 'Liked videos', path: '/liked' },
  ];


  const exploreItems = [
    { icon: 'trending', label: 'Trending', path: '/trending' },
    { icon: 'music', label: 'Music', path: '/music' },
    { icon: 'community', label: 'Community', path: '/community' },
  ];

  const bottomItems = [
    { icon: 'download', label: 'Download App', path: '/download' },
    { icon: 'help', label: 'Help', path: '/help' },
    { icon: 'feedback', label: 'Feedback', path: '/feedback' },
  ];

  const getIcon = (icon: string, isActive: boolean) => {
    const icons: { [key: string]: JSX.Element } = {
      home: isActive ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10V21H9V15H15V21H20V10L12 3L4 10Z" /></svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 10V21H9V15H15V21H20V10L12 3L4 10Z" /></svg>
      ),
      styles: (
        <Image 
          src="/styles-icon.svg" 
          alt="Styles" 
          width={24} 
          height={24} 
          className={`w-6 h-6 ${isActive ? '' : 'opacity-70'}`}
        />
      ),
      subscriptions: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      ),
      yourChannel: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      history: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      playlists: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h12" /></svg>
      ),
      watchLater: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      liked: isActive ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
      ),
      trending: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      ),
      music: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
      ),
      community: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a5 5 0 00-5-5M7 20H2v-1a5 5 0 015-5m10-6a4 4 0 11-8 0 4 4 0 018 0zm-6 0a4 4 0 01-8 0 4 4 0 018 0z" /></svg>
      ),
      download: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      ),
      help: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      feedback: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
      ),
    };
    return icons[icon] || icons.home;
  };

  const renderItem = (item: any) => {
    const isActive = pathname === item.path;
    return (
      <li key={item.path} suppressHydrationWarning className="relative group list-none w-full">
        <Link
          suppressHydrationWarning
          href={item.protected && !isUserAuthenticated ? '/signin' : item.path}
          onClick={(e) => {
            if (item.comingSoon) e.preventDefault();
          }}
          className={`w-full transition-all duration-200 outline-none flex ${isCollapsed
            ? 'flex-col items-center justify-center py-4 px-0'
            : 'items-center space-x-5 px-3 py-2.5 rounded-xl'
            } ${isActive
              ? 'bg-white/10 text-white'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
        >
          <div suppressHydrationWarning className={`flex items-center justify-center transition-colors w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
            {getIcon(item.icon, isActive)}
          </div>
          <span
            suppressHydrationWarning
            className={`truncate transition-all duration-200 ${isCollapsed ? 'text-[10px] w-full text-center px-1 mt-1' : 'text-[14px]'}`}
          >
            {item.label}
          </span>
        </Link>
        {item.comingSoon && (
          <div suppressHydrationWarning className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            <div suppressHydrationWarning className="bg-[#1f1f1f] text-white text-xs font-semibold px-2 py-1 rounded shadow-xl whitespace-nowrap border border-white/10">
              Coming soon
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <aside
      suppressHydrationWarning
      className={`fixed left-0 top-14 h-[calc(100vh-56px)] bg-[#0f0f0f] overflow-y-auto hidden lg:block transition-all duration-300 border-r border-white/5 z-40 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div suppressHydrationWarning className={`py-2 w-full ${isCollapsed ? 'px-0' : 'px-3'}`}>
        <ul suppressHydrationWarning className="space-y-1 mb-3">
          {mainItems.map(renderItem)}
        </ul>

        {!isCollapsed && (
          <>
            {isUserAuthenticated && (
              <>
                <div suppressHydrationWarning className="h-px bg-white/10 my-3 mx-3" />

                <div suppressHydrationWarning className="flex items-center space-x-2 px-3 py-2 mb-1 group cursor-pointer hover:bg-white/5 rounded-xl transition-colors">
                  <span className="text-[16px] font-bold text-white">You</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <ul suppressHydrationWarning className="space-y-0.5">
                  {youItems.map(renderItem)}
                </ul>
              </>
            )}

            {!isUserAuthenticated && (
              <>
                <div suppressHydrationWarning className="h-px bg-white/10 my-3 mx-3" />
                <div className="px-6 py-4 bg-white/5 rounded-2xl mx-3 mb-4 border border-white/5">
                  <p className="text-[13px] text-gray-300 mb-4 leading-relaxed font-medium">
                    Sign in to like videos, comment, and subscribe.
                  </p>
                  <Link
                    href="/signin"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-blue-500/50 text-blue-400 hover:bg-blue-400/10 transition-all font-bold text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sign in
                  </Link>
                </div>
              </>
            )}

            <div suppressHydrationWarning className="h-px bg-white/10 my-3 mx-3" />
            
            <ComingSoonSection isCollapsed={isCollapsed} activeProfile={activeProfile} />

            <div suppressHydrationWarning className="h-px bg-white/10 my-3 mx-3" />

            <div suppressHydrationWarning className="px-3 py-2">
              <h3 className="text-[16px] font-bold text-white mb-1">Explore</h3>
            </div>
            <ul suppressHydrationWarning className="space-y-0.5">
              {exploreItems.map(renderItem)}
            </ul>

            <div suppressHydrationWarning className="h-px bg-white/10 my-3 mx-3" />

            <ul suppressHydrationWarning className="space-y-0.5 mb-6">
              {bottomItems.map(renderItem)}
            </ul>

            <div suppressHydrationWarning className="px-6 py-4 text-[12px] font-semibold text-gray-500 space-y-3">
              <div suppressHydrationWarning className="flex flex-wrap gap-x-2 gap-y-1">
                <Link href="/about" className="hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/press" className="hover:text-white transition-colors">
                  Press
                </Link>
                <Link href="/copyright" className="hover:text-white transition-colors">
                  Copyright
                </Link>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact us
                </Link>
                <Link href="/creators" className="hover:text-white transition-colors">
                  Creators
                </Link>
                <Link href="/advertisement" className="hover:text-white transition-colors">
                  Advertisement
                </Link>
                <Link href="/developers" className="hover:text-white transition-colors">
                  Developers
                </Link>
              </div>
              <div suppressHydrationWarning className="flex flex-wrap gap-x-2 gap-y-1">
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/policy-safety" className="hover:text-white transition-colors">
                  Policy & Safety
                </Link>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How Playra works
                </Link>
                <Link href="/test-new-features" className="hover:text-white transition-colors">
                  Test new features
                </Link>
              </div>
              <div suppressHydrationWarning className="pt-2 font-normal text-gray-600">
                © {new Date().getFullYear()} Codedwaves LLC
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
