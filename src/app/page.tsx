'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getVideos, Video } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { getActiveProfile, getBatchProfiles } from '@/app/actions/profile';
import CommunityPostCard from '@/components/CommunityPostCard';

const SKELETON_BATCH = Array.from({ length: 8 });

function formatDurationFromSeconds(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mmss = `${mins}:${secs.toString().padStart(2, '0')}`;
  return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : mmss;
}

function parseDurationToSeconds(value: string | null | undefined) {
  if (!value) return 0;
  const parts = value.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return parts[0] || 0;
}

function VideoCard({
  video,
  isHovered,
  isPreviewing,
  isMuted,
  onHoverStart,
  onHoverEnd,
  onToggleMuted,
  videoRef,
  profileId
}: {
  video: Video;
  isHovered: boolean;
  isPreviewing: boolean;
  isMuted: boolean;
  onHoverStart: (id: string) => void;
  onHoverEnd: (id: string) => void;
  onToggleMuted: (id: string) => void;
  videoRef: (el: HTMLVideoElement | null) => void;
  profileId?: string | null;
}) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [computedDuration, setComputedDuration] = useState<string | null>(video.duration || null);
  const [durationSeconds, setDurationSeconds] = useState<number>(parseDurationToSeconds(video.duration));
  const [progressSeconds, setProgressSeconds] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const progressKey = `watch_progress:${profileId || 'anon'}:${video.id}`;

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.muted = isMuted;
  }, [isMuted]);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const rawDur = e.currentTarget.duration;
    if (Number.isFinite(rawDur) && rawDur > 0) {
      setDurationSeconds(rawDur);
      setComputedDuration(formatDurationFromSeconds(rawDur));
    }
  };

  return (
    <div
      className="group relative flex flex-col w-full"
      onMouseEnter={() => onHoverStart(video.id)}
      onMouseLeave={() => onHoverEnd(video.id)}
    >
      <Link href={video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`} className="relative block w-full mb-3">
        <div className={`relative w-full overflow-hidden rounded-xl bg-zinc-900 ${video.is_short ? 'aspect-[9/16]' : 'aspect-video'} shadow-md transition-all duration-300`}>
          <img
            src={video.thumbnail_url || '/default-thumbnail.jpg'}
            alt={video.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${isPreviewing ? 'opacity-0' : 'opacity-100'}`}
          />
           <video
            ref={(el) => {
              localVideoRef.current = el;
              videoRef(el);
            }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${isPreviewing ? 'opacity-100' : 'opacity-0'}`}
            src={video.video_url || undefined}
            muted={isMuted}
            playsInline
            loop
            onLoadedMetadata={handleLoadedMetadata}
          />

          {/* Red Splash Button Overlay */}
          {!isPreviewing && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/0 transition-colors z-30"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsAnimating(true);
                setTimeout(() => {
                  onHoverStart(video.id); // Triggers preview immediately
                }, 400);
              }}
            >
                <div className={`relative transition-all duration-500 ease-out transform 
                  ${isAnimating ? 'scale-[2.5] opacity-0' : 'scale-100 opacity-100'}`}>
                  {/* Animation Ripple */}
                  <div className={`absolute inset-0 bg-white rounded-full transition-all duration-700 ease-out pointer-events-none 
                    ${isAnimating ? 'scale-[2] opacity-0' : 'scale-0 opacity-0'}`} />
                  
                  <svg className="w-12 h-12 overflow-visible" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M35,25 L75,50 L35,75 Z" 
                      fill={isAnimating ? "white" : "none"}
                      stroke={isAnimating ? "white" : "url(#cardGrad)"}
                      strokeWidth="6" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="transition-colors duration-200"
                      style={{ 
                        strokeDasharray: 200, 
                        strokeDashoffset: 200,
                        animation: 'drawTriCard 1.5s ease-out forwards' 
                      }}
                    />
                    <style>{`
                      @keyframes drawTriCard {
                        0% { stroke-dashoffset: 200; }
                        100% { stroke-dashoffset: 0; }
                      }
                    `}</style>
                  </svg>
                </div>
            </div>
          )}
          {video.is_short && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <img src="/styles-icon.svg?v=white" className="w-5 h-5 drop-shadow-md" alt="" />
            </div>
          )}
          {/* Progress Bar */}
          {isPreviewing && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
              <div 
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${(progressSeconds / durationSeconds) * 100}%` }}
              />
            </div>
          )}

          {!video.is_short && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[12px] font-bold px-1.5 py-0.5 rounded-md z-20">
              {computedDuration || video.duration || '0:00'}
            </div>
          )}
        </div>
      </Link>

      <div className="flex gap-3 px-2 sm:px-0">
        <Link href={`/channel/${video.channel_id}`} className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden">
            <img
              src={video.channel_avatar || '/default-avatar.png'}
              alt={video.channel_name}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        <div className="flex flex-1 flex-col min-w-0">
          <Link href={video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`}>
            <h3 className="font-semibold text-white text-[15px] leading-snug line-clamp-2 mb-1">
              {video.title}
            </h3>
          </Link>
          <Link href={`/channel/${video.channel_id}`} className="text-[13px] text-[#aaaaaa] hover:text-white transition-colors">
            {video.channel_name}
          </Link>
          <div className="flex items-center gap-1 text-[13px] text-[#aaaaaa]">
            <span>{video.views.toLocaleString()} views</span>
            <span>•</span>
            <span suppressHydrationWarning>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true }).replace(/^about /, '')}</span>
          </div>
        </div>

        <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function StyleCard({
  style
}: {
  style: Video;
}) {
  return (
    <Link
      href={`/styles/${style.id}`}
      className="flex-shrink-0 w-44 sm:w-52 group relative"
    >
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-800 shadow-xl border border-white/5 group-hover:scale-[1.02] transition-transform">
        <img src={style.thumbnail_url || '/default-thumbnail.jpg'} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight uppercase tracking-tighter drop-shadow-md">{style.title}</h3>
          <p className="text-[11px] text-zinc-300 mt-2 font-bold shadow-black drop-shadow-sm">{style.views.toLocaleString()} views</p>
        </div>
      </div>
    </Link>
  );
}

function StylesShelf({
  styles,
  isLoading = false
}: {
  styles: Video[];
  isLoading?: boolean;
}) {
  return (
    <div className="my-8 border-y border-white/5 py-6">
      <div className="flex items-center gap-3 mb-6 px-4 sm:px-6">
        <img src="/styles-icon.svg?v=blue" alt="" className="w-6 h-6" />
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Styles</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 scrollbar-hide pb-4">
        {isLoading || styles.length === 0 ? (
          Array(6).fill(0).map((_, i) => (
             <div key={i} className="flex-shrink-0 w-44 sm:w-52 aspect-[9/16] bg-zinc-800 rounded-2xl animate-pulse" />
          ))
        ) : (
          styles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Feed Item Component - switches between Video and Post
function FeedItem({ item, hoveredId, previewingId, isMuted, onHoverStart, onHoverEnd, onToggleMuted, videoRef }: {
  item: Video | { type: 'post'; data: any };
  hoveredId: string | null;
  previewingId: string | null;
  isMuted: boolean;
  onHoverStart: (id: string) => void;
  onHoverEnd: (id: string) => void;
  onToggleMuted: () => void;
  videoRef: (el: HTMLVideoElement | null, id: string) => void;
}) {
  // Check if it's a post (either wrapped type or is_post flag)
  const isPost = ('type' in item && item.type === 'post') || ('is_post' in item && item.is_post);
  
  if (isPost) {
    const postData = 'type' in item ? item.data : item;
    return (
      <div className="col-span-full sm:col-span-2 lg:col-span-3 2xl:col-span-4 3xl:col-span-5 4xl:col-span-6 max-w-2xl mx-auto w-full">
        {/* Mobile: Inset card style */}
        <div className="sm:hidden mx-4">
          <CommunityPostCard post={postData} />
        </div>
        {/* Desktop: Full width within grid cell */}
        <div className="hidden sm:block">
          <CommunityPostCard post={postData} />
        </div>
      </div>
    );
  }

  // It's a video
  const video = item as Video;
  return (
    <VideoCard
      video={video}
      isHovered={hoveredId === video.id}
      isPreviewing={previewingId === video.id}
      isMuted={isMuted}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onToggleMuted={onToggleMuted}
      videoRef={(el) => videoRef(el, video.id)}
    />
  );
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const hoverTimersRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const profile = await getActiveProfile();
        setActiveProfile(profile);

        // Fetch videos and posts in parallel
        const [videoData, postsRes] = await Promise.all([
          getVideos(50, 0),
          fetch('/api/posts?limit=20').then(r => r.json()).catch(() => ({ posts: [] }))
        ]);

        // Ensure the uploader sees their latest avatar on their own videos
        let hydrated = (videoData || []).map((v) => {
          if (profile?.id && v.channel_id === profile.id && profile.avatar) {
            return { ...v, channel_avatar: profile.avatar };
          }
          return v;
        });

        // Fetch fresh avatars for all channel ids in batch
        try {
          const channelIds = Array.from(new Set(hydrated.map((v) => v.channel_id).filter(Boolean)));
          const profiles = await getBatchProfiles(channelIds);
          
          const avatarMap = new Map<string, string>();
          profiles.forEach(p => {
            if (p.avatar) avatarMap.set(p.id, p.avatar);
          });

          if (avatarMap.size > 0) {
            hydrated = hydrated.map((v) => {
              const latest = avatarMap.get(v.channel_id);
              return latest ? { ...v, channel_avatar: latest } : v;
            });
          }
        } catch {
          // ignore avatar refresh errors
        }

        setVideos(hydrated);
        setPosts(postsRes.posts || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();

    // Check for video updates made while page wasn't loaded
    const lastUpdate = localStorage.getItem('video-updated');
    console.log('Checking for video updates, lastUpdate:', lastUpdate);
    if (lastUpdate) {
      const updateAge = Date.now() - parseInt(lastUpdate);
      console.log('Update age:', updateAge, 'ms');
      // If update was within last 30 seconds, refetch
      if (updateAge < 30000) {
        console.log('Detected recent video update, refetching...');
        fetchContent();
        localStorage.removeItem('video-updated');
      }
    }

    // Listen for updates
    const handleVideoUpdate = (e: any) => {
      console.log('Video update event received:', e.detail);
      fetchContent();
    };

    // Listen for localStorage changes (cross-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'video-updated') {
        console.log('Video update detected via localStorage');
        fetchContent();
      }
    };

    window.addEventListener('video-updated', handleVideoUpdate);
    window.addEventListener('storage', handleStorageChange);

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchContent();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('video-updated', handleVideoUpdate);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshKey]);

  const handleHoverStart = (id: string) => {
    setHoveredId(id);
    hoverTimersRef.current[id] = setTimeout(() => {
      setPreviewingId(id);
      const videoEl = videoRefs.current[id];
      if (videoEl) {
        videoEl.play().catch(() => { });
      }
    }, 400);
  };

  const handleHoverEnd = (id: string) => {
    if (hoverTimersRef.current[id]) {
      clearTimeout(hoverTimersRef.current[id]!);
    }
    setHoveredId(null);
    setPreviewingId(null);
    const videoEl = videoRefs.current[id];
    if (videoEl) {
      videoEl.pause();
    }
  };

  const renderSkeleton = () => (
    <div className="flex flex-col">
      <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-x-6 gap-y-12 px-6 md:px-10 pt-10">
        {Array(8).fill(0).map((_, i) => (
          <div suppressHydrationWarning key={i} className="animate-pulse flex flex-col w-full">
            <div suppressHydrationWarning className="aspect-video bg-zinc-800 rounded-xl mb-3" />
            <div suppressHydrationWarning className="flex gap-3 px-2 sm:px-0">
              <div suppressHydrationWarning className="w-10 h-10 bg-zinc-800 rounded-full flex-shrink-0" />
              <div suppressHydrationWarning className="flex-1 space-y-3 pt-1">
                <div suppressHydrationWarning className="h-4 bg-zinc-800 rounded w-[90%]" />
                <div suppressHydrationWarning className="h-3 bg-zinc-800 rounded w-[60%]" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {(selectedCategory === 'All' || selectedCategory === 'New to you') && (
        <StylesShelf styles={[]} isLoading={true} />
      )}

      <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-x-6 gap-y-12 px-6 md:px-10 pt-10">
        {Array(8).fill(0).map((_, i) => (
          <div suppressHydrationWarning key={i+8} className="animate-pulse flex flex-col w-full">
            <div suppressHydrationWarning className="aspect-video bg-zinc-800 rounded-xl mb-3" />
            <div suppressHydrationWarning className="flex gap-3 px-2 sm:px-0">
              <div suppressHydrationWarning className="w-10 h-10 bg-zinc-800 rounded-full flex-shrink-0" />
              <div suppressHydrationWarning className="flex-1 space-y-3 pt-1">
                <div suppressHydrationWarning className="h-4 bg-zinc-800 rounded w-[90%]" />
                <div suppressHydrationWarning className="h-3 bg-zinc-800 rounded w-[60%]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Category Bar Sticky Wrapper */}
      <div
        suppressHydrationWarning
        className="sticky top-0 z-[60] bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/5 w-full -mt-[1px]"
      >
        <div
          suppressHydrationWarning
          className="flex items-center gap-3 overflow-x-auto px-4 md:px-8 py-3 scrollbar-hide"
        >
          {['All', 'Live', 'Music', 'Gaming', 'News', 'Recently uploaded', 'New to you'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 md:px-4 py-1.5 md:py-1.5 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : (
        (() => {
          let displayVideos: Video[] = [];
          let feedPosts: any[] = [];
          
          if (selectedCategory === 'All' || selectedCategory === 'New to you') {
            displayVideos = videos.filter(v => !v.is_short && v.video_url);
            feedPosts = videos.filter(v => !v.video_url);
          } else if (selectedCategory === 'Recently uploaded') {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            displayVideos = videos.filter(v => !v.is_short && v.video_url && new Date(v.created_at).getTime() > oneDayAgo);
            feedPosts = videos.filter(v => !v.video_url && new Date(v.created_at).getTime() > oneDayAgo);
          }

          const styles = Array.from(
            new Map(videos.filter(v => v.is_short).map((style) => [style.id, style])).values()
          );

          if (displayVideos.length > 0 || styles.length > 0 || feedPosts.length > 0) {
            // Interleave posts randomly between videos
            const interleavePosts = (videos: Video[], posts: any[]): (Video | { type: 'post'; data: any })[] => {
              if (posts.length === 0) return videos;
              
              const result: (Video | { type: 'post'; data: any })[] = [];
              let postIndex = 0;
              let nextPostAt = Math.floor(Math.random() * 3) + 4;
              
              videos.forEach((video, videoIndex) => {
                result.push(video);
                if (videoIndex === nextPostAt && postIndex < posts.length) {
                  result.push({ type: 'post', data: posts[postIndex] });
                  postIndex++;
                  nextPostAt = videoIndex + Math.floor(Math.random() * 3) + 4;
                }
              });
              
              return result;
            };

            const interleavedContent = interleavePosts(displayVideos, feedPosts);

            return (
              <div className="pb-20">
                {/* Initial Grid with Posts Interleaved */}
                {displayVideos.length > 0 ? (
                  <div className="relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-x-6 gap-y-12 px-6 md:px-10 pt-4 mt-1">
                    {interleavedContent.slice(0, 12).map((item, index) => (
                      <FeedItem
                        key={index}
                        item={item}
                        hoveredId={hoveredId}
                        previewingId={previewingId}
                        isMuted={isMuted}
                        onHoverStart={handleHoverStart}
                        onHoverEnd={handleHoverEnd}
                        onToggleMuted={() => setIsMuted(!isMuted)}
                        videoRef={(el, id) => { videoRefs.current[id] = el; }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-6 md:px-10 pt-8 pb-4">
                    <p className="text-zinc-500 text-sm">Videos do not exist yet</p>
                  </div>
                )}

                {/* Styles Shelf - Only show on All or if something matches */}
                {(selectedCategory === 'All' || selectedCategory === 'New to you') && (
                  styles.length > 0 ? (
                    <StylesShelf styles={styles} />
                  ) : (
                    <div className="px-6 md:px-10 pt-6 pb-2">
                      <p className="text-zinc-500 text-sm">Styles do not exist yet</p>
                    </div>
                  )
                )}

                {/* Remaining Grid of Regular Videos */}
                {displayVideos.length > 8 && (
                  <div className="relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-x-6 gap-y-12 px-6 md:px-10 pt-10">
                    {displayVideos.slice(8).map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        isHovered={hoveredId === video.id}
                        isPreviewing={previewingId === video.id}
                        isMuted={isMuted}
                        onHoverStart={handleHoverStart}
                        onHoverEnd={handleHoverEnd}
                        onToggleMuted={() => setIsMuted(!isMuted)}
                        videoRef={(el) => { videoRefs.current[video.id] = el; }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">
                {selectedCategory === 'All' ? 'No videos found' : `No results found in ${selectedCategory}`}
              </h2>
              <p className="text-zinc-500 mt-2">
                {selectedCategory === 'All'
                  ? 'Try uploading your first video in the Studio!'
                  : selectedCategory === 'Recently uploaded'
                    ? 'No videos have been uploaded in the last 24 hours.'
                    : 'Check back later for content in this category.'}
              </p>
              {selectedCategory === 'All' && (
                <Link href="/studio/content" className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors">
                  Go to Studio
                </Link>
              )}
            </div>
          );
        })()
      )}
    </>
  );
}
