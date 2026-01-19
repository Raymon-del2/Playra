'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/hooks/useLocation';

type NavbarProps = {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export default function Navbar({ isSidebarCollapsed, onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const countryCode = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestions = [
    'Next.js tutorial',
    'React hooks',
    'TypeScript tips',
    'CSS grid layout',
    'Node.js API',
    'Machine learning basics',
    'Web performance',
  ];
  const filteredSuggestions = useMemo(
    () =>
      suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery],
  );

  const handleSearch = (query = searchQuery) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/results?search_query=${encodeURIComponent(trimmed)}`);
    setIsDropdownOpen(false);
  };
  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleSidebar}
              aria-label={isSidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
              className="p-2 rounded-full hover:bg-gray-800 text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/" className="flex items-start space-x-1">
              <img src="/Playra.png" alt="Playra" className="h-8 w-auto" />
              <span className="text-[10px] text-gray-400 leading-none mt-1">{countryCode}</span>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => {
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current);
                  }
                  setIsDropdownOpen(true);
                }}
                onBlur={() => {
                  blurTimeoutRef.current = setTimeout(() => {
                    setIsDropdownOpen(false);
                  }, 150);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
                className="w-full bg-gray-800 text-white pl-4 pr-16 py-2 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500"
              />
              {searchQuery.length > 0 && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => handleSearch()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {isDropdownOpen && searchQuery.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-2xl shadow-lg overflow-hidden">
                  {filteredSuggestions.length > 0 ? (
                    <ul className="py-2">
                      {filteredSuggestions.map((suggestion) => (
                        <li key={suggestion}>
                          <button
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setIsDropdownOpen(false);
                              handleSearch(suggestion);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800"
                          >
                            {suggestion}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleSearch(searchQuery);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-200 hover:bg-gray-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search for “{searchQuery}”
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/upload" className="text-white hover:text-gray-300 flex items-center space-x-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <Link href="/studio" className="text-white hover:text-gray-300 flex items-center space-x-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Studio</span>
            </Link>
            <button
              className={`flex items-center gap-2 rounded-full text-sm transition-colors ${
                isSidebarCollapsed
                  ? 'p-2 text-gray-300 hover:bg-gray-800 hover:text-white'
                  : 'px-4 py-2 bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {!isSidebarCollapsed && <span>Sign in</span>}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
