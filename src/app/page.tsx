'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type Video = {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelAvatar: string;
  views: string;
  timestamp: string;
  duration: string;
};

const baseVideos: Video[] = [
  {
    id: '1',
    title: 'Building a Full Stack App with Next.js and TypeScript',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    channel: 'Tech Master',
    channelAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
    views: '125K',
    timestamp: '2 days ago',
    duration: '15:32',
  },
  {
    id: '2',
    title: 'Learn React Hooks in 10 Minutes',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
    channel: 'Code Academy',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    views: '89K',
    timestamp: '1 week ago',
    duration: '10:15',
  },
  {
    id: '3',
    title: 'The Future of AI in Web Development',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop',
    channel: 'AI Insights',
    channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    views: '234K',
    timestamp: '3 days ago',
    duration: '22:45',
  },
  {
    id: '4',
    title: 'Mastering CSS Grid and Flexbox',
    thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop',
    channel: 'Design Pro',
    channelAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop',
    views: '156K',
    timestamp: '5 days ago',
    duration: '18:20',
  },
  {
    id: '5',
    title: 'Building Scalable APIs with Node.js',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    channel: 'Backend Guru',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop',
    views: '198K',
    timestamp: '1 day ago',
    duration: '25:10',
  },
  {
    id: '6',
    title: 'Introduction to Machine Learning',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
    channel: 'ML Academy',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop',
    views: '312K',
    timestamp: '4 days ago',
    duration: '30:00',
  },
  {
    id: '7',
    title: 'Web Performance Optimization Tips',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    channel: 'Speed Master',
    channelAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop',
    views: '87K',
    timestamp: '6 days ago',
    duration: '12:45',
  },
  {
    id: '8',
    title: 'JavaScript ES6+ Features You Must Know',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop',
    channel: 'JS Ninja',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop',
    views: '145K',
    timestamp: '2 weeks ago',
    duration: '20:30',
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

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const batchIndexRef = useRef(0);
  const progressTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
      { rootMargin: '400px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isInitialLoading, isLoadingMore, loadMore]);

  const renderSkeletonCard = (key: string) => (
    <div key={key} className="space-y-3 animate-pulse">
      <div className="w-full aspect-video bg-gray-800 rounded-lg" />
      <div className="flex gap-3">
        <div className="w-9 h-9 bg-gray-800 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-800 rounded w-11/12" />
          <div className="h-4 bg-gray-800 rounded w-9/12" />
          <div className="h-3 bg-gray-800 rounded w-6/12" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Trending</h1>

      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent pointer-events-none">
          <div
            className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isInitialLoading
          ? SKELETON_BATCH.map((_, index) => renderSkeletonCard(`initial-${index}`))
          : videos.map((video) => (
              <Link key={video.id} href={`/watch/${video.id}`} className="group">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full aspect-video object-cover rounded-lg group-hover:rounded-none transition-all duration-200"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>

                <div className="flex gap-3 mt-3">
                  <img
                    src={video.channelAvatar}
                    alt={video.channel}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 hover:text-white transition-colors">
                      {video.channel}
                    </p>
                    <p className="text-sm text-gray-400">
                      {video.views} views • {video.timestamp}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

        {!isInitialLoading &&
          isLoadingMore &&
          SKELETON_BATCH.map((_, index) => renderSkeletonCard(`loading-${index}`))}
      </div>

      <div ref={sentinelRef} className="h-12" />
    </div>
  );
}
