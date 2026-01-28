'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTrendingVideos, Video } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

type TrendingCategory = 'now' | 'music' | 'gaming' | 'movies';

export default function TrendingPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<TrendingCategory>('now');

    const categories: { id: TrendingCategory; label: string; icon: JSX.Element }[] = [
        {
            id: 'now',
            label: 'Now',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.09 4.56c-.7-1.03-1.5-1.99-2.4-2.85-.35-.34-.94-.02-.84.46.19.94.39 2.18.39 3.29 0 2.06-1.35 3.73-3.41 3.73-1.54 0-2.8-.93-3.35-2.26-.1-.2-.14-.32-.2-.54-.11-.42-.66-.55-.9-.18-.18.27-.35.56-.51.84A13.35 13.35 0 004 14.85c0 5.06 4.03 9.15 9 9.15s9-4.09 9-9.15c0-4.33-1.81-7.35-4.91-10.29z" />
                </svg>
            ),
        },
        {
            id: 'music',
            label: 'Music',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
            ),
        },
        {
            id: 'gaming',
            label: 'Gaming',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            id: 'movies',
            label: 'Movies',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
            ),
        },
    ];

    useEffect(() => {
        loadTrendingVideos();
    }, [activeCategory]);

    const loadTrendingVideos = async () => {
        try {
            setIsLoading(true);
            let data = await getTrendingVideos(50);

            // Filter by category if needed
            if (activeCategory === 'music') {
                data = data.filter(v => v.category === 'music');
            } else if (activeCategory === 'gaming') {
                // Gaming uses title search since it's not a defined category
                data = data.filter(v => v.title.toLowerCase().includes('game') || v.title.toLowerCase().includes('gaming'));
            }

            setVideos(data);
        } catch (error) {
            console.error('Failed to load trending videos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}M views`;
        }
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}K views`;
        }
        return `${views} views`;
    };

    return (
        <div className="min-h-screen bg-gray-900 pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-orange-500/10 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent" />

                <div className="relative px-6 py-12 md:py-16">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.09 4.56c-.7-1.03-1.5-1.99-2.4-2.85-.35-.34-.94-.02-.84.46.19.94.39 2.18.39 3.29 0 2.06-1.35 3.73-3.41 3.73-1.54 0-2.8-.93-3.35-2.26-.1-.2-.14-.32-.2-.54-.11-.42-.66-.55-.9-.18-.18.27-.35.56-.51.84A13.35 13.35 0 004 14.85c0 5.06 4.03 9.15 9 9.15s9-4.09 9-9.15c0-4.33-1.81-7.35-4.91-10.29z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Trending
                            </h1>
                            <p className="text-zinc-400 text-sm mt-1">
                                See what's popular on Playra right now
                            </p>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all
                                    ${activeCategory === cat.id
                                        ? 'bg-white text-black'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }
                                `}
                            >
                                {cat.icon}
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Videos List */}
            <div className="px-4 md:px-6 max-w-5xl">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-10 text-center text-2xl font-bold text-zinc-700">{i}</div>
                                <div className="w-64 aspect-video bg-zinc-800 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-3 py-2">
                                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : videos.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.09 4.56c-.7-1.03-1.5-1.99-2.4-2.85-.35-.34-.94-.02-.84.46.19.94.39 2.18.39 3.29 0 2.06-1.35 3.73-3.41 3.73-1.54 0-2.8-.93-3.35-2.26-.1-.2-.14-.32-.2-.54-.11-.42-.66-.55-.9-.18-.18.27-.35.56-.51.84A13.35 13.35 0 004 14.85c0 5.06 4.03 9.15 9 9.15s9-4.09 9-9.15c0-4.33-1.81-7.35-4.91-10.29z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No trending videos yet</h2>
                        <p className="text-zinc-500">Check back later for popular content</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {videos.map((video, index) => (
                            <Link
                                key={video.id}
                                href={`/watch/${video.id}`}
                                className="flex gap-4 group p-3 rounded-2xl hover:bg-white/5 transition-all -mx-3"
                            >
                                {/* Rank */}
                                <div className="w-10 flex-shrink-0 flex items-center justify-center">
                                    <span className={`
                                        text-2xl font-black
                                        ${index < 3
                                            ? 'bg-gradient-to-br from-orange-400 to-red-500 bg-clip-text text-transparent'
                                            : 'text-zinc-600'
                                        }
                                    `}>
                                        {index + 1}
                                    </span>
                                </div>

                                {/* Thumbnail */}
                                <div className="relative w-48 md:w-64 flex-shrink-0">
                                    <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-lg">
                                        <img
                                            src={video.thumbnail_url}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    {video.duration && (
                                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                                            {video.duration}
                                        </div>
                                    )}
                                    {video.is_live && (
                                        <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                            Live
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-1">
                                    <h3 className="text-base md:text-lg font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors leading-snug">
                                        {video.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                            {video.channel_avatar ? (
                                                <img src={video.channel_avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                                    {video.channel_name?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm text-zinc-400 hover:text-white transition-colors">
                                            {video.channel_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                                        <span>{formatViews(video.views)}</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
                                    </div>
                                    {video.description && (
                                        <p className="hidden md:block text-sm text-zinc-500 mt-2 line-clamp-1">
                                            {video.description}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
