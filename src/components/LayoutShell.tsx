'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import MobileDrawer from '@/components/MobileDrawer';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY = 'playra_sidebar_collapsed';


interface LayoutShellProps {
  children: React.ReactNode;
  activeProfile: any; // Using any to avoid complex type imports for now, or define a basic shape
}

export default function LayoutShell({ children, activeProfile }: LayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const isStylesPage = pathname?.startsWith('/styles');
  const isStudio = pathname?.startsWith('/studio');

  useEffect(() => {
    setMounted(true);

    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsSignedIn(true);
        setUser(user);
      } else {
        setIsSignedIn(false);
        setUser(null);
      }
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsSidebarCollapsed(stored === 'true');
    } else {
      setIsSidebarCollapsed(true);
    }

    return () => unsubscribeAuth();
  }, []);

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
    // If we have an active profile, maybe go to profile page or account settings
    // For now, if signed in, go to account
    if (isSignedIn) {
      router.push('/set-account');
    } else {
      router.push('/signin');
    }
  };

  const isAuthPage = pathname === '/signin' || pathname === '/set-account' || pathname === '/select-profile' || pathname === '/privacy' || pathname === '/terms' || pathname === '/help';

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-50">
          <button className="p-2 rounded-full hover:bg-gray-800 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <img src="/Playra.png" alt="Playra" className="h-6 w-auto brightness-200" />
          <div className="w-10" />
        </div>
        <div className="pt-32 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-6.364-2.637m4.95-4.95a3 3 0 010-4.243m0 0L2.122 2.122m5.657 5.657L5.657 5.657" /></svg>
          </div>
          <h2 className="text-2xl font-black mb-4">No connection</h2>
          <p className="text-gray-400 mb-8 max-w-sm">Connect to the internet to continue exploring Playra's next-gen discovery.</p>
          <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-3 rounded-full font-black text-sm active:scale-95 transition-all">Retry</button>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <main className="min-h-screen bg-black">{children}</main>;
  }

  // Studio pages have their own shell; avoid double nav/sidebars
  if (isStudio) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        isSignedIn={isSignedIn}
        onToggleSignIn={handleToggleSignIn}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
        activeProfile={activeProfile}
      />

      <div className="flex bg-gray-900 min-h-screen">
        <Sidebar isCollapsed={isSidebarCollapsed} isSignedIn={isSignedIn} activeProfile={activeProfile} />

        <main
          className={`flex-1 pt-14 sm:pt-16 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
            } pb-[96px] lg:pb-0`}
        >
          {children}
        </main>
      </div>

      <MobileNav
        isSignedIn={isSignedIn}
        userAvatar={user?.photoURL || ""}
      />

      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        isSignedIn={isSignedIn}
      />
    </>
  );
}

