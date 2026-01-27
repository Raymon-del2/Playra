'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { getActiveProfile } from '@/app/actions/profile';
import {
    clearWatchHistory,
    deleteWatchHistoryEntry,
    getWatchHistoryRaw,
    isHistoryPaused,
    setHistoryPause,
} from '@/lib/supabase';

type ManageItem = {
    id: string;
    watched_at: string;
    title: string;
    thumbnail: string;
    channel?: string | null;
    duration?: string | null;
    views?: number | null;
    is_short?: boolean;
};

export default function ManageHistoryPage() {
    const [items, setItems] = useState<ManageItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [profileName, setProfileName] = useState<string>('');
    const [paused, setPaused] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const profile = await getActiveProfile();
                if (!profile) return;
                setProfileId(profile.id);
                setProfileName(profile.name);
                const pausedFlag = await isHistoryPaused(profile.id);
                setPaused(pausedFlag);
                const rows = await getWatchHistoryRaw(profile.id, 1000);
                const mapped = (rows || [])
                    .filter((r) => r.video)
                    .map((r) => ({
                        id: r.id,
                        watched_at: r.watched_at,
                        title: r.video!.title,
                        thumbnail: r.video!.thumbnail_url,
                        channel: r.video!.channel_name,
                        duration: r.video!.duration,
                        views: r.video!.views,
                        is_short: r.video!.is_short,
                    }));
                setItems(mapped);
            } catch (err) {
                console.error('Failed to load full history', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        if (!q) return items;
        return items.filter((item) =>
            [item.title, item.channel].some((field) => (field || '').toLowerCase().includes(q))
        );
    }, [items, searchQuery]);

    const handleDelete = async (id: string) => {
        if (!profileId) return;
        try {
            await deleteWatchHistoryEntry(id, profileId);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch (err) {
            console.error('Failed to delete entry', err);
        }
    };

    const handleClearAll = async () => {
        if (!profileId) return;
        try {
            await clearWatchHistory(profileId);
            setItems([]);
        } catch (err) {
            console.error('Failed to clear history', err);
        }
    };

    const togglePause = async () => {
        if (!profileId) return;
        try {
            await setHistoryPause(profileId, !paused);
            setPaused(!paused);
        } catch (err) {
            console.error('Failed to toggle pause', err);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black">Manage watch history</h1>
                        <p className="text-zinc-400 text-sm mt-1">{profileName}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={togglePause}
                            className="px-4 py-2 rounded-full border border-white/10 hover:border-white/30 text-sm font-bold"
                        >
                            {paused ? 'Unpause history' : 'Pause history'}
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="px-4 py-2 rounded-full border border-red-400/50 text-red-300 hover:bg-red-500/10 text-sm font-bold"
                        >
                            Clear all
                        </button>
                        <button
                            onClick={() => router.push('/history')}
                            className="px-4 py-2 rounded-full border border-white/10 hover:border-white/30 text-sm font-bold"
                        >
                            Back to history
                        </button>
                    </div>
                </div>

                <div className="relative mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your watch history"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:border-white/25 outline-none"
                    />
                </div>

                {isLoading ? (
                    <p className="text-zinc-400">Loading...</p>
                ) : filtered.length === 0 ? (
                    <div className="text-center text-zinc-400 py-12">No history found.</div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-4 items-center bg-zinc-900/60 border border-white/5 rounded-xl p-3"
                            >
                                <Link href={`/watch/${item.id}`} className="w-40 flex-shrink-0">
                                    <div className="aspect-video rounded-lg overflow-hidden bg-zinc-800 relative">
                                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                        <span className="absolute bottom-1 right-1 text-[10px] font-black bg-black/70 px-1 rounded">
                                            {item.duration || '0:00'}
                                        </span>
                                    </div>
                                </Link>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <Link href={`/watch/${item.id}`} className="font-bold line-clamp-2 hover:text-blue-400">
                                        {item.title}
                                    </Link>
                                    <p className="text-xs text-zinc-400 line-clamp-1">{item.channel || 'Unknown channel'}</p>
                                    <p className="text-xs text-zinc-500">
                                        {formatDistanceToNow(new Date(item.watched_at), { addSuffix: true })} •{' '}
                                        {(item.views ?? 0).toLocaleString()} views
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-400 hover:text-red-200 text-sm font-bold px-3 py-2"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
