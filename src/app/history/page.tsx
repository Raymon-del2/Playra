'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getActiveProfile } from '@/app/actions/profile';
import { clearWatchHistory, getWatchHistory, isHistoryPaused, setHistoryPause } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface HistoryItem {
    id: string;
    title: string;
    thumbnail: string;
    views: string;
    timestamp: string;
    date: Date;
    type: 'video' | 'short';
    channel?: string;
    duration?: string;
}

export default function HistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showClearModal, setShowClearModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [activeChip, setActiveChip] = useState<'All' | 'Videos' | 'Styles' | 'Podcasts' | 'Music'>('All');
    const [activeProfileName, setActiveProfileName] = useState('');
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [paused, setPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [progressMap, setProgressMap] = useState<Record<string, { current?: number; duration?: number }>>({});
    const router = useRouter();

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

    const formatTime = (secs: number) => {
        if (!secs || Number.isNaN(secs)) return '0:00';
        const total = Math.floor(secs);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const profile = await getActiveProfile();
                if (profile) {
                    setActiveProfileName(profile.name);
                    setActiveProfileId(profile.id);
                    const pausedFlag = await isHistoryPaused(profile.id);
                    setPaused(pausedFlag);
                    const data = await getWatchHistory(profile.id, 300);
                    const mapped: HistoryItem[] = (data || [])
                        .filter((row) => row.video)
                        .map((row) => {
                            const v = row.video!;
                            const viewCount = Math.max((v.views ?? 0), 1);
                            return {
                                id: v.id,
                                title: v.title,
                                thumbnail: v.thumbnail_url,
                                views: `${viewCount.toLocaleString()} views`,
                                timestamp: formatDistanceToNow(new Date(row.watched_at), { addSuffix: true }),
                                date: new Date(row.watched_at),
                                type: v.is_short ? 'short' : 'video',
                                channel: v.channel_name || 'Unknown channel',
                                duration: v.duration || '0:00',
                            };
                        });
                    setHistory(mapped);
                }
            } catch (err) {
                console.error('Failed to load history', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Load local progress (per video) so the history cards can show where you left off
    useEffect(() => {
        if (typeof window === 'undefined' || !activeProfileId || history.length === 0) return;
        const map: Record<string, { current?: number; duration?: number }> = {};
        history.forEach((item) => {
            const key = `watch_progress:${activeProfileId}:${item.id}`;
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    map[item.id] = { current: parsed.current, duration: parsed.duration };
                }
            } catch {
                // ignore
            }
        });
        setProgressMap(map);
    }, [activeProfileId, history]);

    const formatDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
        if (date.getFullYear() !== today.getFullYear()) {
            options.year = 'numeric';
        }
        return date.toLocaleDateString('en-US', options);
    };

    const filteredHistory = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return history.filter((item) => {
            const matchesSearch =
                !q || [item.title, item.channel].some((field) => (field || '').toLowerCase().includes(q));
            let matchesChip = true;
            if (activeChip === 'Videos') matchesChip = item.type === 'video' && item.channel !== 'Music';
            if (activeChip === 'Styles') matchesChip = item.type === 'short';
            if (activeChip === 'Music') matchesChip = (item as any).category === 'music' || (item.channel || '').toLowerCase().includes('music');
            if (activeChip === 'Podcasts') matchesChip = (item as any).category === 'podcasts';
            return matchesSearch && matchesChip;
        });
    }, [searchQuery, history, activeChip]);

    const groupedHistory = useMemo(() => {
        return filteredHistory.reduce((acc: any, item) => {
            const label = formatDateLabel(item.date);
            if (!acc[label]) acc[label] = [];
            acc[label].push(item);
            return acc;
        }, {});
    }, [filteredHistory]);

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Main Content */}
            <div className="flex-1 max-w-[1284px] p-6 lg:p-10">
                <h1 className="text-[36px] font-black mb-6">Watch history</h1>

                {/* Filter Chips */}
                <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                    {['All', 'Videos', 'Styles', 'Podcasts', 'Music'].map((chip) => (
                        <button
                            key={chip}
                            onClick={() => setActiveChip(chip as typeof activeChip)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${chip === activeChip ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                                }`}
                        >
                            {chip}
                        </button>
                    ))}
                </div>

                {/* History Sections */}
                {Object.keys(groupedHistory).length === 0 && !isLoading ? (
                    <div className="text-zinc-400 text-sm font-semibold">No history found. Watch something to see it here.</div>
                ) : (
                    <div className="space-y-12">
                        {Object.keys(groupedHistory).map((label) => (
                            <div key={label} className="space-y-6">
                                <h2 className="text-[20px] font-black border-b border-white/5 pb-2">{label}</h2>

                                {/* Special handling for Shorts if grouped by date section */}
                                {groupedHistory[label].some((i: any) => i.type === 'short') && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 font-black uppercase text-lg">
                                            <img src="/styles-icon.svg?v=blue" alt="Styles" className="w-6 h-6 object-contain" />
                                            <span className="text-white">Styles</span>
                                        </div>
                                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                            {groupedHistory[label]
                                                .filter((item: any) => item.type === 'short')
                                                .map((item: any) => (
                                                    <Link key={item.id} href={`/watch/${item.id}`} className="group space-y-2">
                                                        <div className="aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900 border border-white/5 relative group-hover:border-white/20 transition-all">
                                                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            {progressMap[item.id]?.duration ? (
                                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                                                                    <div
                                                                        className="h-full bg-blue-500"
                                                                        style={{
                                                                            width: `${Math.min(100, Math.max(0, ((progressMap[item.id].current || 0) / (progressMap[item.id].duration || 1)) * 100))}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <div className="px-1">
                                                            <h3 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight">{item.title}</h3>
                                                            <p className="text-[12px] text-zinc-400 font-bold mt-1 uppercase tracking-tighter">{item.views}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Standard Videos */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {groupedHistory[label]
                                        .filter((item: any) => item.type === 'video')
                                        .map((item: any) => {
                                            const prog = progressMap[item.id];
                                            const durationSeconds = prog?.duration ?? parseDurationToSeconds(item.duration);
                                            const pct =
                                                durationSeconds && durationSeconds > 0
                                                    ? Math.min(100, Math.max(0, ((prog?.current || 0) / durationSeconds) * 100))
                                                    : 0;
                                            const durationText =
                                                durationSeconds && durationSeconds > 0
                                                    ? formatTime(durationSeconds)
                                                    : item.duration || '0:00';
                                            return (
                                                <Link key={item.id} href={`/watch/${item.id}`} className="flex gap-4 group">
                                                    <div className="w-48 aspect-video rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 relative border border-white/5">
                                                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        {durationText ? (
                                                            <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-black">
                                                                {durationText}
                                                            </div>
                                                        ) : null}
                                                        {durationSeconds ? (
                                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                                                                <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <h3 className="font-black text-sm line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight">{item.title}</h3>
                                                        <p className="text-[12px] text-zinc-400 font-bold uppercase tracking-tight">{item.channel}</p>
                                                        <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-tighter">{item.views} • {item.timestamp}</p>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar Controls */}
            <div className="hidden lg:block w-[400px] border-l border-white/5 p-10 space-y-10">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search watch history"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-full px-12 py-3 text-sm font-bold focus:border-white/20 transition-all outline-none"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="space-y-4">
                    <ControlButton
                        icon={<ClearIcon />}
                        label="Clear all watch history"
                        onClick={() => setShowClearModal(true)}
                    />
                    <ControlButton
                        icon={<PauseIcon />}
                        label={paused ? 'Unpause watch history' : 'Pause watch history'}
                        onClick={() => setShowPauseModal(true)}
                    />
                    <ControlButton
                        icon={<SettingsIcon />}
                        label="Manage all history"
                        onClick={() => router.push('/history/manage')}
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                    <a href="#" className="block text-sm font-bold text-zinc-400 hover:text-white transition-colors">Comments</a>
                    <a href="#" className="block text-sm font-bold text-zinc-400 hover:text-white transition-colors">Posts</a>
                    <a href="#" className="block text-sm font-bold text-zinc-400 hover:text-white transition-colors">Live chat</a>
                </div>
            </div>
            {/* Clear History Modal */}
            {showClearModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowClearModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-[450px] bg-[#212121] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-[20px] font-black text-white mb-4">Clear watch history?</h2>
                        <div className="text-[14px] text-zinc-400 mb-6 space-y-4 font-medium leading-relaxed">
                            <p className="text-zinc-300 font-bold">{activeProfileName}</p>
                            <p>Your Playra watch history will be cleared from all Playra apps on all devices.</p>
                            <p>
                                Your video recommendations will be reset, but may still be influenced by activity on other Google products. To learn more, visit <span className="text-blue-400 cursor-pointer hover:underline">My Activity</span>.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="px-5 py-2 hover:bg-white/10 rounded-full text-white font-bold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                className="px-5 py-2 text-blue-400 hover:bg-blue-400/10 rounded-full font-bold text-sm transition-colors"
                                onClick={async () => {
                                    if (!activeProfileId) return;
                                    try {
                                        await clearWatchHistory(activeProfileId);
                                        setHistory([]);
                                    } catch (err) {
                                        console.error('Failed to clear history', err);
                                    } finally {
                                        setShowClearModal(false);
                                    }
                                }}
                            >
                                Clear watch history
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pause History Modal */}
            {showPauseModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowPauseModal(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-[450px] bg-[#212121] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-[20px] font-black text-white mb-4">Pause watch history?</h2>
                        <div className="text-[14px] text-zinc-400 mb-6 space-y-4 font-medium leading-relaxed">
                            <p className="text-zinc-300 font-bold">{activeProfileName}</p>
                            <p>Pausing Playra watch history can make it harder to find videos you watched, and you may see fewer recommendations for new videos in Playra and other Google products.</p>
                            <p>
                                Remember, pausing this setting doesn't delete any previous activity, but you can view, edit and delete your private <span className="text-blue-400 cursor-pointer hover:underline">Playra watch history</span> data anytime. When you pause and clear your watch history, Playra features that rely on history to personalize your experience are disabled.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowPauseModal(false)}
                                className="px-5 py-2 hover:bg-white/10 rounded-full text-white font-bold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                className="px-5 py-2 text-blue-400 hover:bg-blue-400/10 rounded-full font-bold text-sm transition-colors"
                                onClick={async () => {
                                    if (!activeProfileId) return;
                                    try {
                                        await setHistoryPause(activeProfileId, !paused);
                                        setPaused(!paused);
                                    } catch (err) {
                                        console.error('Failed to toggle pause', err);
                                    } finally {
                                        setShowPauseModal(false);
                                    }
                                }}
                            >
                                {paused ? 'Unpause' : 'Pause'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ControlButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-white/5 transition-all group text-left"
        >
            <span className="text-zinc-500 group-hover:text-white transition-colors">{icon}</span>
            <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}

const ClearIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PauseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
