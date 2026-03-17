'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveProfile, getUserProfiles, selectActiveProfile } from '@/app/actions/profile';
import { getWatchHistory } from '@/lib/supabase';
import { auth } from '@/lib/firebase';

function formatDuration(duration: string | null | undefined): string {
    if (!duration || duration === '0' || duration === '0:00') return '0:00';
    return duration;
}

interface Profile {
    id: string;
    name: string;
    avatar: string | null;
}

interface WatchHistoryRow {
    id: string;
    video: {
        id: string;
        title: string;
        views: number | null;
        thumbnail_url: string;
        duration: string | null;
        channel_name: string;
        is_short: boolean;
        category?: string | null;
    } | null;
}

export default function YouPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [historyVideos, setHistoryVideos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
    const [userProfiles, setUserProfiles] = useState<Profile[]>([]);
    const [isSwitching, setIsSwitching] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const activeProfile = await getActiveProfile();
                if (activeProfile) {
                    setProfile(activeProfile);
                    // Fetch watch history
                    const history = await getWatchHistory(activeProfile.id, 10);
                    setHistoryVideos(history || []);
                    
                    // Load all profiles for the user
                    const user = auth.currentUser;
                    if (user) {
                        const profiles = await getUserProfiles(user.uid);
                        setUserProfiles(profiles);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSwitchProfile = async (profileId: string) => {
        setIsSwitching(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await selectActiveProfile(profileId, user.uid);
                setShowProfileSwitcher(false);
                // Navigate to homepage with new profile
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error switching profile:', error);
            setIsSwitching(false);
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white pb-24 overflow-x-hidden">
            {/* Profile Section */}
            <div className="px-5 mb-8">
                {isLoading ? (
                    // Skeleton loader for profile
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-zinc-800 animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-32 h-8 bg-zinc-800 rounded animate-pulse" />
                            <div className="w-48 h-4 bg-zinc-800 rounded animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 group">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border-2 border-white/10 shadow-2xl p-0.5">
                            {profile?.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-2xl font-black italic">
                                    {profile?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{profile?.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-xs font-medium text-gray-300">
                                    @{profile?.name?.toLowerCase().replace(/\s+/g, '_').replace(/^@+/, '') || 'user'}
                                </span>
                                <Link href={`/channel/${profile?.id}`} className="text-gray-400 text-sm font-medium hover:text-white transition-colors flex items-center gap-1">
                                    View channel
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 mt-6">
                    <button 
                        onClick={() => setShowProfileSwitcher(true)}
                        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-white/5 active:scale-95"
                    >
                        Switch accounts
                    </button>
                </div>
            </div>

            {/* History Section */}
            <section className="mb-8 pl-5">
                <h2 className="text-xl font-bold tracking-tight mb-4">History</h2>
                {isLoading ? (
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pr-5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex-shrink-0 w-44">
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 animate-pulse mb-2" />
                                <div className="h-4 bg-zinc-800 rounded animate-pulse mb-1" />
                                <div className="h-3 bg-zinc-800 rounded w-20 animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : historyVideos.filter(row => row.video).length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pr-5 pb-2">
                        {historyVideos.filter(row => row.video).map(row => (
                            <Link href={`/watch/${row.video!.id}`} key={row.id} className="flex-shrink-0 w-44">
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-lg border border-white/5 mb-2">
                                    <img src={row.video!.thumbnail_url} alt={row.video!.title} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold px-1 rounded">{formatDuration(row.video!.duration)}</div>
                                </div>
                                <h3 className="text-sm font-medium leading-tight line-clamp-2 mb-1">{row.video!.title}</h3>
                                <p className="text-[12px] text-gray-500 font-medium">{row.video!.views?.toLocaleString() || 0} views</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-sm">No watch history yet</div>
                )}
            </section>

            {/* Playlists Section */}
            <section className="mb-8 pl-5">
                <div className="flex items-center justify-between pr-5 mb-4 group cursor-pointer">
                    <h2 className="text-xl font-bold tracking-tight">Playlists</h2>
                    <Link href="/playlists" className="text-blue-400 text-sm font-bold border border-blue-500/30 px-3 py-1 rounded-full hover:bg-blue-500/10 transition-all">View all</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pr-5 pb-2">
                    <Link href="/watch-later" className="flex-shrink-0 w-40">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-md border border-white/5 mb-2 flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                            <div className="opacity-20 absolute inset-0 bg-gradient-to-br from-white to-transparent" />
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <h3 className="text-sm font-bold leading-tight mb-1">Watch Later</h3>
                        <p className="text-[12px] text-gray-500 font-medium">View videos</p>
                    </Link>
                    <Link href="/liked" className="flex-shrink-0 w-40">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-md border border-white/5 mb-2 flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                            <div className="opacity-20 absolute inset-0 bg-gradient-to-br from-white to-transparent" />
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                            </div>
                        </div>
                        <h3 className="text-sm font-bold leading-tight mb-1">Liked Videos</h3>
                        <p className="text-[12px] text-gray-500 font-medium">View videos</p>
                    </Link>
                </div>
            </section>

            {/* Profile Switcher Modal */}
            {showProfileSwitcher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Who is watching?</h3>
                            <button 
                                onClick={() => setShowProfileSwitcher(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {userProfiles.length > 0 ? (
                                userProfiles.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSwitchProfile(p.id)}
                                        disabled={isSwitching}
                                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors ${
                                            profile?.id === p.id 
                                                ? 'bg-white/20 border border-white/20' 
                                                : 'hover:bg-white/10 border border-transparent'
                                        }`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5">
                                            {p.avatar ? (
                                                <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-lg font-bold">
                                                    {p.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold">{p.name}</p>
                                            {profile?.id === p.id && (
                                                <span className="text-xs text-gray-400">Current profile</span>
                                            )}
                                        </div>
                                        {isSwitching && profile?.id !== p.id && (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center py-4">No other profiles found</p>
                            )}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-white/10">
                            <Link 
                                href="/select-profile" 
                                className="block w-full text-center py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-colors"
                            >
                                Manage profiles
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
