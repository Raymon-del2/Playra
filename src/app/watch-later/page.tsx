'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchWatchLaterVideos, removeFromWatchLater } from '@/app/actions/watch-later';
import { getActiveProfile } from '@/app/actions/profile';
import { formatDistanceToNow } from 'date-fns';

interface WatchLaterVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: string;
  views: number;
  created_at: string;
  category: string;
  is_live: boolean;
  is_short?: boolean;
  channel_id: string;
  channel_name: string;
  channel_avatar: string;
  saved_at: string;
}

function highlightText(text: string, searchQuery: string) {
  if (!searchQuery.trim()) return text;

  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-blue-500/30 text-blue-200 px-0.5 rounded">
        {part}
      </span>
    ) : part
  );
}

export default function WatchLaterPage() {
  const [videos, setVideos] = useState<WatchLaterVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get active profile (channel) ID - watch later is stored by profile ID
        const profile = await getActiveProfile();
        if (profile) {
          setProfileId(profile.id);
          await loadWatchLater(profile.id);
        } else {
          // No profile selected, redirect to select profile
          router.push('/select-profile');
        }
      } else {
        router.push('/signin');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadWatchLater = async (uid: string) => {
    try {
      setIsLoading(true);
      const result = await fetchWatchLaterVideos(uid);
      if (result.success) {
        setVideos(result.videos as WatchLaterVideo[]);
      }
    } catch (error) {
      console.error('Failed to load watch later:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (videoId: string) => {
    if (!profileId) return;
    try {
      const result = await removeFromWatchLater(videoId, profileId);
      if (result.success) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
      }
    } catch (error) {
      console.error('Failed to remove from watch later:', error);
    }
  };

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;

    const query = searchQuery.toLowerCase();
    return videos.filter(video =>
      video.title?.toLowerCase().includes(query) ||
      video.channel_name?.toLowerCase().includes(query) ||
      video.category?.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return `${views}`;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(e.target.value.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Watch Later</h1>
                <p className="text-sm text-zinc-500">{videos.length} videos</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search your watch later..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
              {isSearching && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="w-5 h-5 text-zinc-500 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Search Stats */}
          {isSearching && (
            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
              <span>Found {filteredVideos.length} result{filteredVideos.length !== 1 ? 's' : ''}</span>
              {filteredVideos.length > 0 && (
                <span className="text-purple-400">• Matching &quot;{searchQuery}&quot;</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-zinc-800 rounded-xl mb-3" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No watch later videos</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-6">
              Videos you save to watch later will appear here. Start exploring and save videos you want to watch!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Browse Videos
            </Link>
          </div>
        ) : filteredVideos.length === 0 && isSearching ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No results found</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-4">
              No videos match &quot;{searchQuery}&quot;. Try a different search term.
            </p>
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <div key={video.id} className="group flex flex-col">
                <div className={`relative ${video.is_short ? 'aspect-[9/16]' : 'aspect-video'} rounded-xl overflow-hidden bg-zinc-800 mb-3 shadow-lg border border-white/5`}>
                  <Link href={video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`}>
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  {video.duration && video.duration !== '0:00' && video.duration !== '00:00' && video.duration !== '0' && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                      {video.duration}
                    </div>
                  )}
                  {video.is_short && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                      <img src="/styles-icon.svg?v=white" className="w-4 h-4 drop-shadow-md" alt="" />
                    </div>
                  )}
                  {video.is_live && (
                    <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Live
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(video.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove from watch later"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-3">
                  <Link href={`/channel/${video.channel_id}`}>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                      {video.channel_avatar ? (
                        <img src={video.channel_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-500">
                          {video.channel_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`}>
                      <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug">
                        {isSearching ? highlightText(video.title, searchQuery) : video.title}
                      </h3>
                    </Link>
                    <Link href={`/channel/${video.channel_id}`}>
                      <p className="text-xs text-zinc-400 hover:text-white transition-colors mt-1">
                        {isSearching ? highlightText(video.channel_name, searchQuery) : video.channel_name}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                      <span>{formatViews(video.views)} views</span>
                      <span>•</span>
                      <span>Saved {formatDistanceToNow(new Date(video.saved_at), { addSuffix: true })}</span>
                    </div>
                    {video.category && (
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          isSearching && video.category.toLowerCase().includes(searchQuery.toLowerCase())
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {isSearching && video.category.toLowerCase().includes(searchQuery.toLowerCase())
                            ? highlightText(video.category, searchQuery)
                            : video.category
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
