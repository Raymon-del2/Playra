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

  const slides = useMemo(() => {
    const currentIndex = stylesClips.findIndex((clip) => clip.id === style.id);
    if (currentIndex === -1) {
      return stylesClips.slice(0, 2);
    }
    const nextClip = stylesClips[(currentIndex + 1) % stylesClips.length];
    return [style, nextClip];
  }, [style]);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsForId, setCommentsForId] = useState<string | null>(null);
  const [shareForId, setShareForId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [style.id]);

  useEffect(() => {
    setCommentsForId(null);
    setShareForId(null);
    setShareCopied(false);
  }, [activeIndex, style.id]);

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
    <div className="p-6 pb-24 min-h-screen bg-[#0f0f0f] text-white">
      <div className="space-y-24">
        {slides.map((clip, index) => {
          const reaction = reactions[clip.id] ?? {
            likes: clip.likes,
            dislikes: clip.dislikes,
            isLiked: false,
            isDisliked: false,
          };
          const showDown = index < slides.length - 1;
          const showUp = index > 0;
          const isCommentsOpen = commentsForId === clip.id;
          const isShareOpen = shareForId === clip.id;
          const shareUrl = `https://playra.com/styles/${clip.id}`;

          return (
            <div
              key={clip.id}
              ref={(element) => {
                slideRefs.current[index] = element;
              }}
              className="relative min-h-[calc(100vh-120px)] flex items-start pt-6 scroll-mt-24"
            >
              <div
                className={`grid w-full mx-auto grid-cols-1 gap-6 lg:gap-8 lg:justify-center items-start transition-transform duration-300 ${
                  isCommentsOpen
                    ? 'max-w-[1180px] lg:grid-cols-[240px_320px_64px_320px] lg:-translate-x-3'
                    : 'max-w-[920px] lg:grid-cols-[240px_320px_64px]'
                }`}
              >
                <section className="order-2 lg:order-1 space-y-4">
                  <Link
                    href={`/results?search_query=${encodeURIComponent(clip.searchQuery)}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                  >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search “{clip.searchQuery}”
                    </span>
                  </Link>

                  <div className="flex items-center gap-3">
                    <img
                      src={clip.channelAvatar}
                      alt={clip.channel}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{clip.channel}</p>
                      <p className="text-xs text-gray-400">1.2M subscribers</p>
                    </div>
                    <button className="ml-auto px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-gray-200">
                      Subscribe
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-lg font-semibold">{clip.title}</h1>
                  </div>
                </section>

                <section className="order-1 lg:order-2 flex justify-start">
                  <div className="relative">
                    <div className="bg-black rounded-[22px] overflow-hidden border border-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                      <video
                        ref={(element) => {
                          videoRefs.current[index] = element;
                        }}
                        className="w-64 sm:w-[320px] aspect-[9/16] object-cover"
                        poster={clip.thumbnail}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        controls={false}
                      >
                        <source src={clip.video} type="video/mp4" />
                      </video>
                    </div>
                  </div>
                </section>

                <section className="order-3 flex items-center justify-start -ml-3">
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => handleLike(clip.id)}
                      className={`w-12 h-12 flex flex-col items-center justify-center text-xs transition-colors ${
                        reaction.isLiked ? 'text-blue-400' : 'text-gray-200 hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={reaction.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>{reaction.likes.toLocaleString()}</span>
                    </button>
                    <button
                      onClick={() => handleDislike(clip.id)}
                      className={`w-12 h-12 flex flex-col items-center justify-center text-xs transition-colors ${
                        reaction.isDisliked ? 'text-blue-400' : 'text-gray-200 hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={reaction.isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                      <span>Dislike</span>
                    </button>
                    <button
                      onClick={() => handleToggleComments(clip.id)}
                      className={`w-12 h-12 flex flex-col items-center justify-center text-xs transition-colors ${
                        isCommentsOpen ? 'text-white' : 'text-gray-200 hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10m-7 4h4m-9 1V5a2 2 0 012-2h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2z" />
                      </svg>
                      <span>{clip.comments}</span>
                    </button>
                    <button
                      onClick={() => handleToggleShare(clip.id)}
                      className={`w-12 h-12 flex flex-col items-center justify-center text-xs transition-colors ${
                        isShareOpen ? 'text-white' : 'text-gray-200 hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Share</span>
                    </button>
                    <button className="w-12 h-12 flex flex-col items-center justify-center text-xs text-gray-200 hover:text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M6 10a7 7 0 0111-4.4M18 14a7 7 0 01-11 4.4" />
                      </svg>
                      <span>Remix</span>
                    </button>
                    <img
                      src={clip.channelAvatar}
                      alt={clip.channel}
                      className="w-12 h-12 rounded-full"
                    />
                  </div>
                </section>

                {isCommentsOpen && (
                  <aside className="order-4 hidden lg:flex flex-col h-[520px] bg-[#1c1c1c] rounded-2xl border border-gray-800 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold">Comments {clip.comments}</p>
                      <button
                        onClick={() => setCommentsForId(null)}
                        className="text-gray-400 hover:text-white"
                        aria-label="Close comments"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 flex-1 space-y-4 overflow-auto pr-1">
                      <div className="flex gap-3">
                        <img
                          src={clip.channelAvatar}
                          alt={clip.channel}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-xs text-gray-400">@{clip.channel.replace(' ', '').toLowerCase()} • 1y ago</p>
                          <p className="text-sm text-gray-200">
                            Clean breakdown — the hook example at 0:42 is super clear.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=48&h=48&fit=crop"
                          alt="User"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-xs text-gray-400">@devnotes • 6mo ago</p>
                          <p className="text-sm text-gray-200">
                            Loved the quick tips. Can you do one on useMemo next?
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-800">
                      <input
                        className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none"
                        placeholder="Add a comment..."
                      />
                    </div>
                  </aside>
                )}
              </div>
              {(showUp || showDown) && (
                <div className="hidden lg:flex flex-col items-center gap-2 absolute right-8 top-1/2 -translate-y-1/2">
                  {showUp && (
                    <button
                      onClick={() => handleScrollTo(index - 1)}
                      className="w-10 h-10 flex items-center justify-center text-gray-200 hover:text-white"
                      aria-label="Previous style"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-4 4m4-4l4 4" />
                      </svg>
                    </button>
                  )}
                  {showDown && (
                    <button
                      onClick={() => handleScrollTo(index + 1)}
                      className="w-10 h-10 flex items-center justify-center text-gray-200 hover:text-white"
                      aria-label="Next style"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-4-4m4 4l4-4" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              {isShareOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                  <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-[#1f1f1f] p-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Share</h3>
                      <button
                        onClick={() => setShareForId(null)}
                        className="text-gray-400 hover:text-white"
                        aria-label="Close share"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-5 flex items-center gap-4 overflow-x-auto pb-2">
                      {shareApps.map((app) => (
                        <button
                          key={app.label}
                          className="flex min-w-[72px] flex-col items-center gap-2 text-xs text-gray-200"
                        >
                          <span
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${app.color} ${
                              app.textColor ?? 'text-white'
                            }`}
                          >
                            {app.text}
                          </span>
                          <span>{app.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-gray-800 bg-[#121212] px-4 py-3">
                      <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-transparent text-sm text-gray-200 outline-none"
                      />
                      <button
                        onClick={() => handleCopyShare(shareUrl)}
                        className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
                      >
                        {shareCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">Copy the link to share later.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
