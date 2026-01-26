'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type Video = {
  id: string;
  title: string;
  thumbnail: string;
  previewVideo: string;
  channel: string;
  channelAvatar: string;
  views: string;
  timestamp: string;
  duration: string;
  captions: string;
};

const previewVideoSrc = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const baseVideos: Video[] = [
  {
    id: '1',
    title: 'Building a Full Stack App with Next.js and TypeScript',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'Tech Master',
    channelAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
    views: '125K',
    timestamp: '2 days ago',
    duration: '15:32',
    captions: 'Today we build a Next.js app from scratch in minutes.',
  },
  {
    id: '2',
    title: 'Learn React Hooks in 10 Minutes',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'Code Academy',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    views: '89K',
    timestamp: '1 week ago',
    duration: '10:15',
    captions: 'Quick hook patterns: useState, useEffect, and useMemo.',
  },
  {
    id: '3',
    title: 'The Future of AI in Web Development',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'AI Insights',
    channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    views: '234K',
    timestamp: '3 days ago',
    duration: '22:45',
    captions: 'AI tools are changing the way we build interfaces.',
  },
  {
    id: '4',
    title: 'Mastering CSS Grid and Flexbox',
    thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'Design Pro',
    channelAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop',
    views: '156K',
    timestamp: '5 days ago',
    duration: '18:20',
    captions: 'Grid + Flexbox combos make complex layouts easy.',
  },
  {
    id: '5',
    title: 'Building Scalable APIs with Node.js',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'Backend Guru',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop',
    views: '198K',
    timestamp: '1 day ago',
    duration: '25:10',
    captions: 'Let’s design an API that scales without pain.',
  },
  {
    id: '6',
    title: 'Introduction to Machine Learning',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'ML Academy',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop',
    views: '312K',
    timestamp: '4 days ago',
    duration: '30:00',
    captions: 'A fast intro to ML concepts and workflows.',
  },
  {
    id: '7',
    title: 'Web Performance Optimization Tips',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'Speed Master',
    channelAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop',
    views: '87K',
    timestamp: '6 days ago',
    duration: '12:45',
    captions: 'Shave seconds off load time with simple tweaks.',
  },
  {
    id: '8',
    title: 'JavaScript ES6+ Features You Must Know',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'JS Ninja',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop',
    views: '145K',
    timestamp: '2 weeks ago',
    duration: '20:30',
    captions: 'Modern JS: optional chaining, nullish coalescing, and more.',
  },
];

const BATCH_SIZE = 8;
const SKELETON_BATCH = Array.from({ length: BATCH_SIZE });

const buildBatch = (batchIndex: number): Video[] =>
  Array.from({ length: BATCH_SIZE }).map((_, index) => {
    const base = baseVideos[(batchIndex * BATCH_SIZE + index) % baseVideos.length];
    return {
      ...base,
      id: `${batchIndex}-${index}-${base.id}`,
    };
  });

// Adding Styles data
const baseShorts: Video[] = [
  {
    id: 's1',
    title: 'CSS Grid in 60 Seconds 🔥',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=360&h=640&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'CSS Wizards',
    channelAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=64&h=64&fit=crop',
    views: '890K',
    timestamp: '3 days ago',
    duration: '0:59',
    captions: 'Grid makes layouts so much easier.',
  },
  {
    id: 's2',
    title: 'TypeScript Tips You Need #dev',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=360&h=640&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'TS Pro',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop',
    views: '1.5M',
    timestamp: '1 week ago',
    duration: '0:52',
    captions: 'Interfaces vs Types: What to use?',
  },
  {
    id: 's3',
    title: 'useState vs useRef 💡',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=360&h=640&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'React Daily',
    channelAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
    views: '2.1M',
    timestamp: '5 days ago',
    duration: '0:48',
    captions: 'Refs persist values without re-renders.',
  },
  {
    id: 's4',
    title: 'Tailwind Dark Mode Trick ✨',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=360&h=640&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'Design Code',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop',
    views: '650K',
    timestamp: '2 weeks ago',
    duration: '0:38',
    captions: 'Just add the dark: utility class.',
  },
  {
    id: 's5',
    title: 'Next.js 15 Sneak Peek 🚀',
    thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=360&h=640&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'Vercel Expert',
    channelAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
    views: '1.2M',
    timestamp: '1 day ago',
    duration: '0:55',
    captions: 'Caching is now opted-out by default.',
  },
  {
    id: 's6',
    title: 'Clean Code: Naming is Hard 🏷️',
    thumbnail: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=360&h=640&fit=crop',
    previewVideo: previewVideoSrc,
    channel: 'Code Mentor',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    views: '430K',
    timestamp: '4 days ago',
    duration: '0:42',
    captions: 'Choose names that reveal intent.',
  },
];

function VideoCard({
  video,
  isHovered,
  isPreviewing,
  isMuted,
  isCcOn,
  onHoverStart,
  onHoverEnd,
  onToggleMuted,
  onToggleCc,
  videoRef
}: {
  video: Video;
  isHovered: boolean;
  isPreviewing: boolean;
  isMuted: boolean;
  isCcOn: boolean;
  onHoverStart: (id: string) => void;
  onHoverEnd: (id: string) => void;
  onToggleMuted: (id: string) => void;
  onToggleCc: (id: string) => void;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
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

    // Simulate time calculation
    const totalSeconds = 932;
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
    const cardEl = e.currentTarget.closest('.video-card-group');
    const videoEl = cardEl?.querySelector('video');
    if (!videoEl || !videoEl.duration) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const ratio = Math.max(0, Math.min(1, x / bounds.width));
    videoEl.currentTime = ratio * videoEl.duration;
    setProgress(ratio * 100);
  };

  return (
    <div
      data-id={video.id}
      className="video-card-group group relative flex flex-col w-full bg-gray-900 overflow-hidden"
      onMouseEnter={() => onHoverStart(video.id)}
      onMouseLeave={() => {
        onHoverEnd(video.id);
        setProgress(0);
        setSeekerHover(null);
      }}
    >
      <div className="relative w-full">
        <Link href={`/watch/${video.id}`} className="relative block w-full">
          <div className="relative w-full overflow-hidden sm:rounded-xl bg-zinc-950 transition-all duration-300 shadow-sm" style={{ paddingTop: '56.25%' }}>
            <div className="absolute inset-0">
              <img
                src={video.thumbnail}
                alt={video.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isPreviewing ? 'opacity-0' : 'opacity-100'}`}
              />
              <video
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${isPreviewing ? 'opacity-100' : 'opacity-0'}`}
                src={video.previewVideo}
                muted={isMuted}
                playsInline
              />
            </div>

            <div className="absolute top-2 left-2 flex gap-1.5 z-20">
              <div className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow-lg">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>

            <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded z-20">
              {video.duration}
            </div>

            {isPreviewing && (
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer group/seeker z-30"
                onClick={handleSeek}
                onMouseMove={handleSeekerMouseMove}
                onMouseLeave={() => setSeekerHover(null)}
              >
                <div
                  className="h-full bg-red-600 relative transition-all duration-100"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-600 rounded-full scale-0 group-hover/seeker:scale-100 transition-transform" />
                </div>
              </div>
            )}

            <div className={`absolute top-2 right-2 flex flex-col items-end gap-2 transition-opacity duration-200 z-20 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleMuted(video.id);
                }}
                className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-white/5"
              >
                {isMuted ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 9v6l-4 3V6l4 3h4l4-4v14l-4-4H9z" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 9v6l-4 3V6l4 3h4l4-4v14l-4-4H9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 9a3 3 0 010 6M17 7a5 5 0 010 10" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex gap-3 px-3 sm:px-0 py-3.5">
        <Link href={`/channel/${video.id}`} className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 shadow-md overflow-hidden transition-transform active:scale-90">
            <img
              src={video.channelAvatar}
              alt={video.channel}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        <div className="flex flex-1 flex-col min-w-0">
          <Link href={`/watch/${video.id}`} className="w-full group/title">
            <h3 className="font-bold text-white text-[15.5px] leading-[1.3] line-clamp-2 mb-1 group-hover/title:text-blue-400 transition-colors">
              {video.title}
            </h3>
          </Link>
          <div className="flex flex-wrap items-center text-[12px] text-zinc-400 font-bold gap-x-1.5">
            <Link href={`/channel/${video.id}`} className="hover:text-white transition-colors truncate max-w-[120px]">
              {video.channel}
            </Link>
            <span className="opacity-30">•</span>
            <div className="flex items-center gap-1.5">
              <span>{video.views}</span>
              <span className="opacity-30">•</span>
              <span>{video.timestamp}</span>
            </div>
          </div>
        </div>

        <button className="h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-full hover:bg-white/5 active:bg-white/10 transition-all -mr-1">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
        </button>
      </div>
    </div>
  );
}

function StylesSection({
  styles,
  onHoverStart,
  onHoverEnd,
  videoRefs
}: {
  styles: Video[];
  onHoverStart: (id: string) => void;
  onHoverEnd: (id: string) => void;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="my-2 sm:my-6 border-y border-white/5 py-4 sm:py-6">
      <div className="flex items-center gap-3 mb-2 sm:mb-4 px-2">
        <div className="w-8 h-8 flex items-center justify-center">
          <img src="/styles-icon.svg?v=blue" alt="STYLES" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase">Styles</h2>
        <div className="flex-1" />
        <div className="hidden sm:flex gap-2">
          <button onClick={() => scroll('left')} className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-all active:scale-90 shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => scroll('right')} className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-all active:scale-90 shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Grid on Mobile, Scroll on Desktop */}
      <div
        ref={scrollRef}
        className="grid grid-cols-2 sm:flex sm:gap-4 gap-3 overflow-x-auto sm:overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
      >
        {styles.map((short) => (
          <Link
            key={short.id}
            href={`/styles/${short.id}`}
            className="flex-shrink-0 w-full sm:w-44 lg:w-52 group relative"
            onMouseEnter={() => onHoverStart(short.id)}
            onMouseLeave={() => onHoverEnd(short.id)}
          >
            <div className="relative aspect-[9/16] rounded-xl overflow-hidden shadow-xl group-hover:scale-[1.02] transition-transform duration-300 bg-zinc-900 border border-white/5">
              <img src={short.thumbnail} alt={short.title} className="w-full h-full object-cover" />
              <video
                ref={(el) => { videoRefs.current[short.id] = el; }}
                src={short.previewVideo}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <h3 className="text-[12px] sm:text-[13px] font-bold text-white line-clamp-2 leading-tight drop-shadow-lg">{short.title}</h3>
                <p className="text-[10px] sm:text-[11px] text-gray-300 mt-1">{short.views} views</p>
              </div>
              <button className="absolute top-2 right-2 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [mutedMap, setMutedMap] = useState<Record<string, boolean>>({});
  const [ccMap, setCcMap] = useState<Record<string, boolean>>({});
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const batchIndexRef = useRef(0);
  const progressTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hoverTimersRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const previewingIdRef = useRef<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideos(buildBatch(0));
      batchIndexRef.current = 1;
      setIsInitialLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const isLoading = isInitialLoading || isLoadingMore;
    progressTimersRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    progressTimersRef.current = [];

    if (!isLoading) {
      if (showProgress) {
        setProgress(100);
        const hideTimer = setTimeout(() => {
          setShowProgress(false);
        }, 300);
        progressTimersRef.current.push(hideTimer);
        return () => clearTimeout(hideTimer);
      }
      return undefined;
    }

    setShowProgress(true);
    setProgress(10);
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setProgress(38), 200),
      setTimeout(() => setProgress(68), 600),
      setTimeout(() => setProgress(88), 1100),
    ];
    progressTimersRef.current = timers;
    return () => timers.forEach((timeoutId) => clearTimeout(timeoutId));
  }, [isInitialLoading, isLoadingMore, showProgress]);

  const stopPreview = useCallback((id: string | null) => {
    if (!id) return;
    const videoEl = videoRefs.current[id];
    if (videoEl) {
      videoEl.pause();
      videoEl.currentTime = 0;
    }
    if (previewingIdRef.current === id) {
      previewingIdRef.current = null;
      setPreviewingId(null);
    }
  }, []);

  const handleHoverStart = useCallback(
    (id: string) => {
      setHoveredId(id);
      if (hoverTimersRef.current[id]) {
        clearTimeout(hoverTimersRef.current[id] as ReturnType<typeof setTimeout>);
      }
      hoverTimersRef.current[id] = setTimeout(() => {
        if (previewingIdRef.current && previewingIdRef.current !== id) {
          stopPreview(previewingIdRef.current);
        }
        previewingIdRef.current = id;
        setPreviewingId(id);
        const videoEl = videoRefs.current[id];
        if (videoEl) {
          const isMuted = mutedMap[id] ?? true;
          videoEl.muted = isMuted;
          videoEl.currentTime = 0;
          videoEl.play().catch(() => undefined);
        }
      }, 1000);
    },
    [mutedMap, stopPreview],
  );

  const handleHoverEnd = useCallback(
    (id: string) => {
      if (hoverTimersRef.current[id]) {
        clearTimeout(hoverTimersRef.current[id] as ReturnType<typeof setTimeout>);
        hoverTimersRef.current[id] = null;
      }
      setHoveredId((prev) => (prev === id ? null : prev));
      stopPreview(id);
    },
    [stopPreview],
  );

  const handleToggleMuted = useCallback((id: string) => {
    setMutedMap((prev) => {
      const nextMuted = !(prev[id] ?? true);
      const videoEl = videoRefs.current[id];
      if (videoEl) {
        videoEl.muted = nextMuted;
        if (!nextMuted) {
          videoEl.play().catch(() => undefined);
        }
      }
      return { ...prev, [id]: nextMuted };
    });
  }, []);

  const handleToggleCc = useCallback((id: string) => {
    setCcMap((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextBatch = batchIndexRef.current;

    setTimeout(() => {
      setVideos((prev) => [...prev, ...buildBatch(nextBatch)]);
      batchIndexRef.current = nextBatch + 1;
      setIsLoadingMore(false);
    }, 1500);
  }, [isLoadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isInitialLoading && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '800px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isInitialLoading, isLoadingMore, loadMore]);

  // Mobile Auto-Preview Logic (Intersection Observer)
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (!isMobile) return;

    const options = {
      root: null,
      rootMargin: '-20% 0px -20% 0px', // Center-ish focus
      threshold: 0.7,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoId = (entry.target as HTMLElement).dataset.id;
        if (!videoId) return;

        const videoEl = videoRefs.current[videoId];
        if (entry.isIntersecting) {
          if (previewingIdRef.current && previewingIdRef.current !== videoId) {
            stopPreview(previewingIdRef.current);
          }
          previewingIdRef.current = videoId;
          setPreviewingId(videoId);
          if (videoEl) {
            videoEl.muted = true;
            videoEl.play().catch(() => undefined);
          }
        } else {
          if (previewingIdRef.current === videoId) {
            stopPreview(videoId);
          }
        }
      });
    }, options);

    // Initial and dynamic observation
    const observeAll = () => {
      document.querySelectorAll('.video-card-group').forEach((card) => {
        observer.observe(card);
      });
    };

    observeAll();
    const interval = setInterval(observeAll, 2000); // Check for new items from infinite scroll

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [videos, stopPreview]);

  const renderSkeletonCard = (key: string) => (
    <div key={key} className="space-y-3 animate-pulse">
      <div className="w-full aspect-video bg-gray-800 rounded-lg" />
      <div className="flex gap-3 px-3">
        <div className="w-9 h-9 bg-gray-800 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-800 rounded w-11/12" />
          <div className="h-4 bg-gray-800 rounded w-9/12" />
        </div>
      </div>
    </div>
  );

  const firstSet = videos.slice(0, 4);
  const secondSet = videos.slice(4, 8);
  const remaining = videos.slice(8);

  return (
    <div className="sm:px-6 py-0 bg-gray-900 min-h-screen">
      {/* Filter chips - edge to edge on mobile - MD3 Translucent Pills */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 sm:px-0 py-2 sm:pb-3 scrollbar-hide sticky top-14 sm:top-16 bg-gray-900/95 backdrop-blur-md z-40 sm:border-none">
        {['All', 'Music', 'Gaming', 'Live', 'News', 'React', 'Next.js', 'TypeScript', 'Tailwind', 'AI', 'Full Stack'].map(
          (filter) => (
            <button
              key={filter}
              className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-bold transition-all whitespace-nowrap active:scale-95 ${filter === 'All' ? 'bg-white text-gray-950 shadow-lg' : 'bg-white/10 text-white hover:bg-white/15 border border-white/5'
                }`}
            >
              {filter}
            </button>
          ),
        )}
      </div>

      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent pointer-events-none overflow-hidden">
          <div
            className={`h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] ${progress === 100
              ? 'w-full transition-all duration-200 ease-out'
              : 'animate-playra-progress'
              }`}
            style={{
              background: 'linear-gradient(90deg, #ef4444 0%, #f87171 50%, #ef4444 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}

      {isInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-x-4 gap-y-8">
          {SKELETON_BATCH.map((_, index) => renderSkeletonCard(`initial-${index}`))}
        </div>
      ) : (
        <div className="space-y-1 sm:space-y-8">
          {/* Section 1: 1st Set of Videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-x-4 gap-y-10">
            {firstSet.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isHovered={hoveredId === video.id}
                isPreviewing={previewingId === video.id}
                isMuted={mutedMap[video.id] ?? true}
                isCcOn={ccMap[video.id] ?? false}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
                onToggleMuted={handleToggleMuted}
                onToggleCc={handleToggleCc}
                videoRef={(el) => { videoRefs.current[video.id] = el; }}
              />
            ))}
          </div>

          {/* Section 2: Styles 1 */}
          <div className="px-3 sm:px-0">
            <StylesSection
              styles={baseShorts.slice(0, 6)}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
              videoRefs={videoRefs}
            />
          </div>

          {/* Section 3: 2nd Set of Videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-x-4 gap-y-10">
            {secondSet.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isHovered={hoveredId === video.id}
                isPreviewing={previewingId === video.id}
                isMuted={mutedMap[video.id] ?? true}
                isCcOn={ccMap[video.id] ?? false}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
                onToggleMuted={handleToggleMuted}
                onToggleCc={handleToggleCc}
                videoRef={(el) => { videoRefs.current[video.id] = el; }}
              />
            ))}
          </div>

          {/* Section 4: Styles 2 */}
          <div className="px-3 sm:px-0">
            <StylesSection
              styles={baseShorts.slice(3, 9).concat(baseShorts.slice(0, 3))}
              onHoverStart={handleHoverStart}
              onHoverEnd={handleHoverEnd}
              videoRefs={videoRefs}
            />
          </div>

          {/* Section 5: Rest of Videos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-x-4 gap-y-10">
            {remaining.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isHovered={hoveredId === video.id}
                isPreviewing={previewingId === video.id}
                isMuted={mutedMap[video.id] ?? true}
                isCcOn={ccMap[video.id] ?? false}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
                onToggleMuted={handleToggleMuted}
                onToggleCc={handleToggleCc}
                videoRef={(el) => { videoRefs.current[video.id] = el; }}
              />
            ))}
            {isLoadingMore && SKELETON_BATCH.map((_, index) => renderSkeletonCard(`loading-${index}`))}
          </div>
        </div>
      )}

      <div ref={sentinelRef} className="h-40" />
    </div>
  );
}
