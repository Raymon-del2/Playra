'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getVideos, getTopChannels, Video, Channel } from '@/lib/supabase';

export default function TVPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedSection, setFocusedSection] = useState<'categories' | 'videos' | 'channels'>('categories');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', 'Music', 'Gaming', 'News', 'Live', 'Recently uploaded'];

  useEffect(() => {
    async function loadData() {
      try {
        const [videosData, channelsData] = await Promise.all([
          getVideos(50),
          getTopChannels(10)
        ]);
        console.log('TV page - Videos loaded:', videosData?.length);
        console.log('TV page - Channels loaded:', channelsData?.length);
        setVideos(videosData || []);
        setChannels(channelsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredVideos = videos.filter((v: Video) => {
    if (!v.video_url || v.video_url.trim() === '') return false;
    if (selectedCategory === 'All') return !v.is_short;
    if (selectedCategory === 'Music') return v.category === 'music';
    if (selectedCategory === 'Live') return v.is_live;
    if (selectedCategory === 'Recently uploaded') {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return new Date(v.created_at).getTime() > oneDayAgo;
    }
    return !v.is_short;
  });

  useEffect(() => {
    console.log('TV page - Total videos:', videos.length, 'Filtered:', filteredVideos.length);
  }, [filteredVideos, videos.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const maxIndex = focusedSection === 'categories' 
      ? categories.length - 1 
      : focusedSection === 'videos' 
        ? Math.min(filteredVideos.length - 1, 11)
        : channels.length - 1;

    switch (e.key) {
      case 'ArrowUp':
        if (focusedSection === 'videos' || focusedSection === 'channels') {
          setFocusedSection('categories');
        }
        break;
      case 'ArrowDown':
        if (focusedSection === 'categories') {
          setFocusedSection('videos');
          setSelectedIndex(0);
        }
        break;
      case 'ArrowLeft':
        if (focusedSection === 'categories') {
          setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (focusedSection === 'videos' && selectedIndex > 0) {
          setSelectedIndex(prev => prev - 1);
        } else if (focusedSection === 'channels' && selectedIndex > 0) {
          setSelectedIndex(prev => prev - 1);
        }
        break;
      case 'ArrowRight':
        if (focusedSection === 'categories') {
          setSelectedIndex(prev => Math.min(categories.length - 1, prev + 1));
        } else if (focusedSection === 'videos' && selectedIndex < Math.min(filteredVideos.length - 1, 11)) {
          setSelectedIndex(prev => prev + 1);
        } else if (focusedSection === 'channels' && selectedIndex < channels.length - 1) {
          setSelectedIndex(prev => prev + 1);
        }
        break;
      case 'Enter':
        if (focusedSection === 'categories') {
          setSelectedCategory(categories[selectedIndex]);
          setFocusedSection('videos');
          setSelectedIndex(0);
        }
        break;
    }
  }, [focusedSection, selectedIndex, categories, filteredVideos.length, channels.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <Link href="/tv" className="text-3xl font-bold text-red-500">PLAYRA TV</Link>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">Use arrow keys to navigate</span>
          <Link href="/" className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
            Switch to Web
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className={`px-8 py-4 flex gap-4 ${focusedSection === 'categories' ? 'bg-white/5' : ''}`}>
        {categories.map((cat, idx) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); setFocusedSection('videos'); setSelectedIndex(0); }}
            className={`px-6 py-3 rounded-xl text-lg font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-white text-black'
                : focusedSection === 'categories' && selectedIndex === idx
                  ? 'bg-zinc-700 text-white ring-2 ring-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="px-8 py-4">
        <h2 className="text-2xl font-bold mb-4">Videos</h2>
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredVideos.slice(0, 12).map((video, idx) => (
              <Link
                key={video.id}
                href={`/watch/${video.id}`}
                className={`block transition-all ${
                  focusedSection === 'videos' && selectedIndex === idx ? 'ring-4 ring-white scale-105' : ''
                }`}
                onMouseEnter={() => { if (focusedSection !== 'categories') { setSelectedIndex(idx); setFocusedSection('videos'); } }}
              >
                <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                  <img
                    src={video.thumbnail_url || '/default-thumbnail.jpg'}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-sm px-2 py-0.5 rounded">
                      {video.duration}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-white line-clamp-2">{video.title}</h3>
                  <p className="text-zinc-400 text-sm mt-1">{video.channel_name}</p>
                  <p className="text-zinc-500 text-sm">{video.views?.toLocaleString()} views</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-lg">No videos found</p>
        )}
      </div>

      {/* Channels */}
      <div className="px-8 py-4 pb-12">
        <h2 className="text-2xl font-bold mb-4">Popular Channels</h2>
        {channels.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {channels.map((channel, idx) => (
              <Link
                key={channel.id}
                href={`/channel/${channel.id}`}
                className={`flex-shrink-0 text-center transition-all ${
                  focusedSection === 'channels' && selectedIndex === idx ? 'ring-4 ring-white rounded-full' : ''
                }`}
                onMouseEnter={() => { setSelectedIndex(idx); setFocusedSection('channels'); }}
              >
                <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden mx-auto">
                  {channel.avatar ? (
                    <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-500">
                      {channel.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-white font-medium text-sm truncate w-24">{channel.name}</p>
                <p className="text-zinc-500 text-xs">{channel.subscribers?.toLocaleString()} subs</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-lg">No channels found</p>
        )}
      </div>
    </div>
  );
}
