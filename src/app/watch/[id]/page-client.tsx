'use client';

import { useState, useEffect, useRef, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getVideoById, recordWatch, isHistoryPaused, incrementViews, Video, updateChannelAvatarInVideos } from '@/lib/supabase';
import { getSubscriberCount } from '@/app/actions/subscription';
import { trackVideoView } from '@/app/actions/views';
import { formatDistanceToNow } from 'date-fns';
import { getActiveProfile } from '@/app/actions/profile';
import { toggleLikeVideo, toggleDislikeVideo, fetchVideoEngagement } from '@/app/actions/engagement';
import Comments from '@/components/Comments';
import RelatedVideos from '@/components/RelatedVideos';
import SubscribeButton from '@/components/SubscribeButton';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Subtitles, 
  Monitor, 
  Maximize, 
  Repeat,
  ChevronRight
} from 'lucide-react';

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: watchId } = use(params);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likes, setLikes] = useState<number | null>(null);
  const [dislikes, setDislikes] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfileName, setActiveProfileName] = useState<string>('');
  const [activeProfileAvatar, setActiveProfileAvatar] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [watchLaterSaved, setWatchLaterSaved] = useState(false);
  const [playlists, setPlaylists] = useState<{ id: string; name: string; hasVideo: boolean }[]>([]);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistVisibility, setNewPlaylistVisibility] = useState<'private' | 'public'>('private');
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAnimatingPlay, setIsAnimatingPlay] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showRemainingTime, setShowRemainingTime] = useState(false);
  const [isTheatreMode, setIsTheatreMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [isSubtitlesOn, setIsSubtitlesOn] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isAutoplayOn, setIsAutoplayOn] = useState(true);
  
  // Autoplay Next States
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(8);
  const [isAutoplayCancelled, setIsAutoplayCancelled] = useState(false);
  const [playbackFeedback, setPlaybackFeedback] = useState<'play' | 'pause' | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isStickyPlayer, setIsStickyPlayer] = useState(false);
  const [showStickyPrompt, setShowStickyPrompt] = useState(false);
  
  // Dragging and Hover states
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const seekDotRef = useRef<HTMLDivElement | null>(null);
  const isDraggingProgressRef = useRef(false);
  const router = useRouter();

  // Description expansion
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const descriptionTextRef = useRef<HTMLParagraphElement | null>(null);

  // Detect if page is in an iframe
  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
  }, []);

  useEffect(() => {
    if (descriptionTextRef.current) {
      const isOverflowing = descriptionTextRef.current.scrollHeight > descriptionTextRef.current.clientHeight;
      // We only want to set needsExpansion if it's currently NOT expanded (initial check)
      if (!isDescriptionExpanded) setNeedsExpansion(isOverflowing);
    }
  }, [video, isDescriptionExpanded]);

  // Find next video from related list - prioritize NON-shorts
  const nextVideo = relatedVideos.find(v => !v.is_short) || (relatedVideos.length > 0 ? relatedVideos[0] : null);

  // Autoplay Countdown Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showNextOverlay && !isAutoplayCancelled && nextCountdown > 0) {
      timer = setTimeout(() => {
        setNextCountdown(prev => prev - 1);
      }, 1000);
    } else if (showNextOverlay && !isAutoplayCancelled && nextCountdown === 0 && nextVideo) {
      router.push(`/watch/${nextVideo.id}`);
    }
    return () => clearTimeout(timer);
  }, [showNextOverlay, nextCountdown, nextVideo, router, isAutoplayCancelled]);

  const showToast = (message: string, kind: 'success' | 'error' = 'success') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 2500);
  };

  const parseDurationToSeconds = (value: string | null | undefined) => {
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
  };

  const shouldIncrementView = (id: string) => {
    if (typeof window === 'undefined') return true;
    try {
      const key = `view_incremented:${id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as { ts?: number };
        const ts = saved?.ts ?? 0;
        // Cooldown: 6 hours
        if (Date.now() - ts < 6 * 60 * 60 * 1000) return false;
      }
    } catch {
      // ignore
    }
    return true;
  };

  const markViewIncremented = (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`view_incremented:${id}`, JSON.stringify({ ts: Date.now() }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const refreshAvatar = async (channelId: string) => {
      try {
        const res = await fetch(`/api/channel-avatar/${channelId}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json?.avatar) {
          setVideo((prev) => (prev ? { ...prev, channel_avatar: json.avatar } : prev));
        }
      } catch {
        // ignore avatar refresh errors
      }
    };

    const fetchVideo = async () => {
      try {
        const profile = await getActiveProfile();
        setActiveProfileId(profile?.id ?? null);
        setActiveProfileName(profile?.name ?? '');
        setActiveProfileAvatar(profile?.avatar ?? '');

        const data = await getVideoById(watchId);
        if (data) {
          const merged =
            profile?.id && profile.avatar && data.channel_id === profile.id
              ? { ...data, channel_avatar: profile.avatar }
              : data;

          // Best-effort: push latest avatar to Supabase so others see it
          if (profile?.id && profile.avatar && data.channel_id === profile.id) {
            updateChannelAvatarInVideos(profile.id, profile.avatar).catch((err) =>
              console.warn('Avatar sync skipped', err)
            );
          }

          setVideo(merged);
          setVideoId(merged.id);
          // Pull latest avatar from channel (matches “View your channel”)
          if (merged.channel_id) {
            refreshAvatar(merged.channel_id);
          }
          // Use stored duration if present
          const parsed = parseDurationToSeconds(merged.duration);
          if (parsed > 0) setDuration(parsed);

          // Increment views once when loaded
          if (shouldIncrementView(merged.id)) {
            try {
              const newViews = await incrementViews(merged.id);
              setVideo((prev) => (prev ? { ...prev, views: newViews } : prev));
              markViewIncremented(merged.id);
            } catch (viewErr) {
              console.warn('Failed to increment views', viewErr);
            }
          }

          // Load engagement data
          if (profile?.id && merged.id) {
            const engagement = await fetchVideoEngagement(merged.id, profile.id, merged.channel_id);
            if (engagement.success && 'likes' in engagement) {
              setLikes(engagement.likes);
              setIsLiked(engagement.userLiked);
              setIsDisliked(engagement.userDisliked);
            }
          }

          // Load subscriber count
          if (merged.channel_id) {
            try {
              const count = await getSubscriberCount(merged.channel_id);
              console.log('Subscriber count for', merged.channel_id, ':', count);
              setSubscriberCount(count);
            } catch (err: any) {
              console.error('Failed to load subscriber count:', err?.message || err);
            }
          }

          // Load save status
          if (profile?.id) {
            refreshSaveStatus(merged.id, profile.id);
          }
        }

        // Record watch if not paused
        if (profile?.id && data) {
          const paused = await isHistoryPaused(profile.id);
          if (!paused) {
            await recordWatch(profile.id, data.id);
          }
        }
      } catch (error) {
        console.error('Error fetching video:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (watchId.length > 5) { // Simple check for UUID
      fetchVideo();
    } else {
      setIsLoading(false);
    }
  }, [watchId]);

  const refreshSaveStatus = async (vId: string, profileId: string) => {
    setSaveLoading(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/engagement/save?videoId=${encodeURIComponent(vId)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load saves');
      }
      const json = await res.json();
      setWatchLaterSaved(!!json.watchLater);
      setPlaylists(json.playlists || []);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to load saves');
      showToast(err?.message || 'Failed to load saves', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleWatchLater = async () => {
    if (!videoId) return;
    
    // Optimistic update - show immediately
    const newSaved = !watchLaterSaved;
    setWatchLaterSaved(newSaved);
    showToast(newSaved ? 'Saved to Watch later' : 'Video was unsaved');
    
    // Close modal if open
    setIsSaveOpen(false);
    
    // Save to DB in background (silent)
    try {
      const target = !newSaved ? 'DELETE' : 'POST';
      const res = await fetch(`/api/engagement/save`, {
        method: target,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, target: 'watch_later' })
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      // Silent fail - user already saw the update
    }
  };

  const togglePlaylist = async (pid: string, hasVideo: boolean) => {
    if (!videoId) return;
    
    // Optimistic update - show immediately
    setPlaylists((prev) =>
      prev.map((p) => (p.id === pid ? { ...p, hasVideo: !hasVideo } : p)),
    );
    showToast(!hasVideo ? 'Saved to playlist' : 'Removed from playlist');
    
    // Close modal
    setIsSaveOpen(false);
    
    // Save to DB in background (silent)
    try {
      const method = hasVideo ? 'DELETE' : 'POST';
      const res = await fetch('/api/engagement/save', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, target: 'playlist', playlistId: pid })
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      // Silent fail - user already saw the update
    }
  };

  const createPlaylist = async () => {
    if (!videoId || !newPlaylistName.trim()) return;
    
    const name = newPlaylistName.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - add to list immediately with video saved
    const newPlaylist = { 
      id: tempId, 
      name, 
      hasVideo: true,
      isPrivate: newPlaylistVisibility === 'private'
    };
    setPlaylists(prev => [newPlaylist, ...prev]);
    setNewPlaylistName('');
    setIsCreatingPlaylist(false); // Just hide the form, keep modal open
    setNewPlaylistVisibility('private');
    showToast(`Created playlist "${name}" and saved video`);
    
    // Save to DB in background (silent)
    try {
      const res = await fetch('/api/engagement/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId, 
          target: 'playlist', 
          name, 
          isPrivate: newPlaylistVisibility === 'private'
        })
      });
      if (!res.ok) throw new Error('Failed');
      // Refresh playlists silently to get real ID
      if (activeProfileId) refreshSaveStatus(videoId, activeProfileId);
    } catch {
      // Silent fail
    }
  };

  const isSavedAnywhere = useMemo(
    () => watchLaterSaved || playlists.some((p) => p.hasVideo),
    [watchLaterSaved, playlists],
  );

  const formatTime = (secs: number) => {
    if (secs === undefined || secs === null || Number.isNaN(secs)) return '--:--';
    if (secs <= 0) return '--:--';
    const total = Math.floor(secs);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  };

  const resolvedDuration = duration > 0 ? duration : parseDurationToSeconds(video?.duration);
  const progressPct = resolvedDuration > 0 ? Math.min(100, Math.max(0, (currentTime / resolvedDuration) * 100)) : 0;

  const persistProgress = (videoId: string, current: number, total: number) => {
    if (typeof window === 'undefined') return;
    const key = `watch_progress:${activeProfileId || 'anon'}:${videoId}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          current,
          duration: total,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // ignore storage errors
    }
  };

  // Load stored progress when videoId changes
  useEffect(() => {
    if (typeof window === 'undefined' || !videoId) return;
    const key = `watch_progress:${activeProfileId || 'anon'}:${videoId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as { current?: number; duration?: number };
        if (typeof saved.duration === 'number' && saved.duration > 0) {
          setDuration((prev) => (prev > 0 ? prev : saved.duration!));
        }
        if (typeof saved.current === 'number' && saved.current >= 0) {
          setCurrentTime(saved.current);
          if (videoRef.current) {
            videoRef.current.currentTime = saved.current;
          }
        }
      }
    } catch {
      // ignore
    }
  }, [videoId, activeProfileId]);

  // Sticky player on scroll
  useEffect(() => {
    const handleScroll = () => {
      const videoSection = document.getElementById('video-section');
      if (videoSection) {
        const rect = videoSection.getBoundingClientRect();
        if (rect.bottom < 0 && !isStickyPlayer) {
          setIsStickyPlayer(true);
        } else if (rect.top < 100 && isStickyPlayer) {
          setIsStickyPlayer(false);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isStickyPlayer]);

  const handleLike = async () => {
    if (!activeProfileId || !videoId) {
      showToast('Please sign in to like videos', 'error');
      return;
    }
    
    // If already liked, unlike it
    if (isLiked) {
      setIsLiked(false);
      setLikes(Math.max(0, (likes ?? 0) - 1));
      toggleLikeVideo(videoId, activeProfileId, true).catch(() => {});
      return;
    }
    
    // Like the video (and remove dislike if present)
    setIsLiked(true);
    setIsDisliked(false); // Always clear dislike when liking
    setLikes((likes ?? 0) + 1);
    
    // Save to DB in background (silent)
    toggleLikeVideo(videoId, activeProfileId, false).catch(() => {});
  };

  const handleDislike = async () => {
    if (!activeProfileId || !videoId) {
      showToast('Please sign in to dislike videos', 'error');
      return;
    }
    
    // If already disliked, remove dislike
    if (isDisliked) {
      setIsDisliked(false);
      toggleDislikeVideo(videoId, activeProfileId, true).catch(() => {});
      return;
    }
    
    // Dislike the video (and remove like if present)
    setIsDisliked(true);
    if (isLiked) {
      setIsLiked(false); // Always clear like when disliking
      setLikes(Math.max(0, (likes ?? 0) - 1));
    }
    
    // Save to DB in background (silent)
    toggleDislikeVideo(videoId, activeProfileId, false).catch(() => {});
  };

  const handleStartPlay = () => {
    if (isAnimatingPlay || hasStarted) return;
    setIsAnimatingPlay(true);
    
    // Track the view with timestamp
    if (videoId && activeProfileId) {
      trackVideoView(videoId, activeProfileId).catch(() => {});
    } else if (videoId) {
      trackVideoView(videoId).catch(() => {});
    }
    
    // Complete animation then start video
    setTimeout(() => {
      setHasStarted(true);
      if (videoRef.current) {
        videoRef.current.play().catch(err => console.warn('Play error:', err));
        setIsPlaying(true);
      }
    }, 400);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setIsSettingsOpen(false);
    };
    if (isSettingsOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setPlaybackFeedback('pause');
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      setPlaybackFeedback('play');
    }
    // Clear feedback after animation
    setTimeout(() => setPlaybackFeedback(null), 500);
    
    // Reset controls timer
    resetControlsTimeout();
  };

  const resetControlsTimeout = () => {
    setShowMobileControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      // Only auto-hide if video is playing
      if (isPlaying) {
        setShowMobileControls(false);
      }
    }, 3000);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    videoRef.current.muted = newMute;
    setIsMuted(newMute);
  };

  const toggleFullscreen = () => {
    const el = document.querySelector('.aspect-video');
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    } else {
      el.requestFullscreen().catch(err => console.error(err));
    }
  };

  const changeVolume = (v: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleTheatreMode = () => {
    setIsTheatreMode(!isTheatreMode);
  };

  const videoTitle = video?.title || "";
  const videoSrc = video?.video_url || "";
  const channelName = video?.channel_name || "Loading...";
  const channelAvatar = video?.channel_avatar || "";
  const videoViews = video ? `${Math.max(1, video.views ?? 0).toLocaleString()} views` : "";
  const videoDate = video ? formatDistanceToNow(new Date(video.created_at), { addSuffix: true }) : "";
  const videoDescription = video?.description || "";
  const isVideoContent = video?.content_type === 'video';
  const isStyleContent = video?.content_type === 'style';

  // If embedded OR simple video content, show YouTube-style simple player (no comments/likes)
  if (isEmbedded || isVideoContent) {
    return (
      <div className="w-full h-full bg-black relative group">
        <video
          ref={videoRef}
          src={videoSrc}
          poster={video?.thumbnail_url}
          className="w-full h-full object-contain"
          controls
          controlsList="nodownload noplaybackrate"
          playsInline
        />
        {(channelAvatar || channelName) && (
          <div className="absolute top-4 left-4 flex items-center gap-3 z-20">
            {channelAvatar && (
              <img src={channelAvatar} alt="" className="w-10 h-10 rounded-full border border-white/20" />
            )}
            <div className="text-white drop-shadow-lg">
              <p className="font-bold text-base leading-tight drop-shadow-md">{videoTitle}</p>
              {channelName && <p className="text-sm text-white/80 drop-shadow-md">{channelName}</p>}
            </div>
          </div>
        )}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <Link href={`/watch/${watchId}`} target="_blank" className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-white hover:bg-black/80 transition-colors">
            <span>Watch on</span>
            <img src="/offlinee.png" alt="Playra" className="h-5 w-auto object-contain" />
          </Link>
        </div>
      </div>
    );
  }

  // Style content - show full card with likes/comments
  // Normal watch page layout
  return (
    <div className={`flex ${isTheatreMode ? 'flex-col lg:flex-col' : 'flex-col lg:flex-row'} gap-6 p-0 lg:p-6 bg-[#0f0f0f] min-h-screen items-center lg:items-start`}>
      {/* Sticky Player */}
      {isStickyPlayer && (
        <div className="fixed top-4 right-4 z-50 w-[280px] sm:w-[320px] rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10">
          <button
            onClick={() => setIsStickyPlayer(false)}
            className="absolute top-2 right-2 z-10 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative aspect-video">
            {videoSrc && (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                playsInline
                muted
                loop
                autoPlay
              />
            )}
          </div>
          <div className="p-2 bg-zinc-900">
            <h4 className="text-sm font-bold text-white line-clamp-1">{video?.title}</h4>
            <p className="text-xs text-zinc-400">{video?.channel_name}</p>
          </div>
        </div>
      )}

      <div id="video-section" className={`w-full ${isTheatreMode ? 'max-w-none' : 'flex-1 lg:max-w-[calc(100vw-450px)]'}`}>
        {/* Video Player Section */}
        <div 
          className="aspect-video bg-zinc-900 sm:rounded-xl overflow-hidden mb-4 relative shadow-2xl group/player cursor-pointer"
          onClick={() => !hasStarted && handleStartPlay()}
        >
          {/* Splash Screen / Play Button overlay */}
          {!hasStarted && video && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 group/player overflow-hidden">
              {/* Animated Splash Triangle Loader */}
              <div className={`relative transition-all duration-500 transform 
                ${isAnimatingPlay ? 'scale-[2.5] opacity-0' : 'scale-100 opacity-100 hover:scale-110 active:scale-95'}`}
              >
                <svg className="w-20 h-20 lg:w-24 lg:h-24 overflow-visible" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                  {/* Drawing Path */}
                  <path 
                    d="M35,25 L75,50 L35,75 Z" 
                    fill={isAnimatingPlay ? "white" : "none"}
                    stroke={isAnimatingPlay ? "white" : "url(#playGrad)"}
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    style={{ 
                      strokeDasharray: 200, 
                      strokeDashoffset: 200,
                      animation: 'drawTri 1.2s ease-out forwards' 
                    }}
                  />
                  <style>{`
                    @keyframes drawTri {
                      0% { stroke-dashoffset: 200; }
                      100% { stroke-dashoffset: 0; }
                    }
                  `}</style>
                </svg>
              </div>
              
              {/* Optional Thumbnail overlay if video not yet visible */}
              {!videoLoaded && video.thumbnail_url && (
                <img 
                  src={video.thumbnail_url} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover -z-10"
                />
              )}
            </div>
          )}

          {(!videoLoaded || !video) && !hasStarted && (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center pointer-events-none">
              {video?.thumbnail_url ? (
                <img 
                  src={video.thumbnail_url} 
                  alt=""
                  className="w-full h-full object-cover opacity-50"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800" />
              )}
              <div className="absolute inset-0 bg-black/20 animate-pulse" />
            </div>
          )}
          {videoSrc && (
            <video
              ref={videoRef}
              key={videoSrc}
              className={`w-full h-full ${videoLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
              controls={false}
              autoPlay={false}
              poster={video?.thumbnail_url}
              preload="metadata"
              onClick={(e) => {
                const isTouch = window.matchMedia('(pointer: coarse)').matches;
                const isMobileView = window.innerWidth < 1024;
                
                if (isTouch || isMobileView) {
                  // Mobile/Touch: Toggle controls visibility
                  if (showMobileControls) {
                    setShowMobileControls(false);
                  } else {
                    resetControlsTimeout();
                  }
                } else {
                  // Desktop: Toggle play/pause
                  togglePlay();
                }
              }}
              onMouseMove={() => {
                if (window.innerWidth >= 1024) {
                  resetControlsTimeout();
                }
              }}
              onLoadedData={() => setVideoLoaded(true)}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (d && !Number.isNaN(d)) setDuration(d);
                else if (resolvedDuration > 0) setDuration(resolvedDuration);
              }}
              onTimeUpdate={(e) => {
                const t = e.currentTarget.currentTime;
                // Avoid state updates while dragging to prevent stutter
                if (!isDraggingProgressRef.current) {
                  setCurrentTime(t);
                }
                const effectiveDuration = duration > 0 ? duration : resolvedDuration;
                if (videoId && effectiveDuration > 0) {
                  persistProgress(videoId, t, effectiveDuration);
                }
              }}
              onEnded={() => {
                if (isAutoplayOn && nextVideo) {
                  setShowNextOverlay(true);
                  setNextCountdown(8);
                  setIsAutoplayCancelled(false); // Reset on new end
                } else {
                  setIsPlaying(false);
                }
              }}
              onPlay={() => {
                setIsPlaying(true);
                setShowNextOverlay(false);
                setIsAutoplayCancelled(false);
                setIsBuffering(false);
              }}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onSeeked={() => setIsBuffering(false)}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          )}

          {/* Buffering Loader - Thick rounded-pill style */}
          {isBuffering && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/10 pointer-events-none">
              <div className="relative w-16 h-16">
                <svg className="animate-spin w-full h-full" viewBox="0 0 50 50">
                  <circle 
                    cx="25" cy="25" r="20" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="6" 
                    strokeLinecap="round"
                    strokeDasharray="90, 150"
                    className="opacity-90"
                  />
                </svg>
              </div>
            </div>
          )}
          {/* Autoplay Next Overlay - Redesigned to match YouTube exactly */}
          {showNextOverlay && nextVideo && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md pointer-events-auto animate-in fade-in duration-500 ${isAutoplayCancelled ? 'pb-10' : 'pb-20'}`}>
              <div className="text-white flex flex-col items-center gap-4 max-w-md w-full px-8">
                 {!isAutoplayCancelled && (
                   <div className="text-zinc-300 text-sm font-medium">Up next in {nextCountdown}</div>
                 )}
                 
                 {/* Large Thumbnail with Duration */}
                 <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/5 mt-2 bg-zinc-900">
                    <img 
                      src={nextVideo.thumbnail_url || '/placeholder-thumb.jpg'} 
                      alt="Next video"
                      className="w-full h-full object-cover"
                    />
                    {nextVideo.duration && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded-sm text-[11px] font-bold">
                        {nextVideo.duration}
                      </div>
                    )}
                 </div>

                 <div className="text-center mt-3 space-y-1">
                    <h3 className="text-xl font-bold line-clamp-2 leading-tight tracking-tight">{nextVideo.title}</h3>
                    <p className="text-zinc-400 text-sm font-medium">{nextVideo.channel_name}</p>
                 </div>

                 {/* pill-shaped action buttons */}
                 <div className="flex items-center gap-3 w-full mt-6">
                    {!isAutoplayCancelled ? (
                      <>
                        <button 
                          onClick={() => setIsAutoplayCancelled(true)}
                          className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all uppercase text-sm tracking-wide"
                        >
                          CANCEL
                        </button>
                        <button 
                          onClick={() => router.push(`/watch/${nextVideo.id}`)}
                          className="flex-1 py-2.5 rounded-full bg-white text-black font-bold transition-all hover:bg-zinc-200 uppercase text-sm tracking-wide"
                        >
                          PLAY NOW
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-3 w-full">
                        <button 
                          onClick={() => router.push(`/watch/${nextVideo.id}`)}
                          className="w-full py-3 rounded-full bg-white text-black font-bold transition-all hover:bg-zinc-200 uppercase text-sm tracking-wide flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Play Next Video
                        </button>
                        <button 
                          onClick={() => setShowNextOverlay(false)}
                          className="w-full py-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )}          {/* YouTube CUSTOM CONTROLS OVERLAY - Consolodated Mobile UI */}
          {hasStarted && videoLoaded && duration > 0 && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                // Clicking anywhere on the player overlay dismisses the UI
                setShowMobileControls(false);
              }}
              className={`absolute inset-0 z-40 bg-black/40 transition-opacity duration-300 ${ (showNextOverlay || showMobileControls) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
              {/* CENTER: Mobile Play/Pause Button - Centered but separate from layout flow */}
              {showMobileControls && !showNextOverlay && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay(e);
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-24 lg:-translate-y-8 w-16 h-16 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-auto hover:bg-white/10 active:scale-90 transition-all shadow-2xl border border-white/10"
                >
                  {isPlaying ? (
                    <Pause size={32} className="text-white fill-current" />
                  ) : (
                    <Play size={32} className="text-white fill-current ml-1" />
                  )}
                </button>
              )}

              {/* BOTTOM: Timeline & Controls Bar */}
              <div 
                onClick={(e) => {
                  e.stopPropagation(); // Stop bubbling to prevent dismissal when clicking controls bar background
                  resetControlsTimeout();
                }} 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent px-2 lg:px-4 pt-10 pb-2 lg:pb-1 flex flex-col gap-0.5 pointer-events-auto"
              >
                
                {/* 1. Progress Bar (the thin line) with Dragging and Visual Preview */}
                <div 
                  className="relative w-full h-[5px] group/bar cursor-pointer flex items-center mb-4 mt-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent dismissal when dragging
                    setIsDraggingProgress(true);
                    isDraggingProgressRef.current = true;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    if (videoRef.current && resolvedDuration > 0) {
                      videoRef.current.currentTime = pct * resolvedDuration;
                    }
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const newHoverTime = pct * resolvedDuration;
                    setHoverTime(newHoverTime);
                    setHoverX(e.clientX - rect.left);

                    // Update preview video
                    if (previewVideoRef.current) {
                      previewVideoRef.current.currentTime = newHoverTime;
                    }

                    if (isDraggingProgressRef.current && videoRef.current && resolvedDuration > 0) {
                      // Ultra-smooth seek via requestAnimationFrame
                      window.requestAnimationFrame(() => {
                        if (progressFillRef.current) progressFillRef.current.style.transform = `scaleX(${pct})`;
                        if (seekDotRef.current) seekDotRef.current.style.left = `${pct * 100}%`;
                        if (videoRef.current) videoRef.current.currentTime = pct * resolvedDuration;
                      });
                    }
                  }}
                  onMouseUp={() => {
                    if (isDraggingProgressRef.current && videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                    }
                    setIsDraggingProgress(false);
                    isDraggingProgressRef.current = false;
                  }}
                  onMouseLeave={() => {
                    setHoverTime(null);
                  }}
                >
                  {/* Visual Hover Preview Card (Thumbnail) - Only on Desktop */}
                  {hoverTime !== null && typeof window !== 'undefined' && window.innerWidth >= 1024 && (
                    <div 
                      className="absolute bottom-8 w-32 aspect-video bg-black rounded-lg border-2 border-white/20 overflow-hidden shadow-2xl pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity z-50 flex flex-col"
                      style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}
                    >
                      <video 
                        ref={previewVideoRef}
                        src={videoSrc}
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="bg-black/60 text-white text-[10px] font-bold py-0.5 text-center">
                        {formatTime(hoverTime)}
                      </div>
                    </div>
                  )}

                  {/* Track (Darker background) */}
                  <div className="absolute inset-0 bg-white/10 h-[3px] rounded-full overflow-hidden transition-all group-hover/bar:h-[5px]">
                    {/* Buffer Line */}
                    <div 
                      className="h-full bg-white/20 transition-all duration-300" 
                      style={{ width: `${(videoRef.current?.buffered.length ? videoRef.current.buffered.end(0) / resolvedDuration : 0) * 100}%` }} 
                    />
                  </div>
                  {/* Progress Fill (Playra Theme - BLUE) */}
                  <div 
                    ref={progressFillRef}
                    className="absolute inset-0 h-[3px] bg-gradient-to-r from-blue-600 to-indigo-500 origin-left scale-x-0 transition-all group-hover/bar:h-[5px]"
                    style={{ transform: `scaleX(${progressPct / 100})`, width: '100%' }}
                  />
                  {/* Seek Head (The Blue Dot) */}
                  <div 
                    ref={seekDotRef}
                    className={`absolute top-1/2 -translate-y-1/2 w-[13px] h-[13px] bg-blue-500 rounded-full shadow-lg border-2 border-white/20 transition-all z-10 
                      ${isDraggingProgress ? 'scale-125 opacity-100' : 'opacity-0 lg:group-hover/player:opacity-100'}`}
                    style={{ left: `${progressPct}%`, marginLeft: '-6.5px' }}
                  />
                </div>

                {/* Window listeners for dragging outside */}
                {isDraggingProgress && (
                  <div 
                    className="fixed inset-0 z-[9999] cursor-pointer"
                    onMouseMove={(e) => {
                      const bar = document.querySelector('.group\\/bar');
                      if (bar && videoRef.current && resolvedDuration > 0 && isDraggingProgressRef.current) {
                        const rect = bar.getBoundingClientRect();
                        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        
                        window.requestAnimationFrame(() => {
                          if (progressFillRef.current) progressFillRef.current.style.transform = `scaleX(${pct})`;
                          if (seekDotRef.current) seekDotRef.current.style.left = `${pct * 100}%`;
                          if (videoRef.current) videoRef.current.currentTime = pct * resolvedDuration;
                        });
                      }
                    }}
                    onMouseUp={() => {
                      if (isDraggingProgressRef.current && videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                      }
                      setIsDraggingProgress(false);
                      isDraggingProgressRef.current = false;
                    }}
                  />
                )}

                {/* 2. Controls Bar (The Icons) - Redesigned for better mobile fit */}
                <div className="flex items-center justify-between text-white pb-3 lg:pb-2 px-1 lg:px-2 select-none relative z-[60]">
                  {/* Left Side: Play, Volume, Time */}
                  <div className="flex items-center gap-1 lg:gap-2">
                    {/* Play Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                      className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/10 lg:bg-white/15 backdrop-blur-md hover:bg-white/25 transition-all active:scale-95 shadow-sm"
                    >
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                    </button>

                    {/* Volume Button Enclosure - Hide slider on mobile to save space */}
                    <div className="flex items-center gap-0 group/vol bg-white/15 backdrop-blur-md rounded-full px-1 py-1 pr-1 lg:pr-2 lg:hover:pr-3 transition-all">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors"
                      >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.05" 
                        value={isMuted ? 0 : volume} 
                        onChange={(e) => changeVolume(parseFloat(e.target.value))}
                        className="w-0 lg:group-hover/vol:w-16 transition-all accent-white cursor-pointer h-1 opacity-0 lg:group-hover/vol:opacity-100 ml-0 hover:ml-1 hidden lg:block"
                      />
                    </div>

                    {/* Time Pill - More compact on mobile */}
                    <div 
                      className="bg-white/10 lg:bg-white/15 backdrop-blur-md rounded-full px-3 lg:px-4 py-1.5 lg:py-2 text-[11px] lg:text-[12px] font-bold tracking-tight shadow-sm cursor-pointer select-none hover:bg-white/25 active:scale-95 transition-all text-center min-w-[50px] lg:min-w-[60px]"
                      onClick={(e) => { e.stopPropagation(); setShowRemainingTime(!showRemainingTime); }}
                    >
                       {showRemainingTime ? (
                         `-${formatTime(Math.max(0, resolvedDuration - currentTime))}`
                       ) : (
                         <>
                           {formatTime(currentTime)}
                           <span className="opacity-60 mx-1 hidden lg:inline">/</span>
                           <span className="opacity-60 hidden lg:inline">{formatTime(resolvedDuration)}</span>
                         </>
                       )}
                    </div>
                  </div>

                  {/* Right Side: Autoplay, Settings, etc. */}
                  <div className="flex items-center gap-1 lg:gap-2">
                    <div className="flex items-center gap-2 lg:gap-3 bg-white/10 lg:bg-white/15 backdrop-blur-md rounded-full px-3 lg:px-4 py-1.5 shadow-sm">
                        {/* YouTube Autoplay Toggle Style - Pixel Exact */}
                        <div 
                          className={`relative w-8 lg:w-9 h-[16px] lg:h-[18px] rounded-full cursor-pointer transition-all duration-200 flex-shrink-0 ${isAutoplayOn ? 'bg-white' : 'bg-white/30'}`} 
                          onClick={(e) => { e.stopPropagation(); setIsAutoplayOn(!isAutoplayOn); }}
                        >
                           <div className={`absolute top-[2px] w-[12px] lg:w-[14px] h-[12px] lg:h-[14px] rounded-full transition-all duration-200 flex items-center justify-center ${isAutoplayOn ? 'left-[18px] lg:left-[20px] bg-black' : 'left-[2px] bg-white shadow-sm'}`}>
                              {isAutoplayOn ? (
                                <svg className="w-[6px] lg:w-[8px] h-[6px] lg:h-[8px] translate-x-[0.5px]" viewBox="0 0 10 10">
                                   <path d="M3 2L8 5L3 8V2Z" fill="white" />
                                </svg>
                              ) : (
                                <svg className="w-[6px] lg:w-[8px] h-[6px] lg:h-[8px]" viewBox="0 0 10 10">
                                   <rect x="3" y="3" width="4" height="4" fill="#52525b" />
                                </svg>
                              )}
                           </div>
                        </div>

                        <button 
                          onClick={() => setIsSubtitlesOn(!isSubtitlesOn)}
                          className={`relative hover:scale-110 transition-all duration-300 p-0.5 ${isSubtitlesOn ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                          title={isSubtitlesOn ? "Turn off subtitles" : "Turn on subtitles"}
                        >
                          <Subtitles size={19} className="text-white" />
                          {isSubtitlesOn && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-red-600 rounded-full shadow-glow-red" />}
                        </button>
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }} 
                            className={`hover:scale-110 transition-all duration-300 opacity-90 hover:opacity-100 p-0.5 ${isSettingsOpen ? 'rotate-90 text-blue-400' : 'rotate-0 text-white'}`}
                            title="Settings"
                          >
                            <Settings size={19} />
                          </button>

                          {/* Settings Popup - ENSURING TOP-TIER Z-INDEX */}
                          {isSettingsOpen && (
                            <div 
                              className="absolute bottom-10 right-0 z-[100] animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200 min-w-[420px] h-64"
                              onMouseLeave={() => setActiveSubMenu(null)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Main Menu Panel (Left-side of popup) */}
                              <div className="absolute right-40 bottom-0 w-64 bg-[#0f0f0f]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl py-2 overflow-hidden flex-shrink-0">
                                {/* Subtitles */}
                                <button 
                                  className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-white text-sm group ${activeSubMenu === 'subtitles' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                  onMouseEnter={() => setActiveSubMenu('subtitles')}
                                >
                                  <div className="flex items-center gap-3">
                                    <Subtitles size={18} className={`${activeSubMenu === 'subtitles' ? 'text-white' : 'text-zinc-400'} group-hover:text-white`} />
                                    <span>Subtitles/CC</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-zinc-400">
                                    <span>{isSubtitlesOn ? 'On' : 'Off'}</span>
                                    <ChevronRight size={14} className={activeSubMenu === 'subtitles' ? 'translate-x-1 transition-transform' : ''} />
                                  </div>
                                </button>

                                {/* Playback speed */}
                                <button 
                                  className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-white text-sm group ${activeSubMenu === 'speed' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                  onMouseEnter={() => setActiveSubMenu('speed')}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-[18px] h-[18px] border-2 rounded-full flex items-center justify-center text-[8px] font-bold ${activeSubMenu === 'speed' ? 'border-white text-white' : 'border-zinc-400 text-zinc-400'} group-hover:border-white group-hover:text-white`}>
                                      {playbackSpeed}x
                                    </div>
                                    <span>Playback speed</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-zinc-400">
                                    <span>{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                                    <ChevronRight size={14} className={activeSubMenu === 'speed' ? 'translate-x-1 transition-transform' : ''} />
                                  </div>
                                </button>

                                {/* Quality */}
                                <button 
                                  className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-white text-sm group ${activeSubMenu === 'quality' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                  onMouseEnter={() => setActiveSubMenu('quality')}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-[18px] h-[18px] flex flex-col items-center justify-center gap-[2px]">
                                       <div className={`w-full h-[1.5px] rounded-full ${activeSubMenu === 'quality' ? 'bg-white' : 'bg-zinc-400'} group-hover:bg-white`} />
                                       <div className={`w-2/3 h-[1.5px] rounded-full ${activeSubMenu === 'quality' ? 'bg-white' : 'bg-zinc-400'} group-hover:bg-white`} />
                                       <div className={`w-full h-[1.5px] rounded-full ${activeSubMenu === 'quality' ? 'bg-white' : 'bg-zinc-400'} group-hover:bg-white`} />
                                    </div>
                                    <span>Quality</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-zinc-400">
                                    <span>{quality}</span>
                                    <ChevronRight size={14} className={activeSubMenu === 'quality' ? 'translate-x-1 transition-transform' : ''} />
                                  </div>
                                </button>
                              </div>

                              {/* Sub Menu Panel (Right-side of popup) */}
                              {activeSubMenu && (
                                <div className="absolute right-0 bottom-0 w-36 bg-[#1a1a1a]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl py-2 animate-in fade-in slide-in-from-left-2 duration-150 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                  {activeSubMenu === 'subtitles' && ['On', 'Off'].map(opt => (
                                    <button 
                                      key={opt}
                                      onClick={() => setIsSubtitlesOn(opt === 'On')}
                                      className={`w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex items-center justify-between ${ (opt === 'On' && isSubtitlesOn) || (opt === 'Off' && !isSubtitlesOn) ? 'text-blue-400 font-bold' : 'text-white' }`}
                                    >
                                      {opt}
                                      {((opt === 'On' && isSubtitlesOn) || (opt === 'Off' && !isSubtitlesOn)) && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                                    </button>
                                  ))}
                                  {activeSubMenu === 'speed' && [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                                    <button 
                                      key={speed}
                                      onClick={() => {
                                        if (videoRef.current) videoRef.current.playbackRate = speed;
                                        setPlaybackSpeed(speed);
                                      }}
                                      className={`w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex items-center justify-between ${playbackSpeed === speed ? 'text-blue-400 font-bold' : 'text-white'}`}
                                    >
                                      {speed === 1 ? 'Normal' : `${speed}x`}
                                      {playbackSpeed === speed && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                                    </button>
                                  ))}
                                  {activeSubMenu === 'quality' && ['Full HD', '1080p', '720p', '480p', '360p', '240p', '144p', 'Auto'].map(q => (
                                    <button 
                                      key={q}
                                      onClick={() => setQuality(q)}
                                      className={`w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex items-center justify-between ${quality === q ? 'text-blue-400 font-bold' : 'text-white'}`}
                                    >
                                      {q}
                                      {quality === q && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleTheatreMode(); }} className="hidden lg:flex hover:scale-110 transition-transform opacity-90 hover:opacity-100 p-0.5" title={isTheatreMode ? "Default view" : "Theatre mode"}>
                          {isTheatreMode ? (
                            <div className="relative w-[22px] h-[16px] border-2 border-white rounded-sm overflow-hidden flex">
                              <div className="flex-1 border-r border-white/30" />
                              <div className="w-[6px] bg-white/20" />
                            </div>
                          ) : (
                            <Monitor size={19} />
                          )}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="hover:scale-110 transition-transform opacity-90 hover:opacity-100 p-0.5">
                          <Maximize size={19} />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Info Section */}
        <div className="px-4 lg:px-0">
          {video ? (
            <>
              <h1 className="text-xl lg:text-2xl font-bold leading-tight mb-1 text-white tracking-tight">
                {videoTitle}
              </h1>
              <div className="flex items-center gap-3 text-[14px] font-medium text-zinc-400 mb-3">
                <span>{videoViews}</span>
                <span>•</span>
                <span>{videoDate}</span>
              </div>
            </>
          ) : (
            <div className="h-7 w-3/4 bg-zinc-800 rounded-lg animate-pulse mb-3" />
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              {/* Channel Info & Subscribe */}
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-3">
                  <Link href={`/channel/${video?.channel_id || '#'}`} className="flex-shrink-0">
                    {channelAvatar ? (
                      <img
                        src={channelAvatar}
                        alt={channelName}
                        className="w-10 h-10 rounded-full object-cover border border-white/5"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 animate-pulse" />
                    )}
                  </Link>
                  <div className="flex flex-col min-w-0">
                    {video ? (
                      <>
                        <Link href={`/channel/${video?.channel_id}`}>
                          <h3 className="font-bold text-[16px] leading-tight truncate flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer">
                            {channelName}
                            <svg className="w-3.5 h-3.5 text-zinc-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          </h3>
                        </Link>
                        <p className="text-[12px] text-zinc-400 font-medium">{subscriberCount !== null ? `${subscriberCount.toLocaleString()} subscribers` : '...'}</p>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse mb-1" />
                        <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
                      </>
                    )}
                  </div>
                </div>
                {video && (
                  <SubscribeButton
                    channelId={video?.channel_id || ''}
                    channelName={channelName}
                    profileId={activeProfileId}
                    showCount={false}
                  />
                )}
              </div>

              {/* Engagement Actions */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="flex items-center bg-white/10 rounded-full h-9 flex-shrink-0 border border-white/5">
                  <button
                    onClick={handleLike}
                    disabled={!video}
                    className={`flex items-center gap-2 px-4 py-1.5 hover:bg-white/10 transition-colors rounded-l-full border-r border-white/10 ${isLiked ? 'text-white' : 'text-zinc-200'} ${!video ? 'opacity-50' : ''}`}
                  >
                    <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                    <span className="text-sm font-bold">{video ? (likes !== null ? likes.toLocaleString() : '--') : "..."}</span>
                  </button>
                  <button
                    onClick={handleDislike}
                    disabled={!video}
                    className={`flex items-center px-4 py-1.5 hover:bg-white/10 transition-colors rounded-r-full ${isDisliked ? 'text-white' : 'text-zinc-200'} ${!video ? 'opacity-50' : ''}`}
                  >
                    <svg className="w-5 h-5 rotate-180" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                  </button>
                </div>

                <button disabled={!video} className={`flex items-center gap-2 h-9 px-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 text-white border border-white/5 ${!video ? 'opacity-50' : ''}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                  <span className="text-sm font-bold">Share</span>
                </button>

                <button
                  onClick={() => setIsSaveOpen(true)}
                  disabled={!video}
                  className={`flex items-center gap-2 h-9 px-4 rounded-full transition-colors flex-shrink-0 border border-white/5 font-bold text-sm ${!video ? 'opacity-50' : isSavedAnywhere ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                  <svg className="w-5 h-5" fill={isSavedAnywhere ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <span>{isSavedAnywhere ? 'Saved' : 'Save'}</span>
                </button>
                
                <button disabled={!video} className={`p-2 h-9 w-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white border border-white/5 flex-shrink-0 ${!video ? 'opacity-50' : ''}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                </button>
              </div>
            </div>

            {/* Description Box */}
            <div 
              className="bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors mb-6 min-h-[100px] cursor-default"
              onClick={() => {
                if (needsExpansion) setIsDescriptionExpanded(!isDescriptionExpanded);
              }}
            >
              {video ? (
                <>
                  <p 
                    ref={descriptionTextRef}
                    className={`text-[14px] text-zinc-200 leading-relaxed whitespace-pre-wrap transition-all ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}
                  >
                    {videoDescription}
                  </p>
                  {needsExpansion && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDescriptionExpanded(!isDescriptionExpanded);
                      }}
                      className="text-[14px] font-bold text-white mt-2 hover:bg-white/10 rounded px-1 -mx-1"
                    >
                      {isDescriptionExpanded ? 'show less' : '...more'}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-zinc-800 rounded animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="pb-8">
            {video ? (
              <Comments
                videoId={watchId}
                profileId={activeProfileId}
                profileName={activeProfileName}
                profileAvatar={activeProfileAvatar}
              />
            ) : (
              <div className="h-[200px] w-full bg-zinc-900/50 rounded-xl" />
            )}
          </div>
        </div>
      </div>

      {/* Related Videos Sidebar */}
      <div className={`${isTheatreMode ? 'w-full max-w-[1200px] mx-auto xl:max-w-none' : 'lg:w-96'} flex flex-col gap-3 px-4 lg:px-0 mt-4 lg:mt-0`}>
        <RelatedVideos
          videoId={watchId}
          category={video?.category}
          channelId={video?.channel_id}
          onVideosLoaded={setRelatedVideos}
        />
      </div>
      {isSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#1f1f1f] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-lg">Save to...</h3>
              <button
                onClick={() => setIsSaveOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Watch Later */}
              <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="w-16 h-10 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
                  <img
                    src={video?.thumbnail_url || '/logo.png'}
                    alt="thumb"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">Watch later</div>
                  <div className="text-xs text-white/50">Private</div>
                </div>
                <button
                  onClick={toggleWatchLater}
                  disabled={isSavingAction}
                  className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                  title={watchLaterSaved ? 'Remove from Watch later' : 'Save to Watch later'}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill={watchLaterSaved ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    strokeWidth={watchLaterSaved ? 0 : 2} 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" 
                    />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10 mx-5 my-2" />

              {/* Playlists Header */}
              <div className="px-5 py-2 text-xs text-white/40 font-medium uppercase tracking-wider">
                Your Playlists
              </div>

              {/* Playlists */}
              {saveLoading ? (
                <div className="px-5 py-3 text-sm text-white/60">Loading playlists...</div>
              ) : playlists.length === 0 ? (
                <div className="px-5 py-3 text-sm text-white/60">No playlists yet.</div>
              ) : (
                playlists.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="w-16 h-10 rounded-md bg-zinc-800 flex items-center justify-center text-white/40 text-xs font-bold flex-shrink-0 overflow-hidden">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h12" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-white/50">{('isPrivate' in p && p.isPrivate) || !('isPrivate' in p) ? 'Private' : 'Public'}</div>
                    </div>
                    <button
                      onClick={() => togglePlaylist(p.id, p.hasVideo)}
                      disabled={isSavingAction}
                      className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                      title={p.hasVideo ? 'Remove from playlist' : 'Save to playlist'}
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill={p.hasVideo ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        strokeWidth={p.hasVideo ? 0 : 2} 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" 
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}

              {saveError && (
                <div className="px-5 py-2 text-sm text-red-400">{saveError}</div>
              )}
            </div>

            {/* New Playlist Button */}
            <div className="px-4 py-3 border-t border-white/10">
              {!isCreatingPlaylist ? (
                <button
                  onClick={() => setIsCreatingPlaylist(true)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New playlist
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Playlist Name Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Enter playlist name"
                      className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none"
                      autoFocus
                    />
                    {newPlaylistName && (
                      <button
                        onClick={() => setNewPlaylistName('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={newPlaylistVisibility === 'private'}
                        onChange={() => setNewPlaylistVisibility('private')}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm text-white">Private</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={newPlaylistVisibility === 'public'}
                        onChange={() => setNewPlaylistVisibility('public')}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-sm text-white">Public</span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setIsCreatingPlaylist(false);
                        setNewPlaylistName('');
                        setNewPlaylistVisibility('private');
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createPlaylist}
                      disabled={!newPlaylistName.trim()}
                      className="flex-1 px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-6 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border ${toast.kind === 'success' ? 'bg-white text-black border-white/40' : 'bg-red-600 text-white border-red-400'
              }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
