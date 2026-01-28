'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRelatedVideos, Video } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface RelatedVideosProps {
    videoId: string;
    category?: string;
    channelId?: string;
}

export default function RelatedVideos({ videoId, category, channelId }: RelatedVideosProps) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadRelatedVideos();
    }, [videoId, category, channelId]);

    const loadRelatedVideos = async () => {
        try {
            setIsLoading(true);
            const data = await getRelatedVideos(videoId, category, channelId, 20);
            setVideos(data);
        } catch (error) {
            console.error('Failed to load related videos:', error);
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

    const formatDuration = (duration: string | null | undefined) => {
        if (!duration) return '';
        return duration;
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                <h3 className="text-base font-bold text-white mb-4 px-3 lg:px-0">
                    Related videos
                </h3>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-2 animate-pulse">
                        <div className="w-40 aspect-video bg-zinc-800 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-3 bg-zinc-800 rounded w-full" />
                            <div className="h-3 bg-zinc-800 rounded w-3/4" />
                            <div className="h-2 bg-zinc-800 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-zinc-500 text-sm">No related videos found</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-base font-bold text-white mb-4 px-3 lg:px-0">
                Related videos
            </h3>

            <div className="space-y-2">
                {videos.map((video) => (
                    <Link
                        key={video.id}
                        href={`/watch/${video.id}`}
                        className="flex gap-2 group p-2 rounded-xl hover:bg-white/5 transition-colors -mx-2"
                    >
                        {/* Thumbnail */}
                        <div className="relative w-40 flex-shrink-0">
                            <div className="aspect-video rounded-lg overflow-hidden bg-zinc-800">
                                <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            {video.duration && (
                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                                    {formatDuration(video.duration)}
                                </div>
                            )}
                            {video.is_live && (
                                <div className="absolute bottom-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                    Live
                                </div>
                            )}
                            {video.is_short && (
                                <div className="absolute top-1 right-1">
                                    <img src="/styles-icon.svg?v=blue" alt="Style" className="w-4 h-4" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 py-0.5">
                            <h4 className="text-[13px] font-bold text-white line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                                {video.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1.5 hover:text-zinc-300 transition-colors">
                                {video.channel_name}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                                <span>{formatViews(video.views)}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Load More - Optional */}
            {videos.length >= 20 && (
                <button className="w-full mt-4 py-2 text-sm font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-400/5 rounded-lg transition-colors">
                    Show more
                </button>
            )}
        </div>
    );
}
