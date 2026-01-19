'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const filters = [
  'All',
  'Styles',
  'Videos',
  'Unwatched',
  'Watched',
  'Recently uploaded',
  'Live',
  'Playlists',
  'Channels',
  '4K',
  'HD',
  'Subtitles',
];

type ResultItem = {
  id: string;
  title: string;
  thumbnail: string;
  previewVideo?: string;
  channel: string;
  channelAvatar: string;
  views: string;
  timestamp: string;
  type?: 'video' | 'channel' | 'playlist';
  uploadedDays?: number;
  watched?: boolean;
  duration: string;
  description: string;
  badges: string[];
  format?: 'styles';
};

const results: ResultItem[] = [
  {
    id: 'r1',
    title: 'Next.js in 100 Seconds // Plus Full Beginner\'s Tutorial',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Fireship',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop',
    views: '1.4M views',
    timestamp: '5 years ago',
    type: 'video',
    uploadedDays: 1825,
    watched: true,
    duration: '11:52',
    description:
      'Learn the basics of Next.js in 100 Seconds! Then build your first server-rendered React app with a full Next.js beginner\'s tutorial.',
    badges: ['Sponsored', 'Sourcegraph', 'HD'],
  },
  {
    id: 'r2',
    title: 'Next.js 14 Crash Course - App Router, Server Actions, and More',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Coding Garden',
    channelAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=64&h=64&fit=crop',
    views: '823K views',
    timestamp: '8 months ago',
    type: 'video',
    uploadedDays: 240,
    watched: false,
    duration: '1:32:10',
    description:
      'A complete crash course covering the App Router, Server Components, data fetching, and deployment in Next.js 14.',
    badges: ['New', 'Subtitles'],
  },
  {
    id: 'r8',
    title: 'React Hooks in One Minute #shorts',
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=360&h=640&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Hooks Lab',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop',
    views: '1.1M views',
    timestamp: '2 weeks ago',
    type: 'video',
    uploadedDays: 14,
    watched: false,
    duration: '0:58',
    description: 'Quick hook tips: state updates, dependencies, and clean effects in under a minute.',
    badges: ['Short'],
    format: 'styles',
  },
  {
    id: 'r9',
    title: 'useEffect Cleanup Explained #shorts',
    thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=360&h=640&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Dev Clips',
    channelAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop',
    views: '742K views',
    timestamp: '1 month ago',
    type: 'video',
    uploadedDays: 30,
    watched: true,
    duration: '0:45',
    description: 'Learn why cleanup functions matter and how to avoid stale effects in React.',
    badges: ['Short'],
    format: 'styles',
  },
  {
    id: 'r10',
    title: 'React Hooks Masterclass (Playlist)',
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Hooks Lab',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop',
    views: '12 videos',
    timestamp: 'Playlist',
    type: 'playlist',
    uploadedDays: 10,
    watched: false,
    duration: '',
    description: 'A full playlist covering React hooks from basics to advanced patterns.',
    badges: ['Playlist', 'HD'],
  },
  {
    id: 'r11',
    title: 'Hooks Lab — Channel',
    thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Hooks Lab',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop',
    views: '250K subscribers',
    timestamp: 'Channel',
    type: 'channel',
    uploadedDays: 400,
    watched: true,
    duration: '',
    description: 'Official channel featuring weekly React hook lessons and live Q&A sessions.',
    badges: ['Channel', 'Subtitles'],
  },
  {
    id: 'r6',
    title: 'React Hooks Explained: useState, useEffect, useMemo, useRef',
    thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Hooks Lab',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop',
    views: '972K views',
    timestamp: '10 months ago',
    type: 'video',
    uploadedDays: 300,
    watched: false,
    duration: '28:44',
    description:
      'Master React hooks with real examples: state, effects, memoization, refs, and custom hooks for clean components.',
    badges: ['Tutorial', 'HD'],
  },
  {
    id: 'r7',
    title: 'React Hooks in 15 Minutes (useEffect Patterns & Pitfalls)',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Frontend Focus',
    channelAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop',
    views: '640K views',
    timestamp: '4 months ago',
    type: 'video',
    uploadedDays: 120,
    watched: true,
    duration: '15:02',
    description:
      'Quick guide to React hooks, dependency arrays, cleanup functions, and common useEffect mistakes.',
    badges: ['Popular', 'Subtitles'],
  },
  {
    id: 'r3',
    title: 'Why Next.js is the Best React Framework in 2025',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Frontend Focus',
    channelAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=64&h=64&fit=crop',
    views: '312K views',
    timestamp: '3 weeks ago',
    type: 'video',
    uploadedDays: 21,
    watched: false,
    duration: '24:06',
    description:
      'A deep dive into Next.js performance, DX, and why teams pick it for production apps at scale.',
    badges: ['Trending', 'HD'],
  },
  {
    id: 'r4',
    title: 'Next.js App Router Explained (Full Walkthrough)',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'The Reactors',
    channelAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=64&h=64&fit=crop',
    views: '502K views',
    timestamp: '2 months ago',
    type: 'video',
    uploadedDays: 60,
    watched: true,
    duration: '42:08',
    description:
      'Step-by-step guide to App Router, layouts, loading UI, and server actions. Perfect for experienced React devs.',
    badges: ['Live'],
  },
  {
    id: 'r5',
    title: 'Next.js vs Remix: Which Should You Choose?',
    thumbnail: 'https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?w=640&h=360&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Dev Showdown',
    channelAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=64&h=64&fit=crop',
    views: '215K views',
    timestamp: '6 months ago',
    type: 'video',
    uploadedDays: 180,
    watched: false,
    duration: '19:33',
    description:
      'Comparing Next.js and Remix with real-world demos, performance benchmarks, and deployment costs.',
    badges: ['4K', 'HD'],
  },
];

function ResultCard({ item }: { item: ResultItem }) {
  const isStyles = item.format === 'styles';
  const previewSrc = item.previewVideo;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleMouseEnter = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    const playPromise = videoRef.current.play();
    if (playPromise) {
      playPromise.catch(() => undefined);
    }
  };

  const handleMouseLeave = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  return (
    <Link
      key={item.id}
      href={isStyles ? `/styles/${item.id}` : `/watch/${item.id}`}
      className="flex flex-col lg:flex-row gap-4 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`relative flex-shrink-0 ${
          isStyles ? 'bg-[#5a4a2f] rounded-2xl p-3' : ''
        }`}
      >
        <div className="relative">
          {previewSrc && (
            <video
              ref={videoRef}
              src={previewSrc}
              loop
              muted
              playsInline
              preload="metadata"
              className={
                isStyles
                  ? 'absolute inset-0 w-full h-full object-cover rounded-xl opacity-0 group-hover:opacity-100 transition-opacity'
                  : 'absolute inset-0 w-full h-full object-cover rounded-xl opacity-0 group-hover:opacity-100 transition-opacity'
              }
            />
          )}
          <img
            src={item.thumbnail}
            alt={item.title}
            className={
              isStyles
                ? 'w-full sm:w-56 aspect-[9/16] object-cover rounded-xl transition-opacity group-hover:opacity-0'
                : 'w-full lg:w-96 aspect-video object-cover rounded-xl group-hover:rounded-lg transition-all duration-200 group-hover:opacity-0'
            }
          />
        </div>
        {isStyles ? (
          <span className="absolute bottom-4 right-4 bg-[#2f2516]/80 text-white text-[10px] px-2 py-1 rounded-full tracking-wide">
            STYLES
          </span>
        ) : item.duration ? (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {item.duration}
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>
          <button className="ml-auto text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
          <span>{item.views}</span>
          <span>•</span>
          <span>{item.timestamp}</span>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <img
            src={item.channelAvatar}
            alt={item.channel}
            className="w-9 h-9 rounded-full object-cover"
          />
          <span className="text-sm text-gray-300">{item.channel}</span>
        </div>

        <p className="text-sm text-gray-400 mt-3 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center gap-2 mt-3">
          {item.badges.map((badge) => (
            <span
              key={badge}
              className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-200"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('search_query') ?? '';
  const queryLabel = query.trim() || 'All';
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredResults = useMemo(() => {
    let items = results;
    if (query.trim()) {
      const lower = query.toLowerCase();
      items = items.filter((item) =>
        [item.title, item.channel, item.description].some((field) =>
          field.toLowerCase().includes(lower),
        ),
      );
    }
    if (activeFilter !== 'All') {
      switch (activeFilter) {
        case 'Styles':
          items = items.filter((item) => item.format === 'styles');
          break;
        case 'Videos':
          items = items.filter(
            (item) => item.type !== 'channel' && item.type !== 'playlist' && item.format !== 'styles',
          );
          break;
        case 'Unwatched':
          items = items.filter((item) => item.watched === false);
          break;
        case 'Watched':
          items = items.filter((item) => item.watched === true);
          break;
        case 'Recently uploaded':
          items = items.filter((item) => (item.uploadedDays ?? Infinity) <= 30);
          break;
        case 'Live':
          items = items.filter((item) => item.badges.includes('Live'));
          break;
        case 'Playlists':
          items = items.filter((item) => item.type === 'playlist');
          break;
        case 'Channels':
          items = items.filter((item) => item.type === 'channel');
          break;
        case '4K':
          items = items.filter((item) => item.badges.includes('4K'));
          break;
        case 'HD':
          items = items.filter((item) => item.badges.includes('HD'));
          break;
        case 'Subtitles':
          items = items.filter((item) => item.badges.includes('Subtitles'));
          break;
        default:
          break;
      }
    }
    return items;
  }, [query, activeFilter]);

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === activeFilter
                ? 'bg-white text-gray-900'
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="space-y-8">
        {filteredResults.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
            <video
              src="/No-results.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full md:w-72 rounded-xl"
            />
            <div>
              <p className="text-lg font-semibold mb-2">No results for "{queryLabel}"</p>
              <p className="text-gray-400">
                Try different keywords or check your spelling.
              </p>
            </div>
          </div>
        ) : (
          filteredResults.map((item) => <ResultCard key={item.id} item={item} />)
      )}
      </div>
    </div>
  );
}
