'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'playra_sidebar_collapsed';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const pathname = usePathname();
  const isStylesPage = pathname?.startsWith('/styles');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsSidebarCollapsed(stored === 'true');
    }
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-50">
          <button
            aria-label="Menu"
            className="p-2 rounded-full hover:bg-gray-800 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            href="/downloads"
            className="text-sm px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500"
          >
            Downloads
          </Link>
        </div>

        <main className="pt-24 px-6 flex flex-col items-center justify-center text-center">
          <img
            src="/network-wireless-offline-svgrepo-com.svg"
            alt="Offline"
            className="w-40 h-40 mb-6 opacity-90"
          />
          <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
          <p className="text-gray-400 mt-2 max-w-md">
            Connect to the internet to load videos. You can still watch saved content.
          </p>
          <Link
            href="/downloads"
            className="mt-6 text-sm px-5 py-2 rounded-full border border-gray-700 hover:bg-gray-800"
          >
            Watch downloads
          </Link>
        </main>
      </div>
    );
  }

  if (isStylesPage) {
    return <main className="min-h-screen bg-[#0f0f0f] text-white">{children}</main>;
  }

  return (
    <>
      <Navbar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <main
          className={`flex-1 pt-16 min-h-screen transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {children}
        </main>
      </div>
    </>
  );
}
