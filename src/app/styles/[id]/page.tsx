'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const stylesClips = [
  {
    id: 'r8',
    title: 'React Hooks in One Minute #styles',
    channel: 'Hooks Lab',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=360&h=640&fit=crop',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description: 'Quick hook tips: state updates, dependencies, and clean effects in under a minute.',
    likes: 11200,
    dislikes: 320,
    comments: 109,
    searchQuery: 'react hooks',
  },
  {
    id: 'r9',
    title: 'useEffect Cleanup Explained #styles',
    channel: 'Dev Clips',
    channelAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=64&h=64&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=360&h=640&fit=crop',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description: 'Learn why cleanup functions matter and how to avoid stale effects in React.',
    likes: 8400,
    dislikes: 210,
    comments: 72,
    searchQuery: 'useEffect cleanup',
  },
  {
    id: 'r12',
    title: 'useState Mistakes to Avoid #styles',
    channel: 'Hooks Lab',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=360&h=640&fit=crop',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description: 'Five common useState mistakes and how to fix them fast.',
    likes: 5600,
    dislikes: 120,
    comments: 45,
    searchQuery: 'useState tips',
  },
];

type ReactionState = {
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
};

const shareApps = [
  { label: 'WhatsApp', color: 'bg-[#22c55e]', text: 'WA' },
  { label: 'Facebook', color: 'bg-[#2563eb]', text: 'f' },
  { label: 'X', color: 'bg-black', text: 'X' },
  { label: 'Email', color: 'bg-gray-500', text: '@' },
  { label: 'KakaoTalk', color: 'bg-[#facc15]', text: 'KT', textColor: 'text-black' },
  { label: 'More', color: 'bg-[#f97316]', text: '>' },
];

export default function StylesDetailPage() {
  const params = useParams();
  const styleId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const style = useMemo(
    () => stylesClips.find((clip) => clip.id === styleId) ?? stylesClips[0],
    [styleId],
  );
  const [reactions, setReactions] = useState<Record<string, ReactionState>>(() =>
    stylesClips.reduce((acc, clip) => {
      acc[clip.id] = {
        likes: clip.likes,
        dislikes: clip.dislikes,
        isLiked: false,
        isDisliked: false,
      };
      return acc;
    }, {} as Record<string, ReactionState>),
  );

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const nextIndexRef = useRef(0);
  const pendingScrollRef = useRef<number | null>(null);
  const [slides, setSlides] = useState(() => {
    const currentIndex = stylesClips.findIndex((clip) => clip.id === style.id);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (startIndex + 1) % stylesClips.length;
    nextIndexRef.current = (nextIndex + 1) % stylesClips.length;
    return [stylesClips[startIndex], stylesClips[nextIndex]];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsForId, setCommentsForId] = useState<string | null>(null);
  const [shareForId, setShareForId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const currentIndex = stylesClips.findIndex((clip) => clip.id === style.id);
    const startIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (startIndex + 1) % stylesClips.length;
    nextIndexRef.current = (nextIndex + 1) % stylesClips.length;
    setSlides([stylesClips[startIndex], stylesClips[nextIndex]]);
    setActiveIndex(0);
  }, [style.id]);

  useEffect(() => {
    setCommentsForId(null);
    setShareForId(null);
    setShareCopied(false);
  }, [activeIndex, style.id]);

  useEffect(() => {
    if (pendingScrollRef.current === null) return;
    if (pendingScrollRef.current >= slides.length) return;
    const target = slideRefs.current[pendingScrollRef.current];
    pendingScrollRef.current = null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [slides.length]);

  useEffect(() => {
    document.documentElement.classList.add('styles-scrollbar-hidden');
    document.body.classList.add('styles-scrollbar-hidden');
    return () => {
      document.documentElement.classList.remove('styles-scrollbar-hidden');
      document.body.classList.remove('styles-scrollbar-hidden');
    };
  }, []);

  const handleToggleShare = (clipId: string) => {
    setShareForId((prev) => (prev === clipId ? null : clipId));
    setShareCopied(false);
  };

  const handleCopyShare = (url: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => undefined);
    }
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1500);
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    slideRefs.current.forEach((element, index) => {
      if (!element) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { threshold: 0.6 },
      );
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, [slides.length]);

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    });

    const timer = window.setTimeout(() => {
      const activeVideo = videoRefs.current[activeIndex];
      if (!activeVideo) return;
      activeVideo.play().catch(() => undefined);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [activeIndex, slides.length]);

  const handleScrollTo = (index: number) => {
    if (index >= slides.length) {
      pendingScrollRef.current = index;
      setSlides((prev) => {
        const nextClip = stylesClips[nextIndexRef.current] ?? stylesClips[0];
        nextIndexRef.current = (nextIndexRef.current + 1) % stylesClips.length;
        return [...prev, nextClip];
      });
      return;
    }
    const target = slideRefs.current[index];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleLike = (clipId: string) => {
    setReactions((prev) => {
      const current = prev[clipId];
      if (!current) return prev;
      const next = { ...current };
      if (next.isLiked) {
        next.likes -= 1;
        next.isLiked = false;
      } else {
        if (next.isDisliked) {
          next.dislikes -= 1;
          next.isDisliked = false;
        }
        next.likes += 1;
        next.isLiked = true;
      }
      return { ...prev, [clipId]: next };
    });
  };

  const handleToggleComments = (clipId: string) => {
    setCommentsForId((prev) => (prev === clipId ? null : clipId));
  };

  const handleDislike = (clipId: string) => {
    setReactions((prev) => {
      const current = prev[clipId];
      if (!current) return prev;
      const next = { ...current };
      if (next.isDisliked) {
        next.dislikes -= 1;
        next.isDisliked = false;
      } else {
        if (next.isLiked) {
          next.likes -= 1;
          next.isLiked = false;
        }
        next.dislikes += 1;
        next.isDisliked = true;
      }
      return { ...prev, [clipId]: next };
    });
  };


  return (
    <div className="min-h-screen lg:min-h-[calc(100vh-64px)] bg-black text-white overflow-y-scroll snap-y snap-mandatory styles-scrollbar-hidden flex flex-col items-center">
      <div className="w-full lg:max-w-[500px]">
        {slides.map((clip, index) => {
          const reaction = reactions[clip.id] ?? {
            likes: clip.likes,
            dislikes: clip.dislikes,
            isLiked: false,
            isDisliked: false,
          };
          const isCommentsOpen = commentsForId === clip.id;
          const isShareOpen = shareForId === clip.id;
          const shareUrl = `https://playra.com/styles/${clip.id}`;

          return (
            <div
              key={`${clip.id}-${index}`}
              ref={(element) => {
                slideRefs.current[index] = element;
              }}
              className="relative h-screen lg:h-[calc(100vh-64px)] flex items-center justify-center snap-center snap-always lg:py-4"
            >
              <div className="relative w-full h-full lg:aspect-[9/16] bg-zinc-900 lg:rounded-2xl overflow-hidden shadow-2xl flex items-center group">
                <video
                  ref={(element) => {
                    videoRefs.current[index] = element;
                  }}
                  className="w-full h-full object-cover cursor-pointer"
                  poster={clip.thumbnail}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  controls={false}
                  onClick={(e) => {
                    const v = e.currentTarget;
                    if (v.paused) v.play(); else v.pause();
                  }}
                >
                  <source src={clip.video} type="video/mp4" />
                </video>

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Bottom Section (MD3 high-fidelity) */}
                <div className="absolute bottom-6 left-4 right-16 pointer-events-auto">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 overflow-hidden">
                        <img src={clip.channelAvatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-[15px] drop-shadow-lg text-white">@{clip.channel.replace(' ', '').toLowerCase()}</span>
                      <button className="px-5 py-1.5 bg-white text-black text-[13px] font-black rounded-full active:scale-95 transition-all shadow-xl">
                        Subscribe
                      </button>
                    </div>

                    <p className="text-[14px] leading-tight text-white font-medium drop-shadow-2xl line-clamp-2 max-w-[85%]">{clip.title}</p>

                    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl w-fit px-3 py-1.5 rounded-full border border-white/10 group cursor-pointer active:scale-95 transition-all">
                      <div className="w-4 h-4 text-white">
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                      </div>
                      <div className="flex items-center overflow-hidden h-4">
                        <span className="text-[12px] text-white font-bold whitespace-nowrap">Original audio • {clip.channel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control Buttons (Right Side Overlay - MD3 2026) */}
                <div className="absolute bottom-16 right-2 flex flex-col items-center gap-5 z-20 pointer-events-auto">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleLike(clip.id)}
                      className="group/btn flex flex-col items-center"
                    >
                      <div className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${reaction.isLiked ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white'}`}>
                        <svg className="w-8 h-8" fill={reaction.isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.527c-1.325 0-2.4-1.075-2.4-2.4V10.6c0-1.325 1.075-2.4 2.4-2.4h.527c.445 0 .72.498.523.898a4.512 4.512 0 0 0-.27.602" /></svg>
                      </div>
                      <span className="text-[12px] text-white mt-1 font-bold shadow-black drop-shadow-lg">{reaction.likes > 1000 ? (reaction.likes / 1000).toFixed(1) + 'K' : reaction.likes}</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleDislike(clip.id)}
                      className="group/btn flex flex-col items-center"
                    >
                      <div className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${reaction.isDisliked ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white'}`}>
                        <svg className="w-8 h-8" fill={reaction.isDisliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 13.5l3 3m0 0l3-3m-3 3v-10m10 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                      </div>
                      <span className="text-[12px] text-white mt-1 font-bold shadow-black drop-shadow-lg">Dislike</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <button onClick={() => handleToggleComments(clip.id)} className="group/btn flex flex-col items-center">
                      <div className="p-2.5 rounded-full backdrop-blur-md hover:bg-white/10 transition-all active:scale-90 text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.009z" /></svg>
                      </div>
                      <span className="text-[12px] text-white mt-1 font-bold shadow-black drop-shadow-lg">{clip.comments}</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <button onClick={() => handleToggleShare(clip.id)} className="group/btn flex flex-col items-center">
                      <div className="p-2.5 rounded-full backdrop-blur-md hover:bg-white/10 transition-all active:scale-90 text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 003.933 2.185 2.25 2.25 0 00-3.933-2.185z" /></svg>
                      </div>
                      <span className="text-[12px] text-white mt-1 font-bold shadow-black drop-shadow-lg">Share</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <button className="group/btn flex flex-col items-center">
                      <div className="p-2.5 rounded-full backdrop-blur-md hover:bg-white/10 transition-all active:scale-90 text-white">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                      </div>
                      <span className="text-[12px] text-white mt-1 font-bold shadow-black drop-shadow-lg">Remix</span>
                    </button>
                  </div>

                  <div className="mt-2 group cursor-pointer relative">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-white/20 animate-[spin_4s_linear_infinite] overflow-hidden flex items-center justify-center p-1">
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white text-black rounded-full p-1 shadow-xlScale active:scale-125 transition-transform">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {isCommentsOpen && (
                <div className="absolute left-[calc(100%+24px)] top-4 bottom-4 w-[400px] bg-[#0f0f0f] rounded-2xl p-4 shadow-2xl flex flex-col z-20 hidden lg:flex">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                      Comments
                      <span className="text-zinc-500 font-normal text-sm">{clip.comments}</span>
                    </h3>
                    <button onClick={() => setCommentsForId(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors font-bold">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                    <div className="flex gap-4">
                      <img src={clip.channelAvatar} className="w-10 h-10 rounded-full ring-1 ring-white/10" alt="" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-zinc-300 font-bold">@{clip.channel.replace(' ', '').toLowerCase()}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">1y ago</p>
                        </div>
                        <p className="text-sm mt-1 leading-relaxed">Awesome breakdown! Keep it up. 🔥</p>
                        <div className="flex items-center gap-4 mt-3 text-zinc-400">
                          <button className="hover:text-white transition-colors flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                            <span className="text-[10px] font-bold">1.2K</span>
                          </button>
                          <button className="hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop" className="w-10 h-10 rounded-full ring-1 ring-white/10" alt="" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-zinc-300 font-bold">@coder_jane</p>
                          <p className="text-[10px] text-zinc-500 font-medium">2mo ago</p>
                        </div>
                        <p className="text-sm mt-1 leading-relaxed">This saved my project deadlines! Really well explained.</p>
                        <div className="flex items-center gap-4 mt-3 text-zinc-400">
                          <button className="hover:text-white transition-colors flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                            <span className="text-[10px] font-bold">542</span>
                          </button>
                          <button className="hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="flex gap-3">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop" className="w-9 h-9 rounded-full" alt="" />
                      <input type="text" placeholder="Add a comment..." className="flex-1 bg-zinc-900 rounded-lg px-4 py-2 text-sm outline-none border border-transparent focus:border-blue-500 transition-all font-medium" />
                    </div>
                  </div>
                </div>
              )}

              {isShareOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
                  <div className="bg-[#1c1c1c] w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-bold">Share</h3>
                      <button onClick={() => setShareForId(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-5 overflow-x-auto pb-6 mb-8 scrollbar-hide">
                      {shareApps.map(app => (
                        <button key={app.label} className="flex flex-col items-center gap-3 min-w-[70px] group">
                          <div className={`${app.color} w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform shadow-lg`}>{app.text}</div>
                          <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white">{app.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-xl flex items-center gap-4 border border-zinc-800 ring-1 ring-white/5">
                      <p className="text-xs flex-1 truncate text-zinc-400 font-medium">{shareUrl}</p>
                      <button onClick={() => handleCopyShare(shareUrl)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-lg">
                        {shareCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Absolute Scroll Navigation Controls (Fixed on screen - Desktop only) */}
      <div className="fixed right-6 lg:right-12 bottom-12 flex flex-col gap-4 z-[50] hidden lg:flex">
        <button
          onClick={() => handleScrollTo(activeIndex - 1)}
          className="p-4 bg-zinc-800/90 rounded-full hover:bg-zinc-700 transition-all shadow-xl hover:scale-110 active:scale-95 group"
          aria-label="Previous style"
        >
          <svg className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => handleScrollTo(activeIndex + 1)}
          className="p-4 bg-zinc-800/90 rounded-full hover:bg-zinc-700 transition-all shadow-xl hover:scale-110 active:scale-95 group"
          aria-label="Next style"
        >
          <svg className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
