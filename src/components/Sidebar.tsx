'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarProps = {
  isCollapsed: boolean;
};

export default function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { icon: 'home', label: 'Home', path: '/' },
    { icon: 'trending', label: 'Trending', path: '/trending' },
    { icon: 'subscriptions', label: 'Subscriptions', path: '/subscriptions' },
    { icon: 'library', label: 'Library', path: '/library' },
  ];

  const libraryItems = [
    { icon: 'history', label: 'History', path: '/history' },
    { icon: 'liked', label: 'Liked videos', path: '/liked' },
    { icon: 'watchLater', label: 'Watch later', path: '/watch-later' },
  ];

  const getIcon = (icon: string) => {
    const icons: { [key: string]: JSX.Element } = {
      home: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      trending: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      subscriptions: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      library: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      history: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      liked: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      watchLater: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };
    return icons[icon] || icons.home;
  };

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-gray-900 overflow-y-auto hidden lg:block transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className={`py-4 ${isCollapsed ? 'px-2' : ''}`}>
        <ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`rounded-lg transition-colors ${
                  isCollapsed
                    ? 'flex flex-col items-center gap-1 py-3'
                    : 'flex items-center space-x-3 px-3 py-2'
                } ${
                  pathname === item.path
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {getIcon(item.icon)}
                <span className={isCollapsed ? 'text-xs' : ''}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {!isCollapsed && (
          <>
            <div className="border-t border-gray-800 my-4 mx-3"></div>

            <ul className="space-y-1 px-3">
              <li className="px-3 py-2 text-gray-400 text-sm font-medium">Library</li>
              {libraryItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      pathname === item.path
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {getIcon(item.icon)}
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-800 my-4 mx-3"></div>

            <div className="px-3 py-4">
              <p className="text-sm text-gray-400 mb-3">
                Sign in to like videos, comment, and subscribe.
              </p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sign in
              </button>
            </div>
          </>
        )}

        {isCollapsed && (
          <div className="mt-4 flex justify-center">
            <button
              aria-label="Sign in"
              className="w-10 h-10 rounded-full text-gray-300 flex items-center justify-center hover:bg-gray-800 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
