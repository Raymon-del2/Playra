'use client';

import { useEffect, useState } from 'react';
import { getTrendingVideos, getTopChannels, Video } from '@/lib/supabase';
import Link from 'next/link';

const categories = ['Trending', 'Gaming', 'Music', 'Live', 'News', 'Sports', 'Technology', 'Entertainment'];

export default function ExplorePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Trending');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [videosData, channelsData] = await Promise.all([
          getTrendingVideos(50),
          getTopChannels(20)
        ]);
        setVideos(videosData || []);
        setChannels(channelsData || []);
      } catch (err) {
        console.error('Failed to load explore data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredVideos = selectedCategory === 'Trending' 
    ? videos 
    : videos.filter(v => v.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-black text-white pt-14 pb-20 lg:pb-8">
      <div className="sticky top-14 z-40 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 overflow-x-auto px-4 py-3 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {selectedCategory === 'Trending' && (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.56 21c-.29 0-.58-.07-.82-.2l-7.44-4.02-4 6.52c-.38.62-1.19 1.04-1.96.7-3.58-1.57-6.02-4.93-6.45-8.47-.47-3.84 1.47-7.48 4.75-9.05C7.34 2.37 10.4 2 12.64 4.21c.43.42.67 1.02.67 1.65s-.24 1.23-.67 1.65c-.87.85-2.25.85-3.12 0-1.46-1.44-3.72-1.35-5.04.2-1.32 1.56-.9 4.04.94 5.55l7.44 4.02 4-6.52c.38-.62 1.19-1.04 1.96-.7l.12.06c.58.31.77.99.46 1.57l-.01.01z"/>
                </svg>
                Trending
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isLoading ? (
                  Array(8).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video bg-zinc-800 rounded-xl mb-2" />
                      <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  ))
                ) : (
                  filteredVideos.slice(0, 8).map((video) => (
                    <Link key={video.id} href={`/watch/${video.id}`} className="group">
                      <div className="aspect-video bg-zinc-800 rounded-xl mb-2 overflow-hidden relative">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {video.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-xs text-zinc-400">{video.channel_name}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Top Channels
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {channels.slice(0, 10).map((channel) => (
                  <Link key={channel.id} href={`/channel/${channel.id}`} className="flex flex-col items-center p-4 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 mb-3">
                      {channel.avatar_url ? (
                        <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-400">
                          {channel.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white text-center line-clamp-1">{channel.name}</span>
                    <span className="text-xs text-zinc-400">{channel.subscribers?.toLocaleString()} subscribers</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedCategory !== 'Trending' && (
          <div>
            <h2 className="text-xl font-bold mb-4">{selectedCategory}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-video bg-zinc-800 rounded-xl mb-2" />
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                ))
              ) : filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <Link key={video.id} href={`/watch/${video.id}`} className="group">
                    <div className="aspect-video bg-zinc-800 rounded-xl mb-2 overflow-hidden relative">
                      {video.thumbnail_url && (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      )}
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {video.duration}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-zinc-400">{video.channel_name}</p>
                  </Link>
                ))
              ) : (
                <p className="text-zinc-500 col-span-full text-center py-8">No videos found in {selectedCategory}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
