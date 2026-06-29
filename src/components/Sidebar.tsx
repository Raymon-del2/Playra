'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { engagementSupabase } from '@/lib/supabase';

type SidebarProps = {
  isCollapsed: boolean;
  isSignedIn?: boolean;
  activeProfile?: any;
};

export default function Sidebar({ isCollapsed, isSignedIn = false, activeProfile }: SidebarProps) {
  const pathname = usePathname();
  const [subscriptionsExpanded, setSubscriptionsExpanded] = useState(true);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSubscriptions() {
      if (!activeProfile?.id) return;
      
      const { data: subs } = await engagementSupabase
        .from('subscriptions')
        .select('channel_id')
        .eq('subscriber_id', activeProfile.id)
        .limit(10);
      
      if (subs && subs.length > 0) {
        const channelIds = subs.map(s => s.channel_id);
        
        const { data: profiles } = await engagementSupabase
          .from('profiles')
          .select('id, name, avatar')
          .in('id', channelIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        setUserSubscriptions(subs.map(s => {
          const profile = profileMap.get(s.channel_id);
          return {
            id: s.channel_id,
            name: profile?.name,
            avatar: profile?.avatar
          };
        }));
      }
    }
    fetchSubscriptions();
  }, [activeProfile?.id]);

  // Combine auth states
  const isUserAuthenticated = isSignedIn || !!activeProfile;

  const mainItems = [
    { icon: 'home', label: 'Home', path: '/' },
    { icon: 'styles', label: 'Styles', path: '/styles' },
    { icon: 'subscriptions', label: 'Subscriptions', path: '/subscriptions', protected: true },
    { icon: 'you', label: 'You', path: '/channel' },
  ];

  const youItems = [
    ...(activeProfile ? [{ icon: 'yourChannel', label: 'Your channel', path: '/channel' }] : []),
    { icon: 'history', label: 'History', path: '/history' },
    { icon: 'playlists', label: 'Playlists', path: '/playlists' },
    { icon: 'watchLater', label: 'Watch later', path: '/watch-later' },
    { icon: 'liked', label: 'Liked videos', path: '/liked' },
  ];

  const subscriptionItems = [
    { icon: 'subscriptions', label: 'Subscriptions', path: '/subscriptions', protected: true },
  ];


  const exploreItems = [
    { icon: 'trending', label: 'Trending', path: '/trending' },
  ];

  const bottomItems = [
    { icon: 'help', label: 'Help', path: '/help' },
    { icon: 'feedback', label: 'Feedback', path: '/feedback' },
  ];

  const getIcon = (icon: string, isActive: boolean) => {
    const icons: { [key: string]: JSX.Element } = {
      home: isActive ? (
        <svg className="w-6 h-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z"/></svg>
      ) : (
        <svg className="w-6 h-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M304 70.1C313.1 61.9 326.9 61.9 336 70.1L568 278.1C577.9 286.9 578.7 302.1 569.8 312C560.9 321.9 545.8 322.7 535.9 313.8L527.9 306.6L527.9 511.9C527.9 547.2 499.2 575.9 463.9 575.9L175.9 575.9C140.6 575.9 111.9 547.2 111.9 511.9L111.9 306.6L103.9 313.8C94 322.6 78.9 321.8 70 312C61.1 302.2 62 287 71.8 278.1L304 70.1zM320 120.2L160 263.7L160 512C160 520.8 167.2 528 176 528L224 528L224 424C224 384.2 256.2 352 296 352L344 352C383.8 352 416 384.2 416 424L416 528L464 528C472.8 528 480 520.8 480 512L480 263.7L320 120.3zM272 528L368 528L368 424C368 410.7 357.3 400 344 400L296 400C282.7 400 272 410.7 272 424L272 528z"/></svg>
      ),
      explore: (
        <Image
          src="/explore.svg"
          alt="Explore"
          width={24}
          height={24}
          className="w-6 h-6"
          style={{ filter: 'brightness(0) saturate(100%)' }}
        />
      ),
      styles: (
        <Image
          src={isActive ? '/styles-icon-blue.svg' : '/styles-icon.svg'}
          alt="Styles"
          width={24}
          height={24}
          className="w-6 h-6"
          style={isActive ? undefined : { filter: 'brightness(0) saturate(100%)' }}
        />
      ),
      subscriptions: (
        <Image
          src={isActive ? '/subscriptions-active.svg' : '/subscriptions-inactive.svg'}
          alt="Subscriptions"
          width={24}
          height={24}
          className="w-6 h-6"
          style={{ filter: 'brightness(0) saturate(100%)' }}
        />
      ),
      you: isActive ? (
        <svg className="w-6 h-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M240 192C240 147.8 275.8 112 320 112C364.2 112 400 147.8 400 192C400 236.2 364.2 272 320 272C275.8 272 240 236.2 240 192zM448 192C448 121.3 390.7 64 320 64C249.3 64 192 121.3 192 192C192 262.7 249.3 320 320 320C390.7 320 448 262.7 448 192zM144 544C144 473.3 201.3 416 272 416L368 416C438.7 416 496 473.3 496 544L496 552C496 565.3 506.7 576 520 576C533.3 576 544 565.3 544 552L544 544C544 446.8 465.2 368 368 368L272 368C174.8 368 96 446.8 96 544L96 552C96 565.3 106.7 576 120 576C133.3 576 144 565.3 144 552L144 544z"/></svg>
      ) : (
        <svg className="w-6 h-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M240 192C240 147.8 275.8 112 320 112C364.2 112 400 147.8 400 192C400 236.2 364.2 272 320 272C275.8 272 240 236.2 240 192zM448 192C448 121.3 390.7 64 320 64C249.3 64 192 121.3 192 192C192 262.7 249.3 320 320 320C390.7 320 448 262.7 448 192zM144 544C144 473.3 201.3 416 272 416L368 416C438.7 416 496 473.3 496 544L496 552C496 565.3 506.7 576 520 576C533.3 576 544 565.3 544 552L544 544C544 446.8 465.2 368 368 368L272 368C174.8 368 96 446.8 96 544L96 552C96 565.3 106.7 576 120 576C133.3 576 144 565.3 144 552L144 544z"/></svg>
      ),
      yourChannel: (
        <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      history: (
        <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      playlists: (
        <Image
          src="/library_add_24dp_EFEFEF_FILL0_wght300_GRAD200_opsz24.svg"
          alt="Playlists"
          width={24}
          height={24}
          className="w-6 h-6"
          style={{ filter: 'brightness(0) saturate(100%)' }}
        />
      ),
      watchLater: (
        <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      liked: (
        <Image
          src="/interests_24dp_EFEFEF_FILL0_wght300_GRAD200_opsz24.svg"
          alt="Liked"
          width={24}
          height={24}
          className="w-6 h-6"
          style={{ filter: 'brightness(0) saturate(100%)' }}
        />
      ),
      trending: (
        <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      ),
      music: (
        <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
      ),
      community: (
        <Image
          src="/family_group_24dp_EFEFEF_FILL0_wght300_GRAD200_opsz24.svg"
          alt="Community"
          width={24}
          height={24}
          className="w-6 h-6"
          style={{ filter: 'brightness(0) saturate(100%)' }}
        />
      ),
      download: (
        <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
      ),
      help: (
        <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      feedback: (
        <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
      ),
    };
    return icons[icon] || icons.home;
  };

  const [hoveredItem, setHoveredItem] = useState<{ label: string; top: number } | null>(null);
  const [isYouMenuOpen, setIsYouMenuOpen] = useState(false);
  const [isYouMenuSticky, setIsYouMenuSticky] = useState(false);
  const youMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isYouMenuSticky) {
        const target = event.target as HTMLElement;
        const youButton = target.closest('[data-you-button="true"]');
        const youMenu = target.closest('[data-you-menu="true"]');
        
        if (!youButton && !youMenu) {
          setIsYouMenuSticky(false);
          setIsYouMenuOpen(false);
          setHoveredItem(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isYouMenuSticky]);

  const renderItem = (item: any) => {
    const isActive = pathname === item.path;
    const isYouItem = item.icon === 'you';
    
    return (
      <li key={item.path} suppressHydrationWarning className="relative group list-none w-full">
        {isYouItem && isCollapsed ? (
          <div
            suppressHydrationWarning
            title={item.label}
            data-you-button="true"
            className={`w-full outline-none flex flex-col items-center justify-center h-[72px] py-4 px-0 rounded-xl transition-colors duration-200 cursor-pointer ${
              isActive ? 'text-zinc-900 hover:bg-zinc-100/80' : 'text-zinc-700 hover:bg-zinc-100/80'
            }`}
            onMouseEnter={(e) => {
              setHoveredItem({ label: item.label, top: e.currentTarget.getBoundingClientRect().top });
              // Only enable popup when signed in
              if (isSignedIn) {
                if (youMenuTimeoutRef.current) clearTimeout(youMenuTimeoutRef.current);
                setIsYouMenuOpen(true);
              }
            }}
            onMouseLeave={(e) => {
              // Check if mouse is moving to the popup
              const relatedTarget = e.relatedTarget as HTMLElement;
              const youMenu = relatedTarget?.closest('[data-you-menu="true"]');
              
              if (!youMenu && !isYouMenuSticky) {
                if (youMenuTimeoutRef.current) clearTimeout(youMenuTimeoutRef.current);
                youMenuTimeoutRef.current = setTimeout(() => {
                  setIsYouMenuOpen(false);
                  setHoveredItem(null);
                }, 200);
              }
            }}
          >
            <div suppressHydrationWarning className={`flex items-center justify-center w-6 h-6`}>
              {getIcon(item.icon, isActive)}
            </div>
            <span
              suppressHydrationWarning
              className="w-full text-center px-1 mt-1 text-[10px] leading-[14px] font-normal whitespace-nowrap tracking-tight"
            >
              {item.label}
            </span>
          </div>
        ) : (
          <Link
            suppressHydrationWarning
            href={item.protected && !isUserAuthenticated ? '/signin' : item.path}
            title={item.label}
            className={`w-full outline-none flex items-center justify-start ${isCollapsed
              ? 'flex-col items-center justify-center h-[72px] py-4 px-0 rounded-xl transition-colors duration-200'
              : 'py-2.5 rounded-xl'
              } ${isActive
                ? isCollapsed 
                  ? 'text-zinc-900 hover:bg-zinc-100/80'
                  : 'bg-[#f2f2f2] text-zinc-900 hover:bg-[#e5e5e5]'
                : isCollapsed
                  ? 'text-zinc-700 hover:bg-zinc-100/80'
                  : 'text-zinc-700 hover:bg-[#f2f2f2] hover:text-zinc-900'
              }`}
            style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: '14px', fontWeight: 400, gap: isCollapsed ? 0 : '24px', paddingLeft: isCollapsed ? 0 : '12px' }}
            onMouseEnter={(e) => {
              // Close You menu when hovering other items
              if (isYouMenuOpen) {
                setIsYouMenuOpen(false);
                setIsYouMenuSticky(false);
                setHoveredItem(null);
                if (youMenuTimeoutRef.current) clearTimeout(youMenuTimeoutRef.current);
              }
              setHoveredItem({ label: item.label, top: e.currentTarget.getBoundingClientRect().top });
            }}
            onMouseLeave={() => {
              setHoveredItem(null);
            }}
          >
          <div suppressHydrationWarning className={`flex items-center justify-center w-6 h-6`}>
            {getIcon(item.icon, isActive)}
          </div>
          <span
            suppressHydrationWarning
            className={`${isCollapsed ? 'text-[10px] leading-[14px] font-normal whitespace-nowrap tracking-tight' : ''}`}
          >
            {item.label}
          </span>
        </Link>
        )}
      </li>
    );
  };

  return (
    <>
      <aside
        suppressHydrationWarning
        className={`fixed left-0 top-14 h-[calc(100vh-56px)] bg-white/80 backdrop-blur-sm overflow-y-auto hidden lg:block z-[101] sidebar-scrollbar ${isCollapsed ? 'w-[72px]' : 'w-64'
          }`}
      >
      <div suppressHydrationWarning className={`py-2 w-full ${isCollapsed ? 'px-0' : 'px-3'}`}>
        {/* Main Items - Always visible */}
        {isCollapsed ? (
          // Collapsed: Show exactly 4 items - Home, Styles, Subscriptions, You
          <ul suppressHydrationWarning className="space-y-0">
            {mainItems.map(renderItem)}
          </ul>
        ) : (
          // Expanded: Full sidebar
          <>
            <ul suppressHydrationWarning className="mb-3">
              {mainItems.map(renderItem)}
            </ul>
            
            <ul suppressHydrationWarning className="mb-3">
              <li key="history" suppressHydrationWarning className="relative group list-none w-full">
                <Link
                  suppressHydrationWarning
                  href="/history"
                  title="History"
                  className="w-full outline-none flex items-center justify-start py-2.5 rounded-xl text-zinc-700 hover:text-zinc-900 hover:bg-[#f2f2f2]"
                  style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: '14px', fontWeight: 400, gap: '24px', paddingLeft: '12px' }}
                >
                  <div suppressHydrationWarning className="flex items-center justify-center w-6 h-6">
                    <svg className="w-6 h-6 text-zinc-900" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span>History</span>
                </Link>
              </li>
            </ul>

            {isUserAuthenticated && (
              <>
                <div suppressHydrationWarning className="h-px my-3 mx-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }} />

                <div suppressHydrationWarning className="flex items-center space-x-2 px-3 py-2 mb-1 group cursor-pointer hover:bg-zinc-200/80 rounded-xl transition-colors">
                  <span className="text-[16px] font-bold text-zinc-900">You</span>
                  <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <ul suppressHydrationWarning className="space-y-0.5">
                  {youItems.map(renderItem)}
                </ul>

                <div suppressHydrationWarning className="h-px my-3 mx-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }} />
                
                <ul suppressHydrationWarning className="space-y-0.5">
                  {subscriptionItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <li key={item.path} suppressHydrationWarning className="relative group list-none w-full flex items-center">
                        <Link
                          suppressHydrationWarning
                          href={item.protected && !isUserAuthenticated ? '/signin' : item.path}
                          title={item.label}
                          className={`flex-1 transition-all duration-200 outline-none flex items-center justify-start py-2.5 rounded-xl ${
                            isActive ? 'bg-[#f2f2f2] text-zinc-900' : 'text-zinc-700 hover:text-zinc-900 hover:bg-[#f2f2f2]'
                          }`}
                          style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: '14px', fontWeight: 400, gap: '24px', paddingLeft: '12px' }}
                        >
                          <div suppressHydrationWarning className="flex items-center justify-center transition-colors w-6 h-6 flex-shrink-0">
                            {getIcon(item.icon, isActive)}
                          </div>
                          <span suppressHydrationWarning className="truncate">
                            {item.label}
                          </span>
                        </Link>
                        <button
                          onClick={(e) => { e.preventDefault(); setSubscriptionsExpanded(!subscriptionsExpanded); }}
                          className="p-2 hover:bg-zinc-100 rounded mr-1"
                        >
                          <svg 
                            className={`w-4 h-4 text-zinc-700 transition-transform ${subscriptionsExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {subscriptionsExpanded && (
                  <div className="ml-4 pl-4 border-l border-zinc-200 space-y-0.5">
                    {userSubscriptions.length > 0 ? (
                      userSubscriptions.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/channel/${sub.id}`}
                          title={sub.name}
                          className="flex items-center justify-start gap-3 py-2 text-zinc-700 hover:text-zinc-900 hover:bg-[#f2f2f2] rounded-xl transition-colors"
                          style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: '14px', fontWeight: 400, paddingLeft: '12px' }}
                        >
                          <div className="w-6 h-6 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0">
                            {sub.avatar ? (
                              <img src={sub.avatar} alt={sub.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                                {sub.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-[13px] text-gray-500">No subscriptions yet</p>
                    )}
                  </div>
                )}
              </>
            )}

            {!isUserAuthenticated && (
              <>
                <div suppressHydrationWarning className="h-px my-3 mx-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }} />
                <div className="px-3 py-2 mx-3 mb-4">
                  <p className="text-[14px] text-[#0f0f0f] mb-3 leading-relaxed font-normal" style={{ fontFamily: 'Roboto, Arial, sans-serif' }}>
                    Sign in to like videos, comment, and subscribe.
                  </p>
                  <Link
                    href="/signin"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-[#ccc] bg-transparent text-[#065fd4] hover:bg-zinc-200/80 transition-all font-medium text-sm w-fit"
                    style={{ borderRadius: '20px', fontWeight: 500 }}
                  >
                    <svg className="w-5 h-5 text-[#065fd4]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Sign in
                  </Link>
                </div>
              </>
            )}

            <div suppressHydrationWarning className="h-px my-3 mx-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }} />

            <div suppressHydrationWarning className="px-3 py-2">
              <h3 className="text-[16px] font-bold text-zinc-900 mb-1">Explore</h3>
            </div>
            <ul suppressHydrationWarning className="space-y-0.5">
              {exploreItems.map(renderItem)}
            </ul>

            <div suppressHydrationWarning className="h-px my-3 mx-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }} />

            <div suppressHydrationWarning className="px-3 py-2" style={{ padding: '16px 24px' }}>
              <p className="text-[13px] text-[#606060] leading-relaxed mb-4" style={{ fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 500, lineHeight: '1.4' }}>
                <Link href="/about" className="hover:underline">About</Link> Press Copyright Contact us Creators Advertise Developers
              </p>
              <p className="text-[13px] text-[#606060] leading-relaxed mb-4" style={{ fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 500, lineHeight: '1.4' }}>
                Terms Privacy Policy & Safety How Playra works Test new features
              </p>
              <p className="text-[13px] text-[#717171] leading-relaxed" style={{ fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 400, lineHeight: '1.4' }}>
                © {new Date().getFullYear()} Codedwaves
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
      {isCollapsed && isYouMenuOpen && hoveredItem && isSignedIn && (
        <div 
          data-you-menu="true"
          className="fixed left-[76px] bg-white rounded-2xl shadow-2xl z-[200] w-56 py-3 transition-opacity duration-200"
          style={{ top: hoveredItem.top, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}
          onMouseEnter={() => {
            if (youMenuTimeoutRef.current) clearTimeout(youMenuTimeoutRef.current);
            setIsYouMenuSticky(true);
          }}
          onMouseLeave={() => {
            // Don't hide on mouse leave when in sticky state
            // Only hide on click outside (handled by global listener)
          }}
        >
          <div className="px-4 py-2 mb-1">
            <span className="font-bold text-zinc-900 text-sm">You</span>
          </div>
          <div className="flex flex-col">
            <Link href="/history" className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 text-zinc-700">
                <path d="M320 128C426 128 512 214 512 320C512 426 426 512 320 512C254.8 512 197.1 479.5 162.4 429.7C152.3 415.2 132.3 411.7 117.8 421.8C103.3 431.9 99.8 451.9 109.9 466.4C156.1 532.6 233 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C234.3 64 158.5 106.1 112 170.7L112 144C112 126.3 97.7 112 80 112C62.3 112 48 126.3 48 144L48 256C48 273.7 62.3 288 80 288L104.6 288C105.1 288 105.6 288 106.1 288L192.1 288C209.8 288 224.1 273.7 224.1 256C224.1 238.3 209.8 224 192.1 224L153.8 224C186.9 166.6 249 128 320 128zM344 216C344 202.7 333.3 192 320 192C306.7 192 296 202.7 296 216L296 320C296 326.4 298.5 332.5 303 337L375 409C384.4 418.4 399.6 418.4 408.9 409C418.2 399.6 418.3 384.4 408.9 375.1L343.9 310.1L343.9 216z"/>
              </svg>
              <span>History</span>
            </Link>
            <Link href="/playlists" className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="7" x2="19" y2="7" />
                <line x1="4" y1="12" x2="19" y2="12" />
                <line x1="4" y1="17" x2="11" y2="17" />
                <path d="M14.5 13.5 L21.5 17 L14.5 20.5 Z" fill="currentColor" strokeWidth="1" strokeLinejoin="round" />
              </svg>
              <span>Playlists</span>
            </Link>
            <Link href="/watch-later" className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Watch later</span>
            </Link>
            <Link href="/liked" className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5 text-zinc-700">
                <path d="M235.5 102.8C256.3 68 300.5 54 338 71.6L345.2 75.4C380 96.3 394 140.5 376.4 178L376.4 178L362.3 208L472 208L479.4 208.4C515.7 212.1 544 242.8 544 280C544 293.2 540.4 305.4 534.2 316C540.3 326.6 543.9 338.8 544 352C544 370.3 537.1 386.8 526 399.5C527.3 404.8 528 410.3 528 416C528 441.1 515.1 463 495.8 475.9C493.9 511.4 466.4 540.1 431.4 543.6L424 544L319.9 544C301.9 544 284 540.6 267.3 534.1L260.2 531.1L259.5 530.8L252.9 527.6L252.2 527.3L240 520.8C227.7 514.3 216.7 506.1 207.1 496.7C203 523.6 179.8 544.1 151.8 544.1L119.8 544.1C88.9 544.1 63.8 519 63.8 488.1L64 264C64 233.1 89.1 208 120 208L152 208C162.8 208 172.9 211.1 181.5 216.5L231.6 110L232.2 108.8L234.9 103.8L235.5 102.9zM120 256C115.6 256 112 259.6 112 264L112 488C112 492.4 115.6 496 120 496L152 496C156.4 496 160 492.4 160 488L160 264C160 259.6 156.4 256 152 256L120 256zM317.6 115C302.8 108.1 285.3 113.4 276.9 127L274.7 131L217.9 251.9C214.4 259.4 212.4 267.4 211.9 275.6L211.8 279.8L211.8 392.7L212 400.6C214.4 433.3 233.4 462.7 262.7 478.3L274.2 484.4L280.5 487.5C292.9 493.1 306.3 496 319.9 496L424 496L426.4 495.9C438.5 494.7 448 484.4 448 472L447.8 469.4C447.7 468.5 447.6 467.7 447.4 466.8C444.7 454.7 451.7 442.6 463.4 438.8C473.1 435.7 480 426.6 480 416C480 411.7 478.9 407.8 476.9 404.2C470.6 393.1 474.1 379 484.9 372.2C491.7 367.9 496.1 360.4 496.1 352C496.1 344.9 493 338.5 487.9 334C482.7 329.4 479.7 322.9 479.7 316C479.7 309.1 482.7 302.6 487.9 298C493 293.5 496.1 287.1 496.1 280L496 277.6C494.9 266.3 485.9 257.3 474.6 256.2L472.2 256.1L324.7 256.1C316.5 256.1 308.9 251.9 304.5 245C300.1 238.1 299.5 229.3 303 221.9L333 157.6C340 142.6 334.4 124.9 320.5 116.6L317.6 115z"/>
              </svg>
              <span>Liked videos</span>
            </Link>
            <Link href="/download" className="flex items-center gap-3 px-4 py-2 text-zinc-700 hover:bg-zinc-100 transition-colors text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              <span>Downloads</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
