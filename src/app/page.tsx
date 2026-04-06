'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getVideos, Video } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { getActiveProfile, getBatchProfiles } from '@/app/actions/profile';
import CommunityPostCard from '@/components/CommunityPostCard';
import { Clock, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { useAmbientColor } from '@/hooks/useAmbientColor';

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
  onToggleMute,
  videoRef,
  profileId
}: {
  video: Video;
  isHovered: boolean;
  isPreviewing: boolean;
  isMuted: boolean;
  onHoverStart: (id: string) => void;
  onHoverEnd: (id: string) => void;
  onToggleMute: () => void;
  videoRef: (el: HTMLVideoElement | null) => void;
  profileId?: string | null;
}) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [computedDuration, setComputedDuration] = useState<string | null>(video.duration || null);
  const [durationSeconds, setDurationSeconds] = useState<number>(parseDurationToSeconds(video.duration));
  const [showPreview, setShowPreview] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState<number>(0);
  const [bufferedSeconds, setBufferedSeconds] = useState<number>(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressKey = `watch_progress:${profileId || 'anon'}:${video.id}`;
  
  const { color: extractedGlowColor } = useAmbientColor({ src: video.thumbnail_url });
  const glowColor = extractedGlowColor !== 'rgba(100,100,100,0.2)' ? extractedGlowColor : 'rgba(150,150,150,0.3)';
  // Extract just the RGB for hover background
  const hoverBgColor = glowColor.replace('0.4)', '0.15)').replace('0.2)', '0.15)').replace('0.3)', '0.15)');

  // Play after 3 second delay on hover, muted by default
  useEffect(() => {
    if (isHovered && !showPreview) {
      previewTimerRef.current = setTimeout(() => {
        setShowPreview(true);
        localVideoRef.current?.play().catch(() => {});
      }, 3000);
    } else if (!isHovered) {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
      setShowPreview(false);
      localVideoRef.current?.pause();
    }
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [isHovered]);

  // Mute when hovering (preview mode), but allow user to unmute
  useEffect(() => {
    if (localVideoRef.current) {
      // isMuted = false (default) = muted, isMuted = true = unmuted
      localVideoRef.current.muted = !isMuted;
    }
  }, [isMuted, isHovered]);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const rawDur = e.currentTarget.duration;
    if (Number.isFinite(rawDur) && rawDur > 0) {
      setDurationSeconds(rawDur);
      setComputedDuration(formatDurationFromSeconds(rawDur));
    }
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressRef.current || durationSeconds === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * durationSeconds;
    setHoverTime(time);
    setHoverX(x);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!localVideoRef.current || !progressRef.current || durationSeconds === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * durationSeconds;
    localVideoRef.current.currentTime = time;
    setProgressSeconds(time);
  };

  return (
    <div
      className="group relative flex flex-col w-full p-3 -m-3 rounded-2xl transition-all duration-300"
      style={{ 
        ['--hover-bg' as string]: hoverBgColor 
      }}
      onMouseEnter={() => onHoverStart(video.id)}
      onMouseLeave={() => onHoverEnd(video.id)}
    >
      {/* Hover background layer */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ backgroundColor: hoverBgColor }}
      />
      {/* YouTube-Style Square Ambient Glow - Box Shadow */}
      <div 
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{
          boxShadow: `0 0 60px 8px ${glowColor}60`,
          backgroundColor: `${glowColor}10`,
        }}
      />

      <div className="relative z-10 block w-full" onClick={() => router.push(video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`)}>
        {/* Thumbnail */}
        <div className={`relative w-full overflow-hidden rounded-xl bg-zinc-900 ${video.is_short ? 'aspect-[9/16]' : 'aspect-video'} shadow-md transition-all duration-300 cursor-pointer`}>
          <img
            src={video.thumbnail_url || '/default-thumbnail.jpg'}
            alt={video.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-0' : 'opacity-100'}`}
          />
           <video
            ref={(el) => {
              localVideoRef.current = el;
              videoRef(el);
            }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0'}`}
            src={video.video_url || undefined}
            muted={!showPreview || isMuted}
            playsInline
            loop
            onTimeUpdate={(e) => {
              setProgressSeconds(e.currentTarget.currentTime);
              const video = e.currentTarget;
              if (video.buffered.length > 0) {
                setBufferedSeconds(video.buffered.end(video.buffered.length - 1));
              }
            }}
          />

          {/* Progress Bar - At bottom of video thumbnail */}
          {showPreview && durationSeconds > 0 && !video.is_short && (
            <div 
              ref={progressRef}
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer"
              onMouseMove={handleProgressHover}
              onMouseLeave={(e) => { e.stopPropagation(); setHoverTime(null); }}
              onClick={handleProgressClick}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-zinc-500 pointer-events-none"
                style={{ width: `${Math.min(100, ((progressSeconds + 5) / durationSeconds) * 100)}%` }}
              />
              <div 
                className="absolute top-0 left-0 h-full bg-cyan-400 pointer-events-none"
                style={{ width: `${Math.min(100, (progressSeconds / durationSeconds) * 100)}%` }}
              />
              {hoverTime !== null && (
                <div 
                  className="absolute top-0 h-full bg-red-500 pointer-events-none"
                  style={{ 
                    left: `${(hoverTime / durationSeconds) * 100}%`,
                    width: '2px'
                  }}
                />
              )}
              {hoverTime !== null && (
                <div 
                  className="absolute -top-8 left-0 transform -translate-x-1/2 bg-black/90 text-white text-[11px] px-2 py-1 rounded pointer-events-none whitespace-nowrap"
                  style={{ left: `${(hoverTime / durationSeconds) * 100}%` }}
                >
                  {formatDurationFromSeconds(hoverTime)}
                </div>
              )}
            </div>
          )}

          {video.is_short && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <img src="/styles-icon.svg?v=white" className="w-5 h-5 drop-shadow-md" alt="" />
            </div>
          )}

          {!video.is_short && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[12px] font-bold px-1.5 py-0.5 rounded-md z-30">
              {computedDuration || video.duration || '0:00'}
            </div>
          )}
        </div>
      </div>

      {/* Mute Button - Only show when video is playing */}
      {showPreview && (
        <div className="absolute top-5 right-5 z-50">
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggleMute();
            }}
            className="bg-black/80 p-2 rounded-md text-white hover:bg-black transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      )}

      {/* Text area - with ambient glow above */}
      <div className="relative z-10 flex gap-3 mt-3">
        <Link href={`/channel/${video.channel_id}`} className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden">
            <img
              src={video.channel_avatar || '/default-avatar.png'}
              alt={video.channel_name}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        <div className="flex flex-1 flex-col min-w-0 pr-8">
          <Link href={video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`}>
            <h3 className="font-semibold text-white text-[14px] leading-tight line-clamp-2 mb-1">
              {video.title}
            </h3>
          </Link>
          <Link href={`/channel/${video.channel_id}`} className="text-[13px] text-[#aaaaaa] hover:text-white transition-colors">
            {video.channel_name}
          </Link>
          <div className="flex items-center gap-1 text-[12px] text-[#aaaaaa]">
            <span>{video.views.toLocaleString()} views</span>
            <span>•</span>
            <span suppressHydrationWarning>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true }).replace(/^about /, '')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function StyleCard({
  style
}: {
  style: Video;
}) {
  const { color: extractedGlowColor } = useAmbientColor({ src: style.thumbnail_url });
  const glowColor = extractedGlowColor !== 'rgba(100,100,100,0.2)' ? extractedGlowColor : 'rgba(150,150,150,0.3)';
  const hoverBgColor = glowColor.replace('0.4)', '0.15)').replace('0.2)', '0.15)').replace('0.3)', '0.15)');

  return (
    <Link
      href={`/styles/${style.id}`}
      className="flex-shrink-0 w-44 sm:w-52 group relative rounded-2xl p-2 -m-2 transition-all duration-300"
      style={{ ['--hover-bg' as string]: hoverBgColor }}
    >
      {/* Hover background */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ backgroundColor: hoverBgColor }}
      />
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
function FeedItem({ item, hoveredId, previewingId, isMuted, onHoverStart, onHoverEnd, onToggleMute, videoRef }: {
  item: Video | { type: 'post'; data: any };
  hoveredId: string | null;
  previewingId: string | null;
  isMuted: boolean;
  onHoverStart: (id: string) => void;
  onHoverEnd: (id: string) => void;
  onToggleMute: () => void;
  videoRef: (el: HTMLVideoElement | null, id: string) => void;
}) {
  // Check if it's a post (wrapped type, empty video_url, or is_post flag)
  const isPost = ('type' in item && item.type === 'post') || 
                 ('video_url' in item && (!item.video_url || item.video_url.trim() === '')) || 
                 ('is_post' in item && item.is_post);
  
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
      onToggleMute={onToggleMute}
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
  const [isFeedControlOpen, setIsFeedControlOpen] = useState(false);
  const [feedTags, setFeedTags] = useState<string[]>(['Gaming', 'Tech', 'Animation']);
  const [excludedContent, setExcludedContent] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [isCategoryScrolled, setIsCategoryScrolled] = useState(false);

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

    const handleScroll = () => {
      setIsCategoryScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

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
      window.removeEventListener('scroll', handleScroll);
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

  const handleToggleMute = (id: string) => {
    setMutedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
      <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 px-4 md:px-6 pt-10">
        {Array(8).fill(0).map((_, i) => (
          <div suppressHydrationWarning key={i} className="animate-pulse flex flex-col w-full">
            <div suppressHydrationWarning className="aspect-video bg-zinc-800 rounded-xl mb-2" />
            <div suppressHydrationWarning className="flex gap-3">
              <div suppressHydrationWarning className="w-9 h-9 bg-zinc-800 rounded-full flex-shrink-0" />
              <div suppressHydrationWarning className="flex-1 space-y-2 pt-1 pr-8">
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

      <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 px-4 md:px-10 pt-10">
        {Array(8).fill(0).map((_, i) => (
          <div suppressHydrationWarning key={i+8} className="animate-pulse flex flex-col w-full">
            <div suppressHydrationWarning className="aspect-video bg-zinc-800 rounded-xl mb-2" />
            <div suppressHydrationWarning className="flex gap-3">
              <div suppressHydrationWarning className="w-9 h-9 bg-zinc-800 rounded-full flex-shrink-0" />
              <div suppressHydrationWarning className="flex-1 space-y-2 pt-1 pr-8">
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
        className={`sticky top-0 z-[60] border-b w-full -mt-[1px] transition-all duration-300 ${
          isCategoryScrolled 
            ? 'bg-[#0f0f0f]/80 backdrop-blur-xl border-white/10' 
            : 'bg-[#0f0f0f]/95 backdrop-blur-md border-white/5'
        }`}
      >
        <div
          suppressHydrationWarning
          className="flex items-center gap-3 overflow-x-auto px-4 md:px-8 py-3 scrollbar-hide"
        >
          <button
            onClick={() => setIsFeedControlOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors flex-shrink-0"
            title="Feed Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </button>
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
            displayVideos = videos.filter(v => !v.is_short && v.video_url && v.video_url.trim() !== '');
            feedPosts = videos.filter(v => !v.video_url || v.video_url.trim() === '');
          } else if (selectedCategory === 'Music') {
            displayVideos = videos.filter(v => !v.is_short && v.category === 'music' && v.video_url && v.video_url.trim() !== '');
          } else if (selectedCategory === 'Recently uploaded') {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            displayVideos = videos.filter(v => !v.is_short && v.video_url && v.video_url.trim() !== '' && new Date(v.created_at).getTime() > oneDayAgo);
            feedPosts = videos.filter(v => (!v.video_url || v.video_url.trim() === '') && new Date(v.created_at).getTime() > oneDayAgo);
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
                {/* Videos Grid */}
                {displayVideos.length > 0 ? (
                  <div className="relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 px-4 md:px-6 pt-4 mt-1">
                    {displayVideos.slice(0, 12).map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        isHovered={hoveredId === video.id}
                        isPreviewing={previewingId === video.id}
                        isMuted={mutedVideos.has(video.id)}
                        onHoverStart={handleHoverStart}
                        onHoverEnd={handleHoverEnd}
                        onToggleMute={() => handleToggleMute(video.id)}
                        videoRef={(el) => { videoRefs.current[video.id] = el; }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-6 md:px-10 pt-8 pb-4">
                    <p className="text-zinc-500 text-sm">Videos do not exist yet</p>
                  </div>
                )}

                {/* Engagement Row: In Case You Missed (from subscriptions) */}
                {selectedCategory === 'All' && displayVideos.length > 4 && (
                  <div className="px-4 md:px-10 pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <h2 className="text-lg font-bold text-white">In Case You Missed</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {displayVideos.slice(4, 8).map((video) => (
                        <VideoCard
                          key={`missed-${video.id}`}
                          video={video}
                          isHovered={hoveredId === video.id}
                          isPreviewing={previewingId === video.id}
                          isMuted={mutedVideos.has(video.id)}
                          onHoverStart={handleHoverStart}
                          onHoverEnd={handleHoverEnd}
                          onToggleMute={() => handleToggleMute(video.id)}
                          videoRef={(el) => { videoRefs.current[`missed-${video.id}`] = el; }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Row: Suggestions based on recent watches */}
                {selectedCategory === 'All' && displayVideos.length > 8 && (
                  <div className="px-4 md:px-10 pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <h2 className="text-lg font-bold text-white">More to Watch</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {displayVideos.slice(8, 12).map((video) => (
                        <VideoCard
                          key={`more-${video.id}`}
                          video={video}
                          isHovered={hoveredId === video.id}
                          isPreviewing={previewingId === video.id}
                          isMuted={mutedVideos.has(video.id)}
                          onHoverStart={handleHoverStart}
                          onHoverEnd={handleHoverEnd}
                          onToggleMute={() => handleToggleMute(video.id)}
                          videoRef={(el) => { videoRefs.current[`more-${video.id}`] = el; }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Styles Shelf */}
                {(selectedCategory === 'All' || selectedCategory === 'New to you') && (
                  styles.length > 0 ? (
                    <StylesShelf styles={styles} />
                  ) : (
                    <div className="px-6 md:px-10 pt-6 pb-2">
                      <p className="text-zinc-500 text-sm">Styles do not exist yet</p>
                    </div>
                  )
                )}

                {/* Community Posts Section */}
                {feedPosts.length > 0 && (
                  <div className="px-6 md:px-10 pt-8">
                    <h2 className="text-xl font-bold text-white mb-4">Community Posts</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {feedPosts.map((post, index) => (
                        <div key={`post-${post.id}-${index}`} className="max-w-2xl mx-auto w-full">
                          <CommunityPostCard post={post} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remaining Videos */}
                {displayVideos.length > 12 && (
                  <div className="relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 px-4 md:px-10 pt-10">
                    {displayVideos.slice(12).map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        isHovered={hoveredId === video.id}
                        isPreviewing={previewingId === video.id}
                        isMuted={mutedVideos.has(video.id)}
                        onHoverStart={handleHoverStart}
                        onHoverEnd={handleHoverEnd}
                        onToggleMute={() => handleToggleMute(video.id)}
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

      {/* Feed Control Modal */}
      {isFeedControlOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsFeedControlOpen(false)} />
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setIsFeedControlOpen(false)}
              className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Personalize Feed</h3>
            <p className="text-sm text-zinc-400 mb-6">Add topics you love to customize your home feed</p>

            {/* Add Topics */}
            <div className="mb-6">
              <label className="text-sm font-medium text-white mb-2 block">Add Topics</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g., Gaming, Tech, Animation"
                  className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTag.trim()) {
                      setFeedTags([...feedTags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newTag.trim()) {
                      setFeedTags([...feedTags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {feedTags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-zinc-800 text-white text-sm rounded-full flex items-center gap-2">
                    {tag}
                    <button onClick={() => setFeedTags(feedTags.filter((_, i) => i !== idx))} className="text-zinc-400 hover:text-white">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Excluded Content */}
            <div className="mb-6">
              <label className="text-sm font-medium text-white mb-2 block">Excluded Content</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  placeholder="e.g., Shorts, Gaming, News"
                  className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newExclusion.trim()) {
                      setExcludedContent([...excludedContent, newExclusion.trim()]);
                      setNewExclusion('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newExclusion.trim()) {
                      setExcludedContent([...excludedContent, newExclusion.trim()]);
                      setNewExclusion('');
                    }
                  }}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
                >
                  Block
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {excludedContent.map((item, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-900/30 text-red-400 text-sm rounded-full flex items-center gap-2 border border-red-500/30">
                    {item}
                    <button onClick={() => setExcludedContent(excludedContent.filter((_, i) => i !== idx))} className="hover:text-white">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsFeedControlOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
