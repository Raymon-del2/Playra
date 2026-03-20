'use client';

import { useState, useEffect, useRef, useMemo, use } from 'react';
import Link from 'next/link';
import { getVideoById, recordWatch, isHistoryPaused, incrementViews, Video, updateChannelAvatarInVideos } from '@/lib/supabase';
import { getSubscriberCount } from '@/app/actions/subscription';
import { trackVideoView } from '@/app/actions/views';
import { formatDistanceToNow } from 'date-fns';
import { getActiveProfile } from '@/app/actions/profile';
import { toggleLikeVideo, toggleDislikeVideo, fetchVideoEngagement } from '@/app/actions/engagement';
import Comments from '@/components/Comments';
import RelatedVideos from '@/components/RelatedVideos';
import SubscribeButton from '@/components/SubscribeButton';

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: watchId } = use(params);
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
      }
    }, 400);
  };

  const videoTitle = video?.title || "";
  const videoSrc = video?.video_url || "";
  const channelName = video?.channel_name || "Loading...";
  const channelAvatar = video?.channel_avatar || "";
  const videoViews = video ? `${Math.max(1, video.views ?? 0).toLocaleString()} views` : "";
  const videoDate = video ? formatDistanceToNow(new Date(video.created_at), { addSuffix: true }) : "";
  const videoDescription = video?.description || "";  return (
    <div className="flex flex-col lg:flex-row gap-6 p-0 lg:p-6 bg-[#0f0f0f] min-h-screen">
      <div className="flex-1 lg:max-w-[calc(100vw-450px)]">
        {/* Video Player Section */}
        <div 
          className="aspect-video bg-zinc-900 sm:rounded-xl overflow-hidden mb-4 relative shadow-2xl group/player cursor-pointer"
          onClick={() => !hasStarted && handleStartPlay()}
        >
          {/* Splash Screen / Play Button overlay */}
          {!hasStarted && video && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent group/player">
              {/* Animation Background Ripple */}
              <div className={`absolute inset-0 bg-white rounded-full transition-all duration-700 ease-out pointer-events-none 
                ${isAnimatingPlay ? 'scale-[4] opacity-0' : 'scale-0 opacity-0'}`} />

              {/* Animated Splash Triangle Loader */}
              <div className={`relative transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform 
                ${isAnimatingPlay ? 'scale-[2] opacity-0' : 'scale-100 opacity-100 hover:scale-110 active:scale-95'}`}
              >
                <svg className="w-24 h-24 overflow-visible" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                  {/* Outer Glow */}
                  <path 
                    d="M35,25 L75,50 L35,75 Z" 
                    fill="none" 
                    stroke="url(#playGrad)" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="opacity-30 blur-sm"
                  />
                  {/* Drawing Path */}
                  <path 
                    d="M35,25 L75,50 L35,75 Z" 
                    fill={isAnimatingPlay ? "white" : "none"}
                    stroke={isAnimatingPlay ? "white" : "url(#playGrad)"}
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="transition-colors duration-200"
                    style={{ 
                      strokeDasharray: 200, 
                      strokeDashoffset: 200,
                      animation: 'drawTri 1.5s ease-out forwards' 
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
              className={`w-full h-full ${videoLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 [&::-webkit-media-controls-timeline]:hidden [&::-webkit-media-controls-current-time-display]:hidden [&::-webkit-media-controls-time-remaining-display]:hidden`}
              controls={hasStarted && videoLoaded && duration > 0}
              autoPlay={false}
              poster={video?.thumbnail_url}
              preload="metadata"
              onLoadedData={() => setVideoLoaded(true)}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (d && !Number.isNaN(d)) setDuration(d);
                else if (resolvedDuration > 0) setDuration(resolvedDuration);
              }}
              onTimeUpdate={(e) => {
                const t = e.currentTarget.currentTime;
                setCurrentTime(t);
                const effectiveDuration = duration > 0 ? duration : resolvedDuration;
                if (videoId && effectiveDuration > 0) {
                  persistProgress(videoId, t, effectiveDuration);
                }
              }}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          )}
          
          {/* Custom Progress Bar with Hover Timeline */}
          {hasStarted && videoLoaded && duration > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer group/progress z-20 hover:h-2 transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                if (videoRef.current && resolvedDuration > 0) {
                  videoRef.current.currentTime = pct * resolvedDuration;
                }
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const hoverEl = e.currentTarget.querySelector('.hover-preview') as HTMLElement;
                const tooltipEl = e.currentTarget.querySelector('.hover-tooltip') as HTMLElement;
                if (hoverEl) hoverEl.style.left = `${pct * 100}%`;
                if (tooltipEl) {
                  tooltipEl.style.left = `${pct * 100}%`;
                  tooltipEl.textContent = formatTime(pct * resolvedDuration);
                }
              }}
            >
              {/* Progress fill */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-r"
                style={{ width: `${progressPct}%` }}
              />
              
              {/* Hover preview line */}
              <div className="hover-preview absolute top-0 bottom-0 w-0.5 bg-white/70 opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none" />
              
              {/* Hover time tooltip */}
              <div className="hover-tooltip absolute -top-9 px-2 py-1 bg-black/90 text-white text-xs rounded transform -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" />
              
              {/* Seek handle */}
              <div
                className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${progressPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Video Info Section */}
        <div className="px-4 lg:px-0">
          {video ? (
            <h1 className="text-xl lg:text-2xl font-bold leading-tight mb-2 text-white tracking-tight">
              {videoTitle}
            </h1>
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
            <div className="bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors cursor-pointer group mb-6 min-h-[100px]">
              {video ? (
                <>
                  <div className="flex items-center gap-3 text-[14px] font-bold mb-1 text-white">
                    <span>{videoViews}</span>
                    <span>{videoDate}</span>
                  </div>
                  <p className="text-[14px] text-zinc-200 leading-relaxed whitespace-pre-wrap line-clamp-2 group-hover:line-clamp-none transition-all">
                    {videoDescription}
                  </p>
                  <button className="text-[14px] font-bold text-zinc-400 mt-2">...more</button>
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
      <div className="lg:w-96 flex flex-col gap-3 px-4 lg:px-0">
        <RelatedVideos
          videoId={watchId}
          category={video?.category}
          channelId={video?.channel_id}
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
