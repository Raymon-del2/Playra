'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getVideos, getStyles, Video, getVideoById, incrementViews } from '@/lib/supabase';
import { getActiveProfile } from '@/app/actions/profile';
import { toggleLikeVideo, toggleDislikeVideo, fetchVideoEngagement, fetchBatchVideoEngagement } from '@/app/actions/engagement';
import { addWatchLater, removeWatchLater, listWatchLater } from '@/lib/engagement';
import { fetchBatchWatchLaterStatus } from '@/app/actions/watch-later';
import { getVideoComments, addComment, engageComment, getBatchCommentCounts, Comment as CommentType } from '@/app/actions/comments';
import { getStylesFeed } from '@/app/actions/styles-feed';
import { formatDistanceToNow } from 'date-fns';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  MoreVertical,
  Play,
  Volume2,
  VolumeX,
  Music,
  Bookmark,
  BookmarkCheck,
  Send,
  X,
  History,
  Slash,
  AlertTriangle,
  Link2,
  ChevronUp,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';
import SubscribeButton from '@/components/SubscribeButton';

type ReactionState = {
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
};

const VIDEO_FILTERS = [
  { id: 'none', name: 'Original', class: 'style-none' },
  { id: 'cinema', name: 'Cinema', class: 'style-cinema' },
  { id: 'retro', name: 'Retro', class: 'style-retro' },
  { id: 'neon', name: 'Neon', class: 'style-neon' },
  { id: 'noir', name: 'Noir', class: 'style-noir' },
  { id: 'dreamy', name: 'Dreamy', class: 'style-dreamy' },
  { id: 'warm', name: 'Warm', class: 'style-warm' },
  { id: 'vibrant', name: 'Vibrant', class: 'style-vibrant' },
];

export default function StylesDetailPage() {
  const params = useParams();
  const styleId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  return <StylesFeed styleId={styleId} />;
}

function StylesFeed({ styleId }: { styleId?: string }) {
  const router = useRouter();
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [clips, setClips] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [watchLaterMap, setWatchLaterMap] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isAnimatingPlay, setIsAnimatingPlay] = useState(false);
  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [loadedMetadata, setLoadedMetadata] = useState<Set<string>>(new Set());
  const offsetRef = useRef(0);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const init = async () => {
      try {
        // Load videos immediately (video-first)
        const limit = 15;
        const res = await getStylesFeed(activeProfile?.id, limit, 0);
        if (res.success && res.videos && res.videos.length > 0) {
          const data = res.videos;
          let startIndex = 0;
          const foundIndex = data.findIndex(v => v.id === styleId);
          if (foundIndex !== -1) startIndex = foundIndex;
          setClips(data);
          setActiveIndex(startIndex);
          offsetRef.current = limit;
          if (data.length < limit) setHasMore(false);
          
          // Load engagement data in background
          if (res.engagement) setReactions(res.engagement);
          if (res.watchLater) setWatchLaterMap(res.watchLater);
          if (res.commentCounts) setCommentCounts(res.commentCounts);
        } else {
          setClips([]);
          setHasMore(false);
        }
      } catch (e) { console.error(e); }
    };
    init();
    
    // Load profile in background (non-blocking)
    getActiveProfile().then(profile => setActiveProfile(profile));
  }, [styleId]);

  // Pre-fetch next videos using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1 && index + 1 < clips.length) {
              const nextClip = clips[index + 1];
              if (nextClip && !loadedMetadata.has(nextClip.id)) {
                // Pre-load metadata for next video
                fetchVideoEngagement(nextClip.id, activeProfile?.id).then((res) => {
                  if (res) {
                    setReactions((prev) => ({ ...prev, [nextClip.id]: res }));
                    setLoadedMetadata((prev) => new Set(prev).add(nextClip.id));
                  }
                });
                fetchBatchWatchLaterStatus([nextClip.id], activeProfile?.id).then((res) => {
                  if (res) {
                    setWatchLaterMap((prev) => ({ ...prev, ...res }));
                  }
                });
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [clips, activeProfile, loadedMetadata]);

  useEffect(() => {
    if (activeIndex >= clips.length - 3 && hasMore && !isFetchingMore && clips.length > 0) {
      const loadMore = async () => {
        setIsFetchingMore(true);
        const limit = 10;
        const res = await getStylesFeed(activeProfile?.id, limit, offsetRef.current);
        if (res.success && res.videos && res.videos.length > 0) {
          const newData = res.videos;
          setClips(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            return [...prev, ...newData.filter(n => !existingIds.has(n.id))];
          });
          setReactions(prev => ({ ...prev, ...res.engagement }));
          setWatchLaterMap(prev => ({ ...prev, ...res.watchLater }));
          setCommentCounts(prev => ({ ...prev, ...res.commentCounts }));
          offsetRef.current += limit;
          if (newData.length < limit) setHasMore(false);
        } else { setHasMore(false); }
        setIsFetchingMore(false);
      };
      loadMore();
    }
  }, [activeIndex, clips.length, hasMore, isFetchingMore, activeProfile]);

  useEffect(() => {
    document.documentElement.classList.add('styles-scrollbar-hidden');
    document.body.classList.add('styles-scrollbar-hidden');
    return () => {
      document.documentElement.classList.remove('styles-scrollbar-hidden');
      document.body.classList.remove('styles-scrollbar-hidden');
    };
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== activeIndex && index >= 0 && index < clips.length) {
      setActiveIndex(index);
      window.history.replaceState(null, '', `/styles/${clips[index].id}`);
    }
  }, [activeIndex, clips]);

  const prevActiveRef = useRef<number>(-1);
  useEffect(() => {
    if (prevActiveRef.current !== -1 && prevActiveRef.current !== activeIndex) {
      const prevVideo = videoRefs.current[prevActiveRef.current];
      if (prevVideo) { prevVideo.pause(); prevVideo.currentTime = 0; }
    }
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      if (isPlaying) { currentVideo.play().catch(() => {}); }
      else { currentVideo.pause(); }
    }
    // Preload next video
    if (activeIndex + 1 < clips.length) {
      const nextVideo = videoRefs.current[activeIndex + 1];
      if (nextVideo && nextVideo.preload !== 'auto') {
        nextVideo.load(); // Start loading next video
      }
    }
    prevActiveRef.current = activeIndex;
  }, [activeIndex, isPlaying, clips]);

  const viewedClipsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const clip = clips[activeIndex];
    if (!clip || viewedClipsRef.current.has(clip.id)) return;
    viewedClipsRef.current.add(clip.id);
    incrementViews(clip.id).then(newViews => {
      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, views: newViews } : c));
    }).catch(() => {});
  }, [activeIndex, clips]);

  useEffect(() => {
    videoRefs.current.forEach(v => { if (v) v.muted = isMuted; });
  }, [isMuted, clips.length]);

  const handleManualScroll = (index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isPlaying) {
      setIsAnimatingPlay(true);
      setTimeout(() => { setIsAnimatingPlay(false); setIsPlaying(true); }, 400);
    } else { setIsPlaying(false); }
  };

  const handleLike = async (id: string) => {
    if (!activeProfile) { alert('Please sign in to like videos'); return; }
    const currentState = reactions[id];
    if (!currentState) return;
    const isCurrentlyLiked = currentState.isLiked;
    setReactions(prev => {
      const state = prev[id];
      if (!state) return prev;
      return { ...prev, [id]: { ...state, likes: isCurrentlyLiked ? state.likes - 1 : state.likes + 1, isLiked: !isCurrentlyLiked, isDisliked: false } };
    });
    try { await toggleLikeVideo(id, activeProfile.id, isCurrentlyLiked); }
    catch { setReactions(prev => { const state = prev[id]; if (!state) return prev; return { ...prev, [id]: { ...state, likes: isCurrentlyLiked ? state.likes : state.likes - 1, isLiked: isCurrentlyLiked } }; }); }
  };

  const handleDislike = async (id: string) => {
    if (!activeProfile) { alert('Please sign in to dislike videos'); return; }
    const currentState = reactions[id];
    if (!currentState) return;
    const isCurrentlyDisliked = currentState.isDisliked;
    const isCurrentlyLiked = currentState.isLiked;
    setReactions(prev => {
      const state = prev[id];
      if (!state) return prev;
      return { ...prev, [id]: { ...state, isDisliked: !isCurrentlyDisliked, isLiked: false, likes: isCurrentlyLiked ? state.likes - 1 : state.likes } };
    });
    try { await toggleDislikeVideo(id, activeProfile.id, isCurrentlyDisliked); }
    catch { setReactions(prev => { const state = prev[id]; if (!state) return prev; return { ...prev, [id]: { ...state, isDisliked: isCurrentlyDisliked, isLiked: isCurrentlyLiked, likes: isCurrentlyLiked ? state.likes : state.likes + 1 } }; }); }
  };

  const handleSave = async (id: string) => {
    if (!activeProfile) { alert('Please sign in to save videos'); return; }
    const isSaved = watchLaterMap[id];
    setWatchLaterMap(prev => ({ ...prev, [id]: !isSaved }));
    try { isSaved ? await removeWatchLater(activeProfile.id, id) : await addWatchLater(activeProfile.id, id); }
    catch { setWatchLaterMap(prev => ({ ...prev, [id]: isSaved })); }
  };

  const loadComments = async (videoId: string) => {
    if (!videoId) return;
    try {
      const data = await getVideoComments(videoId, activeProfile?.id);
      setComments(data);
      setCommentCounts(prev => ({ ...prev, [videoId]: data.length }));
    } catch (e) { console.error(e); }
  };

  const handleSubmitComment = async () => {
    if (!activeProfile || !newComment.trim() || !activeClip) return;
    const commentText = newComment.trim();
    setNewComment('');
    const optimisticComment: CommentType = {
      id: `temp-${Date.now()}`, video_id: activeClip.id, content: commentText,
      profile_id: activeProfile.id, profile_name: activeProfile.name || 'You',
      profile_avatar: activeProfile.avatar, created_at: new Date().toISOString(),
      likes: 0, dislikes: 0, parent_id: null, user_liked: false
    };
    setComments(prev => [optimisticComment, ...prev]);
    setCommentCounts(prev => ({ ...prev, [activeClip.id]: (prev[activeClip.id] || 0) + 1 }));
    try {
      await addComment(activeClip.id, activeProfile.id, commentText);
      const fresh = await getVideoComments(activeClip.id, activeProfile.id);
      setComments(fresh);
      setCommentCounts(prev => ({ ...prev, [activeClip.id]: fresh.length }));
    } catch {
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setCommentCounts(prev => ({ ...prev, [activeClip.id]: Math.max(0, (prev[activeClip.id] || 0) - 1) }));
      setNewComment(commentText);
    }
  };

  const handleCommentLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!activeProfile) { alert('Please sign in'); return; }
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, user_liked: !currentlyLiked, user_disliked: false, likes: !currentlyLiked ? c.likes + 1 : c.likes - 1 } : c));
    try { await engageComment(commentId, activeProfile.id, currentlyLiked ? null : 'like'); } catch { console.error('Failed'); }
  };

  const handleCommentDislike = async (commentId: string, currentlyDisliked: boolean) => {
    if (!activeProfile) { alert('Please sign in'); return; }
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, user_disliked: !currentlyDisliked, user_liked: false, likes: c.user_liked ? c.likes - 1 : c.likes } : c));
    try { await engageComment(commentId, activeProfile.id, currentlyDisliked ? null : 'dislike'); } catch { console.error('Failed'); }
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/styles/${id}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const activeClip = clips[activeIndex];

  return (
    <div className="yt-shorts-root">
      {/* Back Button (Top Left) */}
      <button className="yt-back-btn" onClick={() => router.back()} aria-label="Go back">
        <ChevronLeft size={28} />
      </button>

      {/* Scroll Container */}
      <div className="yt-shorts-scroller hide-scrollbar" onScroll={handleScroll}>
        {clips.length === 0 ? (
          <div className="yt-slide">
            <div className="yt-slide-inner">
              <div className="yt-video-wrap bg-black">
                {/* No videos yet */}
              </div>
            </div>
          </div>
        ) : clips.map((clip, index) => (
          <div
            key={clip.id}
            ref={el => { slideRefs.current[index] = el; }}
            className="yt-slide"
          >
            <div className="yt-slide-inner">

              {/* ── VIDEO COLUMN ── */}
              <div className="yt-video-col">
                <div className="yt-video-wrap">
                  <video
                    ref={el => { videoRefs.current[index] = el; }}
                    src={clip.video_url}
                    preload={index === activeIndex ? 'auto' : 'none'}
                    className={`yt-video ${VIDEO_FILTERS[activeFilterIndex].class}`}
                    loop playsInline muted={isMuted}
                    onTimeUpdate={e => {
                      const v = e.currentTarget;
                      setProgress(prev => ({ ...prev, [clip.id]: (v.currentTime / v.duration) * 100 }));
                    }}
                    onClick={togglePlay}
                  />

                  {/* Pause overlay */}
                  {!isPlaying && index === activeIndex && (
                    <div className="yt-play-overlay" onClick={togglePlay}>
                      <div className={`yt-play-ripple ${isAnimatingPlay ? 'yt-play-ripple--active' : ''}`} />
                      <div className={`yt-play-btn-wrap ${isAnimatingPlay ? 'yt-play-btn-wrap--exit' : ''}`}>
                        <svg className="yt-play-svg" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="48" fill="rgba(0,0,0,0.6)" />
                          <path d="M38,28 L72,50 L38,72 Z" fill="white" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Mute button */}
                  <button className="yt-mute-btn" onClick={e => { e.stopPropagation(); setIsMuted(!isMuted); }}>
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  {/* Mobile-only action buttons (right side overlay) */}
                  <div className="yt-mobile-actions">
                    {/* Channel avatar */}
                    <div className="yt-mob-avatar-wrap">
                      <Link href={`/channel/${clip.channel_id}`} onClick={e => e.stopPropagation()}>
                        <img src={clip.channel_avatar || '/default-avatar.png'} className="yt-mob-avatar" alt="" />
                      </Link>
                      <div className="yt-mob-sub-dot">
                        <SubscribeButton channelId={clip.channel_id} channelName={clip.channel_name} profileId={activeProfile?.id} showCount={false} size="sm" className="yt-sub-dot-btn" />
                      </div>
                    </div>

                    <YTActionBtn
                      icon={<ThumbsUp size={22} className={reactions[clip.id]?.isLiked ? 'fill-white' : ''} />}
                      label={(reactions[clip.id]?.likes || 0).toLocaleString()}
                      active={reactions[clip.id]?.isLiked}
                      onClick={e => { e.stopPropagation(); handleLike(clip.id); }}
                    />
                    <YTActionBtn
                      icon={<ThumbsDown size={22} className={reactions[clip.id]?.isDisliked ? 'fill-white' : ''} />}
                      label="Dislike"
                      active={reactions[clip.id]?.isDisliked}
                      onClick={e => { e.stopPropagation(); handleDislike(clip.id); }}
                    />
                    <YTActionBtn
                      icon={<MessageCircle size={22} />}
                      label={(commentCounts[clip.id] || 0).toLocaleString()}
                      onClick={e => { e.stopPropagation(); setShowComments(true); loadComments(clip.id); }}
                    />
                    <YTActionBtn
                      icon={<Share2 size={22} />}
                      label="Share"
                      onClick={e => { e.stopPropagation(); setShowShare(true); }}
                    />
                    <div className="yt-mob-more-wrap">
                      <YTActionBtn
                        icon={<MoreVertical size={22} />}
                        label=""
                        onClick={e => { e.stopPropagation(); setShowOptionsId(clip.id === showOptionsId ? null : clip.id); }}
                      />
                      {showOptionsId === clip.id && (
                        <div className="yt-options-menu" onClick={e => e.stopPropagation()}>
                          {[
                            { label: 'Save to Watch later', icon: History, action: () => handleSave(clip.id) },
                            { label: 'Not interested', icon: Slash, action: () => setShowOptionsId(null) },
                            { label: 'Report', icon: AlertTriangle, action: () => setShowOptionsId(null) },
                            { label: 'Copy Link', icon: Link2, action: () => copyToClipboard(clip.id) },
                          ].map((item, i) => (
                            <button key={i} className="yt-option-item" onClick={() => { item.action(); setShowOptionsId(null); }}>
                              <item.icon size={16} />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom overlay - info (visible on mobile) */}
                  <div className="yt-video-info-overlay">
                    <div className="yt-info-channel-row">
                      <Link href={`/channel/${clip.channel_id}`} onClick={e => e.stopPropagation()} className="yt-info-avatar-link">
                        <img src={clip.channel_avatar || '/default-avatar.png'} className="yt-info-avatar" alt="" />
                      </Link>
                      <Link href={`/channel/${clip.channel_id}`} onClick={e => e.stopPropagation()} className="yt-info-channel-name">
                        @{clip.channel_name.replace(/^@/, '')}
                      </Link>
                    </div>
                    <p className="yt-info-title">{clip.title}</p>
                    <div className="yt-info-sound">
                      <Music size={12} />
                      <span>Original Sound · @{clip.channel_name.replace(/^@/, '')}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="yt-progress-track">
                    <div className="yt-progress-fill" style={{ width: `${progress[clip.id] || 0}%` }} />
                  </div>
                </div>
              </div>

              {/* ── DESKTOP ACTIONS COLUMN ── */}
              <div className="yt-desktop-actions">

                {/* Like */}
                <div className="yt-action-item">
                  <button
                    className={`yt-action-circle ${reactions[clip.id]?.isLiked ? 'yt-action-circle--active' : ''}`}
                    onClick={() => handleLike(clip.id)}
                  >
                    <ThumbsUp size={22} className={reactions[clip.id]?.isLiked ? 'fill-white' : ''} />
                  </button>
                  <span className="yt-action-label">{(reactions[clip.id]?.likes || 0).toLocaleString()}</span>
                </div>

                {/* Dislike */}
                <div className="yt-action-item">
                  <button
                    className={`yt-action-circle ${reactions[clip.id]?.isDisliked ? 'yt-action-circle--active' : ''}`}
                    onClick={() => handleDislike(clip.id)}
                  >
                    <ThumbsDown size={22} className={reactions[clip.id]?.isDisliked ? 'fill-white' : ''} />
                  </button>
                  <span className="yt-action-label">Dislike</span>
                </div>

                {/* Comments */}
                <div className="yt-action-item">
                  <button
                    className="yt-action-circle"
                    onClick={() => { setShowComments(true); loadComments(clip.id); }}
                  >
                    <MessageCircle size={22} />
                  </button>
                  <span className="yt-action-label">{(commentCounts[clip.id] || 0).toLocaleString()}</span>
                </div>

                {/* Share */}
                <div className="yt-action-item">
                  <button className="yt-action-circle" onClick={() => setShowShare(true)}>
                    <Share2 size={22} />
                  </button>
                  <span className="yt-action-label">Share</span>
                </div>

                {/* More */}
                <div className="yt-action-item yt-desktop-more">
                  <button
                    className="yt-action-circle"
                    onClick={e => { e.stopPropagation(); setShowOptionsId(clip.id === showOptionsId ? null : clip.id); }}
                  >
                    <MoreVertical size={22} />
                  </button>
                  {showOptionsId === clip.id && (
                    <div className="yt-options-menu yt-options-menu--desktop" onClick={e => e.stopPropagation()}>
                      {[
                        { label: 'Save to Watch later', icon: History, action: () => handleSave(clip.id) },
                        { label: 'Not interested', icon: Slash, action: () => setShowOptionsId(null) },
                        { label: 'Report', icon: AlertTriangle, action: () => setShowOptionsId(null) },
                        { label: 'Copy Link', icon: Link2, action: () => copyToClipboard(clip.id) },
                      ].map((item, i) => (
                        <button key={i} className="yt-option-item" onClick={() => { item.action(); setShowOptionsId(null); }}>
                          <item.icon size={16} />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Channel avatar */}
                <Link href={`/channel/${clip.channel_id}`} onClick={e => e.stopPropagation()} className="yt-desktop-avatar-link">
                  <img src={clip.channel_avatar || '/default-avatar.png'} className="yt-desktop-avatar" alt="" />
                </Link>
              </div>

            </div>
          </div>
        ))}

        {isFetchingMore && (
          <div className="yt-loading-more">
            <div className="yt-spinner" />
          </div>
        )}
      </div>

      {/* ── FLOATING NAV ARROWS (desktop only, fixed right edge) ── */}
      <div className="yt-float-nav">
        {activeIndex > 0 && (
          <button
            className="yt-float-arrow"
            onClick={() => handleManualScroll(activeIndex - 1)}
            aria-label="Previous video"
          >
            <ChevronUp size={24} />
          </button>
        )}
        {activeIndex < clips.length - 1 && (
          <button
            className="yt-float-arrow"
            onClick={() => handleManualScroll(activeIndex + 1)}
            aria-label="Next video"
          >
            <ChevronDown size={24} />
          </button>
        )}
      </div>

      {/* Comments Panel */}
      {showComments && activeClip && (
        <div className="yt-panel-backdrop" onClick={() => setShowComments(false)}>
          <div className="yt-panel" onClick={e => e.stopPropagation()}>
            <div className="yt-panel-header">
              <h3 className="yt-panel-title">{commentCounts[activeClip?.id] || 0} Comments</h3>
              <button className="yt-panel-close" onClick={() => setShowComments(false)}><X size={20} /></button>
            </div>
            <div className="yt-panel-body">
              {comments.length === 0 ? (
                <div className="yt-empty-comments">
                  <MessageCircle size={36} className="yt-empty-icon" />
                  <p className="yt-empty-title">No comments yet</p>
                  <p className="yt-empty-sub">Be the first to comment!</p>
                </div>
              ) : comments.map(comment => (
                <div key={comment.id} className="yt-comment">
                  <Link href={`/channel/${comment.profile_id}`}>
                    <div className="yt-comment-avatar">
                      {comment.profile_avatar
                        ? <img src={comment.profile_avatar} alt="" className="yt-comment-avatar-img" />
                        : <span>{comment.profile_name?.[0]?.toUpperCase() || '?'}</span>}
                    </div>
                  </Link>
                  <div className="yt-comment-body">
                    <div className="yt-comment-meta">
                      <Link href={`/channel/${comment.profile_id}`} className="yt-comment-name">@{comment.profile_name?.replace(/^@/, '')}</Link>
                      <span className="yt-comment-time">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="yt-comment-text">{comment.content}</p>
                    <div className="yt-comment-actions">
                      <button className={`yt-comment-btn ${comment.user_liked ? 'yt-comment-btn--active' : ''}`} onClick={() => handleCommentLike(comment.id, comment.user_liked || false)}>
                        <ThumbsUp size={14} className={comment.user_liked ? 'fill-current' : ''} />
                        {comment.likes > 0 && <span>{comment.likes}</span>}
                      </button>
                      <button className={`yt-comment-btn ${comment.user_disliked ? 'yt-comment-btn--active' : ''}`} onClick={() => handleCommentDislike(comment.id, comment.user_disliked || false)}>
                        <ThumbsDown size={14} className={comment.user_disliked ? 'fill-current' : ''} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="yt-panel-footer">
              {activeProfile ? (
                <div className="yt-comment-input-row">
                  <div className="yt-comment-input-avatar">
                    {activeProfile?.avatar
                      ? <img src={activeProfile.avatar} alt="" className="yt-comment-avatar-img" />
                      : <span>{activeProfile?.name?.[0]?.toUpperCase() || '?'}</span>}
                  </div>
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                    placeholder="Add a comment..."
                    className="yt-comment-input"
                  />
                  <button onClick={handleSubmitComment} disabled={!newComment.trim()} className="yt-comment-send">
                    <Send size={16} />
                  </button>
                </div>
              ) : (
                <div className="yt-signin-prompt">
                  <Link href="/signin" className="yt-signin-link">Sign in to comment</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Sheet */}
      {showShare && activeClip && (
        <div className="yt-panel-backdrop" onClick={() => setShowShare(false)}>
          <div className="yt-share-sheet" onClick={e => e.stopPropagation()}>
            <div className="yt-panel-header">
              <h3 className="yt-panel-title">Share</h3>
              <button className="yt-panel-close" onClick={() => setShowShare(false)}><X size={20} /></button>
            </div>
            <div className="yt-share-apps">
              {['WhatsApp', 'Facebook', 'X', 'Email', 'Copy'].map(app => (
                <button key={app} className="yt-share-app" onClick={() => app === 'Copy' && copyToClipboard(activeClip.id)}>
                  <div className="yt-share-icon">
                    {app === 'Copy' && shareCopied
                      ? <svg className="yt-check" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      : <span className="yt-share-letter">{app[0]}</span>}
                  </div>
                  <span className="yt-share-app-label">{app}</span>
                </button>
              ))}
            </div>
            <div className="yt-share-url-row">
              <div className="yt-share-url">{typeof window !== 'undefined' ? `${window.location.origin}/styles/${activeClip.id}` : ''}</div>
              <button className={`yt-share-copy-btn ${shareCopied ? 'yt-share-copy-btn--copied' : ''}`} onClick={() => copyToClipboard(activeClip.id)}>
                {shareCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* ── ROOT ── */
        .yt-shorts-root {
          position: fixed;
          top: 56px; /* Navbar height */
          left: 0;
          bottom: 0;
          right: 0;
          background: #000;
          z-index: 10;
        }
        .yt-back-btn {
          position: absolute;
          top: 14px;
          left: 14px;
          color: #fff;
          background: none;
          border: none;
          cursor: pointer;
          z-index: 60;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .yt-back-btn:active { transform: scale(0.85); }

        .yt-shorts-scroller {
          height: 100%;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
        }

        /* ── SLIDE ── */
        .yt-slide {
          height: 100%;
          width: 100%;
          scroll-snap-align: start;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f0f0f;
        }

        /* Desktop slide inner: video + actions side-by-side */
        .yt-slide-inner {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 100%;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          padding: 12px 0;
          gap: 0;
        }

        /* ── VIDEO COLUMN ── */
        .yt-video-col {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          flex-shrink: 0;
        }

        .yt-video-wrap {
          position: relative;
          /* On desktop: fixed height, 9:16 aspect */
          height: 100%;
          max-height: calc(100vh - 80px);
          aspect-ratio: 9/16;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6);
        }

        .yt-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: pointer;
          display: block;
        }

        /* ── SKELETON ── */
        .skeleton-pulse {
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        .skeleton-inner {
          width: 100%;
          height: 100%;
          background: #1a1a1a;
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ── PLAY OVERLAY ── */
        .yt-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
        }
        .yt-play-ripple {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          transform: scale(0);
          opacity: 0;
          transition: transform 0.7s ease-out, opacity 0.7s ease-out;
          pointer-events: none;
        }
        .yt-play-ripple--active {
          transform: scale(4);
          opacity: 0;
        }
        .yt-play-btn-wrap {
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .yt-play-btn-wrap--exit {
          transform: scale(2);
          opacity: 0;
        }
        .yt-play-svg {
          width: 72px;
          height: 72px;
          filter: drop-shadow(0 2px 12px rgba(0,0,0,0.5));
        }

        /* ── MUTE BUTTON ── */
        .yt-mute-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 25;
          transition: background 0.2s;
        }
        .yt-mute-btn:hover { background: rgba(0,0,0,0.7); }

        /* ── MOBILE ACTIONS (right side overlay) ── */
        .yt-mobile-actions {
          position: absolute;
          right: 8px;
          bottom: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          z-index: 30;
        }

        /* Mobile avatar */
        .yt-mob-avatar-wrap {
          position: relative;
          margin-bottom: 4px;
        }
        .yt-mob-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid #fff;
          object-fit: cover;
          display: block;
        }
        /* Subscribe dot hidden — cleaner look like YT Shorts */
        .yt-mob-sub-dot { display: none; }

        /* Bottom info overlay (mobile only) */
        .yt-video-info-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 60px;
          padding: 12px 14px 18px;
          background: transparent;
          z-index: 20;
        }
        .yt-info-channel-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .yt-info-avatar-link {}
        .yt-info-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid rgba(255,255,255,0.4);
        }
        .yt-info-channel-name {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
        }
        .yt-info-channel-name:hover { text-decoration: underline; }
        .yt-sub-btn-overlay {
          height: 28px !important;
          min-width: 80px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          border-radius: 20px !important;
        }
        .yt-info-title {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          margin: 0 0 4px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .yt-info-sound {
          display: flex;
          align-items: center;
          gap: 4px;
          color: rgba(255,255,255,0.85);
          font-size: 12px;
        }
        .yt-info-sound span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── PROGRESS BAR ── */
        .yt-progress-track {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: transparent;
          z-index: 40;
        }
        .yt-progress-fill {
          height: 100%;
          background: linear-gradient(to right, #3B82F6, #A855F7);
          transition: width 0.1s linear;
          box-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
        }

        /* ── DESKTOP ACTIONS ── */
        .yt-desktop-actions {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 16px;
          padding-left: 12px;
          gap: 4px;
          flex-shrink: 0;
          height: 100%;
        }

        /* ── FLOATING NAV ARROWS (desktop only) ── */
        .yt-float-nav {
          display: none;
          position: fixed;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          flex-direction: column;
          gap: 8px;
          z-index: 50;
          pointer-events: none;
        }
        .yt-float-arrow {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #272727;
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          pointer-events: all;
          transition: background 0.2s, transform 0.15s;
          box-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .yt-float-arrow:hover { background: #3f3f3f; }
        .yt-float-arrow:active { transform: scale(0.92); }

        .yt-action-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          margin-bottom: 8px;
          position: relative;
        }
        .yt-action-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #272727;
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .yt-action-circle:hover { background: #3f3f3f; }
        .yt-action-circle:active { transform: scale(0.92); }
        .yt-action-circle--active { background: #272727; color: #fff; }
        .yt-action-label {
          font-size: 12px;
          font-weight: 600;
          color: #aaa;
          text-align: center;
          min-width: 48px;
        }

        .yt-desktop-more { position: relative; }

        .yt-desktop-avatar-link {
          display: block;
          margin-top: 8px;
        }
        .yt-desktop-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.2);
          transition: border-color 0.2s;
          display: block;
        }
        .yt-desktop-avatar:hover { border-color: rgba(255,255,255,0.5); }

        /* ── OPTIONS MENU ── */
        .yt-mob-more-wrap { position: relative; }
        .yt-options-menu {
          position: absolute;
          right: 56px;
          bottom: 0;
          width: 220px;
          background: #212121;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          z-index: 100;
          animation: menuPop 0.15s ease-out;
        }
        .yt-options-menu--desktop {
          right: 56px;
          bottom: 0;
        }
        @keyframes menuPop {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .yt-option-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }
        .yt-option-item:hover { background: rgba(255,255,255,0.1); }

        /* ── MOBILE ACTION BTN (YTActionBtn) ── */
        .yt-mob-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: #fff;
        }
        .yt-mob-action-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .yt-mob-action-circle:active { transform: scale(0.88); }
        .yt-mob-action-circle--active { background: rgba(255,255,255,0.25); }
        .yt-mob-action-label {
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          text-align: center;
          min-width: 44px;
        }

        /* ── LOADING ── */
        .yt-loading-more {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .yt-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── PANEL (Comments / Share) ── */
        .yt-panel-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 200;
        }
        .yt-panel {
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          width: 100%;
          max-width: 420px;
          background: #212121;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.25s ease-out;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .yt-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .yt-panel-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .yt-panel-close {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: none;
          border: none;
          color: #aaa;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .yt-panel-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .yt-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .yt-panel-footer {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 12px 16px;
          flex-shrink: 0;
          background: #212121;
        }

        /* ── COMMENTS ── */
        .yt-empty-comments {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 0;
          gap: 8px;
        }
        .yt-empty-icon { color: #555; }
        .yt-empty-title { font-size: 16px; font-weight: 700; color: #fff; margin: 0; }
        .yt-empty-sub { font-size: 13px; color: #666; margin: 0; }

        .yt-comment {
          display: flex;
          gap: 12px;
        }
        .yt-comment-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #333;
          flex-shrink: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #aaa;
        }
        .yt-comment-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .yt-comment-body { flex: 1; min-width: 0; }
        .yt-comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .yt-comment-name { font-size: 12px; font-weight: 700; color: #fff; text-decoration: none; }
        .yt-comment-name:hover { color: #aaa; }
        .yt-comment-time { font-size: 11px; color: #666; }
        .yt-comment-text { font-size: 13px; color: #ddd; line-height: 1.5; word-break: break-word; }
        .yt-comment-actions { display: flex; gap: 12px; margin-top: 6px; }
        .yt-comment-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #888;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }
        .yt-comment-btn:hover { color: #fff; }
        .yt-comment-btn--active { color: #3ea6ff; }

        .yt-comment-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .yt-comment-input-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #333;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #aaa;
        }
        .yt-comment-input {
          flex: 1;
          background: #333;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          color: #fff;
          font-size: 13px;
          outline: none;
        }
        .yt-comment-input::placeholder { color: #888; }
        .yt-comment-send {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #3ea6ff;
          border: none;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .yt-comment-send:disabled { background: #333; color: #666; cursor: default; }
        .yt-comment-send:hover:not(:disabled) { background: #65b8ff; }

        .yt-signin-prompt { text-align: center; }
        .yt-signin-link { color: #3ea6ff; font-size: 14px; font-weight: 700; text-decoration: none; }

        /* ── SHARE SHEET ── */
        .yt-share-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #212121;
          border-radius: 20px 20px 0 0;
          padding-bottom: env(safe-area-inset-bottom, 16px);
          animation: slideUp 0.25s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .yt-share-apps {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          overflow-x: auto;
        }
        .yt-share-app {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          min-width: 56px;
        }
        .yt-share-icon {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .yt-share-app:hover .yt-share-icon { background: #444; }
        .yt-share-letter { font-size: 18px; font-weight: 700; color: #fff; }
        .yt-check { width: 20px; height: 20px; color: #4ade80; }
        .yt-share-app-label { font-size: 11px; color: #aaa; }
        .yt-share-url-row {
          display: flex;
          gap: 8px;
          padding: 0 20px 20px;
          align-items: center;
        }
        .yt-share-url {
          flex: 1;
          background: #333;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          color: #aaa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yt-share-copy-btn {
          background: #fff;
          color: #000;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .yt-share-copy-btn--copied { background: #4ade80; color: #000; }

        /* ── SCROLLBAR HIDING ── */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── RESPONSIVE ── */

        /* MOBILE: full-screen video, actions overlaid */
        @media (max-width: 767px) {
          .yt-shorts-root { top: 0; }
          .yt-slide-inner {
            padding: 0;
            max-width: 100%;
          }
          .yt-video-col {
            width: 100%;
            height: 100%;
          }
          .yt-progress-track { height: 0 !important; }
          .yt-video-wrap {
            border-radius: 0;
            width: 100vw;
            height: 100%;
            max-height: 100%;
            aspect-ratio: unset;
            box-shadow: none;
            border: none;
          }
          .yt-desktop-actions { display: none !important; }
          .yt-float-nav { display: none !important; }
          .yt-mobile-actions { display: flex; }
          .yt-video-info-overlay { display: block; }
        }

        /* TABLET / DESKTOP */
        @media (min-width: 768px) {
          .yt-mobile-actions { display: none; }
          .yt-video-info-overlay {
            /* On desktop show info below but inside the video overlay area */
            right: 0;
          }
          .yt-desktop-actions { display: flex; }
          .yt-float-nav { display: flex; }
          .yt-slide-inner {
            align-items: flex-end;
            padding: 16px 0;
          }
        }

        /* Large desktop: constrain video height */
        @media (min-width: 1024px) {
          .yt-video-wrap {
            max-height: calc(100vh - 100px);
          }
        }
      `}</style>
    </div>
  );
}

/* Reusable mobile action button */
function YTActionBtn({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button className="yt-mob-action-btn" onClick={onClick}>
      <div className={`yt-mob-action-circle ${active ? 'yt-mob-action-circle--active' : ''}`}>
        {icon}
      </div>
      {label && <span className="yt-mob-action-label">{label}</span>}
    </button>
  );
}
