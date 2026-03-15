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
  ChevronDown
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
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [watchLaterMap, setWatchLaterMap] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [shareCopied, setShareCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [showFilterToast, setShowFilterToast] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isAnimatingPlay, setIsAnimatingPlay] = useState(false);
  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const offsetRef = useRef(0);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        setIsLoading(true);
        const profile = await getActiveProfile();
        setActiveProfile(profile);
        const filterType = profile?.account_type || 'general';

        const limit = 15;
        const res = await getStylesFeed(profile?.id, limit, 0);

        if (res.success && res.videos && res.videos.length > 0) {
          const data = res.videos;
          let startIndex = 0;
          const foundIndex = data.findIndex(v => v.id === styleId);
          if (foundIndex !== -1) startIndex = foundIndex;

          setClips(data);
          setReactions(res.engagement || {});
          setWatchLaterMap(res.watchLater || {});
          setCommentCounts(res.commentCounts || {});
          
          setActiveIndex(startIndex);
          offsetRef.current = limit;
          if (data.length < limit) setHasMore(false);
        } else {
          setClips([]);
          setHasMore(false);
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    }
    init();
  }, [styleId]);

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
            const uniqueNew = newData.filter(n => !existingIds.has(n.id));
            return [...prev, ...uniqueNew];
          });
          
          setReactions(prev => ({ ...prev, ...res.engagement }));
          setWatchLaterMap(prev => ({ ...prev, ...res.watchLater }));
          setCommentCounts(prev => ({ ...prev, ...res.commentCounts }));
          
          offsetRef.current += limit;
          if (newData.length < limit) setHasMore(false);
        } else {
          setHasMore(false);
        }
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
    const scrollPos = container.scrollTop;
    const height = container.clientHeight;
    const index = Math.round(scrollPos / height);

    if (index !== activeIndex && index >= 0 && index < clips.length) {
      setActiveIndex(index);
      const newClip = clips[index];
      window.history.replaceState(null, '', `/styles/${newClip.id}`);
    }
  }, [activeIndex, clips]);

  // Targeted playback control
  const prevActiveRef = useRef<number>(-1);
  useEffect(() => {
    // Pause previous
    if (prevActiveRef.current !== -1 && prevActiveRef.current !== activeIndex) {
      const prevVideo = videoRefs.current[prevActiveRef.current];
      if (prevVideo) {
        prevVideo.pause();
        prevVideo.currentTime = 0;
      }
    }

    // Play current
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.play().catch(() => { });
      } else {
        currentVideo.pause();
      }
    }

    prevActiveRef.current = activeIndex;
  }, [activeIndex, isPlaying]);

  // Increment views when clip becomes active (with cooldown)
  const viewedClipsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const clip = clips[activeIndex];
    if (!clip || viewedClipsRef.current.has(clip.id)) return;
    
    viewedClipsRef.current.add(clip.id);
    
    // Increment views in background
    incrementViews(clip.id)
      .then(newViews => {
        // Update local state with new view count
        setClips(prev => prev.map(c => 
          c.id === clip.id ? { ...c, views: newViews } : c
        ));
      })
      .catch(() => { /* ignore */ });
  }, [activeIndex, clips]);

  // Sync mute state via DOM property to ensure browser obedience
  useEffect(() => {
    videoRefs.current.forEach(v => {
      if (v) v.muted = isMuted;
    });
  }, [isMuted, clips.length]);

  const handleManualScroll = (index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isPlaying) {
      // Animation when starting from pause
      setIsAnimatingPlay(true);
      setTimeout(() => {
        setIsAnimatingPlay(false);
        setIsPlaying(true);
      }, 400);
    } else {
      setIsPlaying(false);
    }
  };

  const handleLike = async (id: string) => {
    if (!activeProfile) {
      alert('Please sign in to like videos');
      return;
    }
    
    // Get current state and update optimistically in one go
    const currentState = reactions[id];
    console.log('[Like] Clicked, current state:', currentState);
    if (!currentState) return;
    
    const isCurrentlyLiked = currentState.isLiked;
    
    // Optimistic update using functional form
    setReactions(prev => {
      const state = prev[id];
      if (!state) return prev;
      return {
        ...prev,
        [id]: {
          ...state,
          likes: isCurrentlyLiked ? state.likes - 1 : state.likes + 1,
          isLiked: !isCurrentlyLiked,
          isDisliked: false
        }
      };
    });
    
    // Save to DB
    try {
      const result = await toggleLikeVideo(id, activeProfile.id, isCurrentlyLiked);
      console.log('[Like] DB result:', result);
    } catch (error) {
      console.error('[Like] Failed:', error);
      // Revert on error
      setReactions(prev => {
        const state = prev[id];
        if (!state) return prev;
        return {
          ...prev,
          [id]: {
            ...state,
            likes: isCurrentlyLiked ? state.likes : state.likes - 1,
            isLiked: isCurrentlyLiked
          }
        };
      });
    }
  };

  const handleDislike = async (id: string) => {
    if (!activeProfile) {
      alert('Please sign in to dislike videos');
      return;
    }
    
    const currentState = reactions[id];
    if (!currentState) return;
    
    const isCurrentlyDisliked = currentState.isDisliked;
    const isCurrentlyLiked = currentState.isLiked;
    
    // Optimistic update
    setReactions(prev => {
      const state = prev[id];
      if (!state) return prev;
      return {
        ...prev,
        [id]: {
          ...state,
          isDisliked: !isCurrentlyDisliked,
          isLiked: false,
          likes: isCurrentlyLiked ? state.likes - 1 : state.likes
        }
      };
    });
    
    // Save to DB
    try {
      await toggleDislikeVideo(id, activeProfile.id, isCurrentlyDisliked);
    } catch (error) {
      console.error('[Dislike] Failed:', error);
      // Revert on error
      setReactions(prev => {
        const state = prev[id];
        if (!state) return prev;
        return {
          ...prev,
          [id]: {
            ...state,
            isDisliked: isCurrentlyDisliked,
            isLiked: isCurrentlyLiked,
            likes: isCurrentlyLiked ? state.likes : state.likes + 1
          }
        };
      });
    }
  };

  const handleSave = async (id: string) => {
    if (!activeProfile) {
      alert('Please sign in to save videos');
      return;
    }
    
    const isSaved = watchLaterMap[id];
    
    // Optimistic update
    setWatchLaterMap(prev => ({ ...prev, [id]: !isSaved }));
    
    // Save to DB
    try {
      if (isSaved) {
        await removeWatchLater(activeProfile.id, id);
      } else {
        await addWatchLater(activeProfile.id, id);
      }
    } catch (error) {
      console.error('Failed to toggle watch later:', error);
      // Revert on error
      setWatchLaterMap(prev => ({ ...prev, [id]: isSaved }));
    }
  };

  // Load comments when panel opens
  const loadComments = async (videoId: string) => {
    if (!videoId) return;
    try {
      const commentsData = await getVideoComments(videoId, activeProfile?.id);
      setComments(commentsData);
      setCommentCounts(prev => ({ ...prev, [videoId]: commentsData.length }));
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!activeProfile || !newComment.trim() || !activeClip) return;
    
    const commentText = newComment.trim();
    setNewComment(''); // Clear input immediately
    
    // Create optimistic comment object
    const optimisticComment: CommentType = {
      id: `temp-${Date.now()}`,
      video_id: activeClip.id,
      content: commentText,
      profile_id: activeProfile.id,
      profile_name: activeProfile.name || 'You',
      profile_avatar: activeProfile.avatar,
      created_at: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      parent_id: null,
      user_liked: false
    };
    
    // Update local state immediately
    setComments(prev => [optimisticComment, ...prev]);
    setCommentCounts(prev => ({ 
      ...prev, 
      [activeClip.id]: (prev[activeClip.id] || 0) + 1 
    }));
    
    try {
      await addComment(activeClip.id, activeProfile.id, commentText);
      // Wait a bit and reload to get real ID and finalized data
      const freshComments = await getVideoComments(activeClip.id, activeProfile.id);
      setComments(freshComments);
      setCommentCounts(prev => ({ ...prev, [activeClip.id]: freshComments.length }));
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Revert optimism on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setCommentCounts(prev => ({ 
        ...prev, 
        [activeClip.id]: Math.max(0, (prev[activeClip.id] || 0) - 1) 
      }));
      setNewComment(commentText); // Restore input on fail
    }
  };

  const handleCommentLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!activeProfile) {
      alert('Please sign in to like comments');
      return;
    }
    
    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          user_liked: !currentlyLiked,
          user_disliked: false,
          likes: !currentlyLiked ? c.likes + 1 : c.likes - 1,
        };
      }
      return c;
    }));
    
    try {
      await engageComment(commentId, activeProfile.id, currentlyLiked ? null : 'like');
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleCommentDislike = async (commentId: string, currentlyDisliked: boolean) => {
    if (!activeProfile) {
      alert('Please sign in to dislike comments');
      return;
    }
    
    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const wasLiked = c.user_liked;
        return {
          ...c,
          user_disliked: !currentlyDisliked,
          user_liked: false,
          likes: wasLiked ? c.likes - 1 : c.likes,
        };
      }
      return c;
    }));
    
    try {
      await engageComment(commentId, activeProfile.id, currentlyDisliked ? null : 'dislike');
    } catch (error) {
      console.error('Failed to dislike comment:', error);
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/styles/${id}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const cycleFilter = () => {
    setActiveFilterIndex((prev) => (prev + 1) % VIDEO_FILTERS.length);
    setShowFilterToast(true);
  };

  useEffect(() => {
    if (showFilterToast) {
      const timer = setTimeout(() => setShowFilterToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showFilterToast]);

  const activeClip = clips[activeIndex];

  return (
    <div className="h-[calc(100vh-64px)] bg-black overflow-hidden relative">
      {/* Filter Toast */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${showFilterToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
          <span className="text-white text-sm font-medium">{VIDEO_FILTERS[activeFilterIndex].name}</span>
        </div>
      </div>

      {/* Scroll Container */}
      <div
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar"
        onScroll={handleScroll}
      >
        {clips.length === 0 ? (
          <div className="h-screen w-full flex items-center justify-center p-4">
            <div className="h-full md:h-[92vh] aspect-[9/16] bg-zinc-900 md:rounded-2xl animate-pulse flex items-center justify-center">
               <div className="w-16 h-16 bg-white/5 rounded-full" />
            </div>
          </div>
        ) : clips.map((clip, index) => (
          <div
            key={clip.id}
            ref={el => { slideRefs.current[index] = el; }}
            className="h-full w-full snap-start relative flex items-center justify-center bg-black"
          >
            {/* Main Content Container */}
            <div className="relative flex items-center justify-center h-full w-full max-w-[1200px] mx-auto px-4 lg:px-6">
              
              {/* Desktop Layout Wrapper: Video + Side Actions */}
              <div className="relative flex justify-center h-full w-full md:gap-4 md:py-6">
              
                {/* Video Container - Fixed Desktop Aspect Ratio */}
                <div className="relative h-full w-full md:w-auto aspect-[9/16] bg-[#0f0f0f] md:rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 self-center">
                <video
                  ref={el => { videoRefs.current[index] = el; }}
                  src={clip.video_url}
                  className={`h-full w-full object-cover select-none ${VIDEO_FILTERS[activeFilterIndex].class}`}
                  loop
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    const p = (v.currentTime / v.duration) * 100;
                    setProgress(prev => ({ ...prev, [clip.id]: p }));
                  }}
                  onClick={togglePlay}
                />

                {/* Center Play Button Overlay */}
                {!isPlaying && index === activeIndex && (
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent group/player cursor-pointer z-30" onClick={togglePlay}>
                     {/* Animation Ripple */}
                    <div className={`absolute inset-0 bg-white rounded-full transition-all duration-700 ease-out pointer-events-none 
                      ${isAnimatingPlay ? 'scale-[4] opacity-0' : 'scale-0 opacity-0'}`} 
                    />

                    {/* Red YouTube Splash Button Replacement */}
                    <div className={`relative transition-all duration-300 transform 
                      ${isAnimatingPlay ? 'scale-[2] opacity-0' : 'scale-100 opacity-100 hover:scale-110 active:scale-95'}`}
                    >
                      <svg className="w-20 h-20 overflow-visible" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="styleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#A855F7" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M35,25 L75,50 L35,75 Z" 
                          fill={isAnimatingPlay ? "white" : "none"}
                          stroke={isAnimatingPlay ? "white" : "url(#styleGrad)"}
                          strokeWidth="5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="transition-colors duration-200"
                          style={{ 
                            strokeDasharray: 200, 
                            strokeDashoffset: 200,
                            animation: 'drawTriStyle 1.5s ease-out forwards' 
                          }}
                        />
                        <style>{`
                          @keyframes drawTriStyle {
                            0% { stroke-dashoffset: 200; }
                            100% { stroke-dashoffset: 0; }
                          }
                        `}</style>
                      </svg>
                    </div>
                  </div>
                )}

                {/* Top Controls Overlay */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                   <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all active:scale-90"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                {/* Right Side Actions Overlay (Mobile Only) */}
                <div className="absolute right-2 bottom-16 z-30 flex flex-col items-center gap-5 md:hidden">
                  {/* Like */}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLike(clip.id); }}
                      className={`w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all active:scale-90 ${reactions[clip.id]?.isLiked ? 'text-white' : 'text-zinc-100'}`}
                    >
                      <ThumbsUp className={`w-6 h-6 ${reactions[clip.id]?.isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-white text-[12px] font-bold mt-1 drop-shadow-md">
                      {reactions[clip.id]?.likes?.toLocaleString() || '0'}
                    </span>
                  </div>

                  {/* Dislike */}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDislike(clip.id); }}
                      className={`w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all active:scale-90 ${reactions[clip.id]?.isDisliked ? 'text-white' : 'text-zinc-100'}`}
                    >
                      <ThumbsDown className={`w-6 h-6 ${reactions[clip.id]?.isDisliked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-white text-[12px] font-bold mt-1 drop-shadow-md">Dislike</span>
                  </div>

                  {/* Comments */}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowComments(true); loadComments(clip.id); }}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all active:scale-90 text-white"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <span className="text-white text-[12px] font-bold mt-1 drop-shadow-md">
                      {(commentCounts[clip.id] || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Share */}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all active:scale-90 text-white"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>
                    <span className="text-white text-[12px] font-bold mt-1 drop-shadow-md">Share</span>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowOptionsId(clip.id === showOptionsId ? null : clip.id); }}
                      className={`w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition-all active:scale-90 text-white ${showOptionsId === clip.id ? 'bg-white text-black' : ''}`}
                    >
                      <MoreVertical className="w-6 h-6" />
                    </button>

                    {/* Options Menu Dropdown */}
                    {showOptionsId === clip.id && (
                      <div 
                        className="absolute bottom-full right-0 mb-4 w-60 bg-[#161616]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="p-2 space-y-1">
                          {[
                            { label: 'Save to Watch later', icon: History, action: () => handleSave(clip.id) },
                            { label: 'Not interested', icon: Slash, action: () => setShowOptionsId(null) },
                            { label: 'Report Styles', icon: AlertTriangle, action: () => setShowOptionsId(null) },
                            { label: 'Copy Link', icon: Link2, action: () => copyToClipboard(clip.id) },
                          ].map((item, i) => (
                            <button
                              key={i}
                              onClick={() => { item.action(); setShowOptionsId(null); }}
                              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-[15px] font-semibold text-white group active:scale-[0.98]"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#3B82F6] group-hover:to-[#A855F7] transition-all duration-300">
                                <item.icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                              </div>
                              <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                            </button>
                          ))}
                        </div>
                        <div className="bg-white/5 h-px mx-4 my-1" />
                        <div className="p-2">
                           <button
                            onClick={() => setShowOptionsId(null)}
                            className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Bottom Overlay - Info */}
                <div className="absolute bottom-0 left-0 right-14 md:right-0 p-4 z-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent pb-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/channel/${clip.channel_id}`} onClick={e => e.stopPropagation()}>
                        <img 
                          src={clip.channel_avatar || '/default-avatar.png'} 
                          className="w-10 h-10 rounded-full border border-white/20 shadow-lg object-cover" 
                          alt="" 
                        />
                      </Link>
                      <Link href={`/channel/${clip.channel_id}`} onClick={e => e.stopPropagation()} className="text-white font-bold text-[16px] drop-shadow-lg hover:underline decoration-white underline-offset-4">
                        @{clip.channel_name.replace(/^@/, '')}
                      </Link>
                      <div className="ml-1">
                        <SubscribeButton
                          channelId={clip.channel_id}
                          channelName={clip.channel_name}
                          profileId={activeProfile?.id}
                          showCount={false}
                          size="sm"
                          className="!h-[32px] !min-w-[100px] !text-[13px] !font-bold"
                        />
                      </div>
                    </div>
                    <h1 className="text-white text-[14px] font-medium leading-snug line-clamp-2 drop-shadow-md pr-4">
                      {clip.title}
                    </h1>
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold drop-shadow-md">
                      <Music className="w-3.5 h-3.5" />
                      <span className="truncate">Original Sound - {clip.channel_name}</span>
                    </div>
                  </div>
                </div>

                {/* Slim Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent z-40">
                  <div 
                    className="h-full bg-gradient-to-r from-[#3B82F6] to-[#A855F7] transition-all duration-100 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                    style={{ width: `${progress[clip.id] || 0}%` }}
                  />
                </div>
              </div>

              {/* Desktop Side Actions Panel */}
              <div className="hidden md:flex flex-col justify-end pb-8 pl-4 flex-shrink-0 self-center h-full gap-4">
                {/* Navigation Arrows */}
                <div className="flex flex-col gap-2 mb-4">
                  <button 
                    onClick={() => activeIndex > 0 && handleManualScroll(activeIndex - 1)}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all active:scale-90 text-white shadow-xl"
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => activeIndex < clips.length - 1 && handleManualScroll(activeIndex + 1)}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all active:scale-90 text-white shadow-xl"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-5">
                  <div className="flex flex-col items-center">
                    <button onClick={() => handleLike(clip.id)} className={`w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all active:scale-95 ${reactions[clip.id]?.isLiked ? 'text-white' : 'text-zinc-100'}`}>
                      <ThumbsUp className={`w-6 h-6 ${reactions[clip.id]?.isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-zinc-400 text-[13px] font-bold mt-1.5">{reactions[clip.id]?.likes?.toLocaleString() || '0'}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button onClick={() => handleDislike(clip.id)} className={`w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all active:scale-95 ${reactions[clip.id]?.isDisliked ? 'text-white' : 'text-zinc-100'}`}>
                      <ThumbsDown className={`w-6 h-6 ${reactions[clip.id]?.isDisliked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-zinc-400 text-[13px] font-bold mt-1.5">Dislike</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button onClick={() => { setShowComments(true); loadComments(clip.id); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all active:scale-95 text-white">
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <span className="text-zinc-400 text-[13px] font-bold mt-1.5">{(commentCounts[clip.id] || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button onClick={() => setShowShare(true)} className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all active:scale-95 text-white">
                      <Share2 className="w-6 h-6" />
                    </button>
                    <span className="text-zinc-400 text-[13px] font-bold mt-1.5">Share</span>
                  </div>

                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowOptionsId(clip.id === showOptionsId ? null : clip.id); }} className={`w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all active:scale-95 text-white ${showOptionsId === clip.id ? 'bg-zinc-700' : ''}`}>
                      <MoreVertical className="w-6 h-6" />
                    </button>
                    
                    {showOptionsId === clip.id && (
                      <div className="absolute bottom-full right-full mr-2 mb-2 w-60 bg-[#161616]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-2 space-y-1">
                          {[
                            { label: 'Save to Watch later', icon: History, action: () => handleSave(clip.id) },
                            { label: 'Not interested', icon: Slash, action: () => setShowOptionsId(null) },
                            { label: 'Report Styles', icon: AlertTriangle, action: () => setShowOptionsId(null) },
                            { label: 'Copy Link', icon: Link2, action: () => copyToClipboard(clip.id) },
                          ].map((item, i) => (
                            <button key={i} onClick={() => { item.action(); setShowOptionsId(null); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-[15px] font-semibold text-white group active:scale-[0.98]">
                              <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                              <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop Channel Avatar at bottom of actions */}
                  <Link 
                    href={`/channel/${clip.channel_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-12 h-12 mt-2 rounded-[12px] overflow-hidden border border-white/10 hover:border-white/30 transition-all active:scale-90 shadow-xl"
                  >
                    <img src={clip.channel_avatar || '/default-avatar.png'} className="w-full h-full object-cover" alt="" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="h-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>

      {/* Comments Panel - Slides from right */}
      {showComments && activeClip && (
        <div 
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => setShowComments(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-white/10 animate-slide-right overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowComments(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-white">{commentCounts[activeClip?.id] || 0} Comments</h3>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-zinc-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">No comments yet</h3>
                  <p className="text-sm text-zinc-500">Be the first to share what you think!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Link href={`/channel/${comment.profile_id}`}>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                        {comment.profile_avatar ? (
                          <img src={comment.profile_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">
                            {comment.profile_name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/channel/${comment.profile_id}`} className="text-[13px] font-bold text-white hover:text-blue-400 transition-colors">
                          @{comment.profile_name?.replace(/^@/, '')}
                        </Link>
                        <span className="text-xs text-zinc-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[14px] text-zinc-200 mt-1 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <button 
                          onClick={() => handleCommentLike(comment.id, comment.user_liked || false)}
                          className={`flex items-center gap-1 text-xs transition-colors ${comment.user_liked ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${comment.user_liked ? 'fill-current' : ''}`} />
                          {comment.likes > 0 && <span>{comment.likes}</span>}
                        </button>
                        <button 
                          onClick={() => handleCommentDislike(comment.id, comment.user_disliked || false)}
                          className={`flex items-center gap-1 text-xs transition-colors ${comment.user_disliked ? 'text-blue-400' : 'text-zinc-400 hover:text-white'}`}
                        >
                          <ThumbsDown className={`w-4 h-4 ${comment.user_disliked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            {activeProfile ? (
              <div className="border-t border-white/10 p-4 bg-zinc-900">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                    {activeProfile?.avatar ? (
                      <img src={activeProfile.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-400">
                        {activeProfile?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                      placeholder="Add a comment..."
                      className="flex-1 bg-zinc-800 text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-white/10 p-4 bg-zinc-900 text-center">
                <Link href="/signin" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                  Sign in to comment
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Sheet */}
      {showShare && activeClip && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={() => setShowShare(false)}
        >
          <div 
            className="bg-zinc-900 w-full max-w-sm rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Share</h3>
              <button 
                onClick={() => setShowShare(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {['WhatsApp', 'Facebook', 'X', 'Email', 'Copy'].map((app) => (
                <button 
                  key={app}
                  onClick={() => app === 'Copy' && copyToClipboard(activeClip.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                    {app === 'Copy' ? (
                      shareCopied ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-white">{app[0]}</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400">{app}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/styles/${activeClip.id}` : ''}
              </div>
              <button 
                onClick={() => copyToClipboard(activeClip.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${shareCopied ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
              >
                {shareCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Panel - Slides from right */}
      {showSidePanel && activeClip && (
        <div 
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => setShowSidePanel(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-white/10 animate-slide-right overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSidePanel(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-white">Related</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Current Video Info */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="flex gap-3">
                  <img 
                    src={activeClip.thumbnail_url} 
                    alt="" 
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                      {activeClip.title}
                    </h4>
                    <p className="text-zinc-400 text-xs">
                      @{activeClip.channel_name?.replace(/^@/, '')}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {activeClip.views?.toLocaleString()} views
                    </p>
                  </div>
                </div>
                <button className="w-full mt-3 bg-white text-black py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save to playlist
                </button>
              </div>

              {/* Related Videos List */}
              <div>
                <h5 className="text-white font-semibold text-sm mb-3">More from this channel</h5>
                <div className="space-y-3">
                  {clips.filter(c => c.channel_id === activeClip.channel_id && c.id !== activeClip.id).slice(0, 5).map((relatedClip) => (
                    <Link 
                      key={relatedClip.id}
                      href={`/styles/${relatedClip.id}`}
                      className="flex gap-3 group"
                      onClick={() => setShowSidePanel(false)}
                    >
                      <div className="relative w-28 h-36 flex-shrink-0">
                        <img 
                          src={relatedClip.thumbnail_url} 
                          alt="" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {relatedClip.is_live && (
                          <div className="absolute bottom-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            LIVE
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <h6 className="text-white font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {relatedClip.title}
                        </h6>
                        <p className="text-zinc-400 text-xs mt-1">
                          @{relatedClip.channel_name?.replace(/^@/, '')}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {relatedClip.views?.toLocaleString()} views
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Other videos */}
              <div>
                <h5 className="text-white font-semibold text-sm mb-3">You might also like</h5>
                <div className="space-y-3">
                  {clips.filter(c => c.channel_id !== activeClip.channel_id).slice(0, 5).map((relatedClip) => (
                    <Link 
                      key={relatedClip.id}
                      href={`/styles/${relatedClip.id}`}
                      className="flex gap-3 group"
                      onClick={() => setShowSidePanel(false)}
                    >
                      <div className="relative w-28 h-36 flex-shrink-0">
                        <img 
                          src={relatedClip.thumbnail_url} 
                          alt="" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <h6 className="text-white font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {relatedClip.title}
                        </h6>
                        <p className="text-zinc-400 text-xs mt-1">
                          @{relatedClip.channel_name?.replace(/^@/, '')}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {relatedClip.views?.toLocaleString()} views
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-right {
          animation: slideRight 0.3s ease-out;
        }
        @keyframes slideRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Action Button Component with animation
function ActionButton({ 
  icon, 
  label, 
  onClick, 
  isActive = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  isActive?: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={() => {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
        onClick();
      }}
      className={`flex flex-col items-center gap-1 transition-all duration-150 ${isPressed ? 'scale-90' : 'scale-100'}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
        isActive 
          ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
          : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
      }`}>
        {icon}
      </div>
      {label && (
        <span className="text-xs font-medium text-white drop-shadow-md">{label}</span>
      )}
    </button>
  );
}
