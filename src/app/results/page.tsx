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
    id: 's1',
    title: 'CSS Grid in 60 Seconds 🔥',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=360&h=640&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'CSS Wizards',
    channelAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=64&h=64&fit=crop',
    views: '890K views',
    timestamp: '3 days ago',
    type: 'video',
    uploadedDays: 3,
    watched: false,
    duration: '0:59',
    description: 'Master CSS Grid layout in under a minute with this quick visual guide.',
    badges: ['Short'],
    format: 'styles',
  },
  {
    id: 's2',
    title: 'TypeScript Tips You Need #dev',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=360&h=640&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'TS Pro',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop',
    views: '1.5M views',
    timestamp: '1 week ago',
    type: 'video',
    uploadedDays: 7,
    watched: false,
    duration: '0:52',
    description: 'Quick TypeScript tips that will level up your code quality instantly.',
    badges: ['Short'],
    format: 'styles',
  },
  {
    id: 's3',
    title: 'useState vs useRef 💡',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=360&h=640&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'React Daily',
    channelAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop',
    views: '2.1M views',
    timestamp: '5 days ago',
    type: 'video',
    uploadedDays: 5,
    watched: true,
    duration: '0:48',
    description: 'Know when to use useState and when useRef is the better choice.',
    badges: ['Short'],
    format: 'styles',
  },
  {
    id: 's4',
    title: 'Tailwind Dark Mode Trick ✨',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=360&h=640&fit=crop',
    previewVideo: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    channel: 'Design Code',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop',
    views: '650K views',
    timestamp: '2 weeks ago',
    type: 'video',
    uploadedDays: 14,
    watched: false,
    duration: '0:38',
    description: 'Add beautiful dark mode to your site with this simple Tailwind trick.',
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [seekerHover, setSeekerHover] = useState<{ x: number; time: string } | null>(null);
  const tooltipVideoRef = useRef<HTMLVideoElement>(null);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.duration) {
      setProgress((v.currentTime / v.duration) * 100);
    }
  };

  const handleSeekerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const ratio = Math.max(0, Math.min(1, x / bounds.width));

    // Simulate time calculation based on format/duration
    const totalSeconds = item.duration === '' ? 60 : 120; // Default estimate
    const currentSeconds = ratio * totalSeconds;
    const mins = Math.floor(currentSeconds / 60);
    const secs = Math.floor(currentSeconds % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    if (tooltipVideoRef.current) {
      tooltipVideoRef.current.currentTime = currentSeconds;
    }

    setSeekerHover({ x: ratio * 100, time: timeStr });
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoRef.current || !videoRef.current.duration) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const ratio = Math.max(0, Math.min(1, x / bounds.width));
    videoRef.current.currentTime = ratio * videoRef.current.duration;
    setProgress(ratio * 100);
  };

  const handleMouseEnter = () => {
    if (!videoRef.current) return;
    setIsPlaying(true);
    videoRef.current.currentTime = 0;
    const playPromise = videoRef.current.play();
    if (playPromise) {
      playPromise.catch(() => undefined);
    }
  };

  const handleMouseLeave = () => {
    setIsPlaying(false);
    setProgress(0);
    setSeekerHover(null);
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  // Don't render styles items as regular cards - they go in the carousel
  if (isStyles) return null;

  return (
    <Link
      key={item.id}
      href={`/watch/${item.id}`}
      className="flex flex-col lg:flex-row gap-4 group p-2 rounded-2xl transition-all duration-300 hover:bg-[#2d1a1a] hover:shadow-2xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative flex-shrink-0">
        <div className="relative aspect-video w-full lg:w-96 overflow-hidden rounded-xl bg-zinc-900 shadow-lg">
          {previewSrc && (
            <video
              ref={videoRef}
              src={previewSrc}
              onTimeUpdate={handleTimeUpdate}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-all duration-300 group-hover:opacity-0 group-hover:scale-105"
          />

          {/* Playra-style Progress Seeker Bar */}
          {isPlaying && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer group/seeker z-10"
              onClick={handleSeek}
              onMouseMove={handleSeekerMouseMove}
              onMouseLeave={() => setSeekerHover(null)}
            >
              {/* Timeline View Popup */}
              {seekerHover && (
                <div
                  className="absolute bottom-4 -translate-x-1/2 pointer-events-none"
                  style={{ left: `${seekerHover.x}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-32 aspect-video bg-zinc-800 rounded border border-white/20 overflow-hidden shadow-2xl mb-1 relative">
                      <video
                        ref={tooltipVideoRef}
                        src={item.previewVideo}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        playsInline
                        preload="auto"
                      />
                    </div>
                    <span className="bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{seekerHover.time}</span>
                  </div>
                </div>
              )}

              <div
                className="h-full bg-red-600 relative transition-all duration-100"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 rounded-full scale-0 group-hover/seeker:scale-100 transition-transform shadow-xl" />
              </div>
            </div>
          )}

          {item.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider z-0">
              {item.duration}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-start gap-2">
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
            {item.title}
          </h3>
          <button className="ml-auto text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 font-medium">
          <span>{item.views}</span>
          <span>•</span>
          <span>{item.timestamp}</span>
        </div>

        <div className="flex items-center gap-2.5 mt-3 group/channel w-fit px-0.5">
          <img
            src={item.channelAvatar}
            alt={item.channel}
            className="w-8 h-8 rounded-full object-cover border border-white/5"
          />
          <span className="text-sm text-gray-300 font-bold group-hover/channel:text-white transition-colors">{item.channel}</span>
        </div>

        <p className="text-sm text-gray-400 mt-3 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="flex items-center gap-2 mt-4">
          {item.badges.map((badge) => (
            <span
              key={badge}
              className="text-[10px] px-2 py-0.5 rounded font-bold bg-zinc-800 text-gray-300 uppercase tracking-widest"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function StylesCarouselItem({
  item,
  onMouseEnter,
  onMouseLeave,
  videoRef
}: {
  item: ResultItem;
  onMouseEnter: (id: string) => void;
  onMouseLeave: (id: string) => void;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [seekerHover, setSeekerHover] = useState<{ x: number; time: string } | null>(null);
  const tooltipVideoRef = useRef<HTMLVideoElement>(null);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.duration) {
      setProgress((v.currentTime / v.duration) * 100);
    }
  };

  const handleSeekerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const ratio = Math.max(0, Math.min(1, x / bounds.width));

    // Simulate time calculation
    const totalSeconds = 59; // Styles are usually ~60s
    const currentSeconds = ratio * totalSeconds;
    const secs = Math.floor(currentSeconds % 60);
    const timeStr = `0:${secs.toString().padStart(2, '0')}`;

    if (tooltipVideoRef.current) {
      tooltipVideoRef.current.currentTime = currentSeconds;
    }

    setSeekerHover({ x: ratio * 100, time: timeStr });
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const v = e.currentTarget.parentElement?.querySelector('video');
    if (!v || !v.duration) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const ratio = Math.max(0, Math.min(1, x / bounds.width));
    v.currentTime = ratio * v.duration;
    setProgress(ratio * 100);
  };

  return (
    <Link
      href={`/styles/${item.id}`}
      className="group flex-shrink-0 w-40 sm:w-44 lg:w-48 relative"
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter(item.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setProgress(0);
        setSeekerHover(null);
        onMouseLeave(item.id);
      }}
    >
      <div className="relative overflow-hidden rounded-xl transition-all duration-300 group-hover:p-1 group-hover:bg-[#2d1a1a] shadow-lg group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-lg">
          {item.previewVideo && (
            <video
              ref={videoRef}
              src={item.previewVideo}
              onTimeUpdate={handleTimeUpdate}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
          />

          {/* Seeker */}
          {isHovered && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer z-10"
              onClick={handleSeek}
              onMouseMove={handleSeekerMouseMove}
              onMouseLeave={() => setSeekerHover(null)}
            >
              {/* Timeline View Popup */}
              {seekerHover && (
                <div
                  className="absolute bottom-4 -translate-x-1/2 pointer-events-none z-20"
                  style={{ left: `${seekerHover.x}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-24 aspect-[9/16] bg-zinc-800 rounded border border-white/20 overflow-hidden shadow-2xl mb-1 relative">
                      <video
                        ref={tooltipVideoRef}
                        src={item.previewVideo}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        playsInline
                        preload="auto"
                      />
                    </div>
                    <span className="bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">{seekerHover.time}</span>
                  </div>
                </div>
              )}

              <div
                className="h-full bg-red-600 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Duration Badge */}
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
            {item.duration}
          </div>

          <div className="absolute top-2 right-2">
            <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-tighter flex items-center gap-1 bg-black/40 backdrop-blur-md">
              <img src="/styles-icon.svg?v=blue" alt="" className="w-3 h-3 object-contain" />
              STYLES
            </span>
          </div>
        </div>

        {/* Title & Channel */}
        <div className="mt-2.5 px-1 pb-2">
          <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">
            {item.views}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StylesCarousel({ items }: { items: ResultItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleMouseEnter = (id: string) => {
    setHoveredId(id);
    const video = videoRefs.current[id];
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => undefined);
    }
  };

  const handleMouseLeave = (id: string) => {
    setHoveredId(null);
    const video = videoRefs.current[id];
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/styles-icon.svg?v=blue" alt="STYLES" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">STYLES</h2>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-all shadow-lg active:scale-90"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-all shadow-lg active:scale-90"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <StylesCarouselItem
            key={item.id}
            item={item}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            videoRef={(el) => {
              videoRefs.current[item.id] = el;
            }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="mt-4 h-px bg-zinc-800/50" />
    </div>
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

  // Get styles items for the carousel (only shown when filter is 'All')
  const stylesItems = useMemo(() => {
    let items = results.filter((item) => item.format === 'styles');
    if (query.trim()) {
      const lower = query.toLowerCase();
      items = items.filter((item) =>
        [item.title, item.channel, item.description].some((field) =>
          field.toLowerCase().includes(lower),
        ),
      );
    }
    return items;
  }, [query]);

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${filter === activeFilter
              ? 'bg-white text-gray-900'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* STYLES Carousel - Show on "All" or "Styles" filter */}
      {(activeFilter === 'All' || activeFilter === 'Styles') && stylesItems.length > 0 && (
        <StylesCarousel items={stylesItems} />
      )}

      <div className="space-y-8">
        {filteredResults.length === 0 && (activeFilter !== 'All' && activeFilter !== 'Styles' || stylesItems.length === 0) ? (
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
              <p className="text-lg font-semibold mb-2">No results for &quot;{queryLabel}&quot;</p>
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
