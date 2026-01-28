'use client';

import { useState, useEffect } from 'react';
import { getActiveProfile } from '@/app/actions/profile';
import { getSubscriptions, getSuggestedCreators, subscribe, unsubscribe } from '@/app/actions/subscription';
import Link from 'next/link';

type Channel = {
    id: string;
    name: string;
    avatar: string;
    description: string;
    verified: boolean;
};

export default function SubscriptionsPage() {
    const [activeProfile, setActiveProfile] = useState<any>(null);
    const [subscriptions, setSubscriptions] = useState<Channel[]>([]);
    const [suggestions, setSuggestions] = useState<Channel[]>([]);
    const [selfChannel, setSelfChannel] = useState<Channel | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingMap, setProcessingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profile = await getActiveProfile();
                setActiveProfile(profile);

                if (profile) {
                    const [subs, suggsData] = await Promise.all([
                        getSubscriptions(profile.id),
                        getSuggestedCreators(profile.id)
                    ]);
                    setSubscriptions(subs);
                    if (suggsData && typeof suggsData === 'object' && 'suggested' in suggsData) {
                        setSuggestions(suggsData.suggested);
                        setSelfChannel(suggsData.self);
                    } else {
                        setSuggestions(Array.isArray(suggsData) ? suggsData : []);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubscribe = async (channel: Channel) => {
        if (!activeProfile || processingMap[channel.id]) return;

        setProcessingMap(prev => ({ ...prev, [channel.id]: true }));

        // Optimistic update - move from suggestions to subscriptions
        setSubscriptions(prev => [...prev, channel]);
        setSuggestions(prev => prev.filter(c => c.id !== channel.id));

        try {
            await subscribe(activeProfile.id, channel.id);
            // Confirm from server
            const latestSubs = await getSubscriptions(activeProfile.id);
            setSubscriptions(latestSubs);
        } catch (error) {
            console.error(error);
            // Revert on error
            if (activeProfile) {
                const revertSubs = await getSubscriptions(activeProfile.id);
                setSubscriptions(revertSubs);
                const suggsData = await getSuggestedCreators(activeProfile.id);
                if (suggsData && 'suggested' in suggsData) {
                    setSuggestions(suggsData.suggested);
                }
            }
        } finally {
            setProcessingMap(prev => ({ ...prev, [channel.id]: false }));
        }
    };

    const handleUnsubscribe = async (channel: Channel) => {
        if (!activeProfile || processingMap[channel.id]) return;

        setProcessingMap(prev => ({ ...prev, [channel.id]: true }));

        // Optimistic update - move from subscriptions to suggestions
        setSubscriptions(prev => prev.filter(c => c.id !== channel.id));
        setSuggestions(prev => [channel, ...prev]);

        try {
            await unsubscribe(activeProfile.id, channel.id);
            const latestSubs = await getSubscriptions(activeProfile.id);
            setSubscriptions(latestSubs);
        } catch (error) {
            console.error(error);
            if (activeProfile) {
                const revertSubs = await getSubscriptions(activeProfile.id);
                setSubscriptions(revertSubs);
            }
        } finally {
            setProcessingMap(prev => ({ ...prev, [channel.id]: false }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-zinc-600 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!activeProfile) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center gap-4">
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold">Sign in to see your subscriptions</h1>
                <p className="text-zinc-400 text-sm text-center max-w-md">
                    Subscribe to channels to get updates on their latest videos
                </p>
                <Link href="/select-profile" className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors">
                    Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white pb-24">
            {/* Header */}
            <div className="px-4 pt-6 pb-4">
                <h1 className="text-2xl font-bold">Subscriptions</h1>
            </div>

            {/* Your Subscriptions - Horizontal Scroll */}
            <div className="mb-8">
                <h2 className="text-base font-semibold px-4 mb-3 text-zinc-300">Your channels</h2>
                {subscriptions.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
                        {subscriptions.map((sub) => (
                            <div key={sub.id} className="flex flex-col items-center min-w-[80px] group">
                                <Link href={`/channel/${sub.id}`} className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500 transition-all bg-zinc-800">
                                            <img src={sub.avatar} alt={sub.name} className="w-full h-full object-cover" />
                                        </div>
                                        {sub.verified && (
                                            <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-center text-zinc-400 group-hover:text-white mt-2 truncate w-20 leading-tight font-medium">
                                        {sub.name}
                                    </p>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-8 text-center">
                        <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-zinc-400 text-sm">No subscriptions yet</p>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mx-4 mb-6" />

            {/* Suggested Creators - Horizontal Scroll */}
            {(suggestions.length > 0 || selfChannel) && (
                <div>
                    <h2 className="text-base font-semibold px-4 mb-1 text-zinc-300">Discover creators</h2>
                    <p className="text-xs text-zinc-500 px-4 mb-4">Subscribe to see their videos in your feed</p>

                    <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide">
                        {/* Self Channel Card */}
                        {selfChannel && (
                            <div className="flex-shrink-0 w-44 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
                                <div className="absolute top-2 right-2 bg-blue-500 text-[9px] font-bold px-2 py-0.5 rounded-full">YOU</div>
                                <Link href={`/channel/${selfChannel.id}`}>
                                    <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-700 ring-2 ring-blue-400/50 mb-2">
                                        <img src={selfChannel.avatar} alt={selfChannel.name} className="w-full h-full object-cover" />
                                    </div>
                                </Link>
                                <Link href={`/channel/${selfChannel.id}`}>
                                    <h3 className="font-bold text-sm text-center truncate w-32">{selfChannel.name}</h3>
                                </Link>
                                <p className="text-[10px] text-blue-400 mb-3">Your Channel</p>
                                <Link href="/studio/content" className="w-full">
                                    <button className="w-full bg-blue-600 text-white py-2 rounded-full text-xs font-bold hover:bg-blue-700 transition-colors">
                                        Manage Channel
                                    </button>
                                </Link>
                            </div>
                        )}

                        {/* Suggested Creators */}
                        {suggestions.map((creator) => (
                            <div key={creator.id} className="flex-shrink-0 w-44 bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col items-center hover:bg-zinc-800/80 transition-colors">
                                <Link href={`/channel/${creator.id}`}>
                                    <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-700 mb-2">
                                        <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                                    </div>
                                </Link>
                                <Link href={`/channel/${creator.id}`}>
                                    <h3 className="font-bold text-sm text-center truncate w-32 hover:text-blue-400 transition-colors">{creator.name}</h3>
                                </Link>
                                <p className="text-[10px] text-zinc-500 mb-3 truncate w-32 text-center">
                                    {creator.description || 'Creator'}
                                </p>
                                <button
                                    onClick={() => handleSubscribe(creator)}
                                    disabled={processingMap[creator.id]}
                                    className="w-full bg-white text-black py-2 rounded-full text-xs font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processingMap[creator.id] ? (
                                        <span className="flex items-center justify-center gap-1">
                                            <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                        </span>
                                    ) : (
                                        'Subscribe'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {suggestions.length === 0 && !selfChannel && (
                        <div className="text-center py-8 text-zinc-500 text-sm px-4">
                            No creators to recommend right now. Check back later!
                        </div>
                    )}
                </div>
            )}

            {/* Empty state when no suggestions and no subscriptions */}
            {suggestions.length === 0 && subscriptions.length === 0 && !selfChannel && (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold mb-2">No creators found</h2>
                    <p className="text-zinc-400 text-sm max-w-sm">
                        Upload your first video to become a creator, or explore the home page to find channels to subscribe to.
                    </p>
                    <div className="flex gap-3 mt-6">
                        <Link href="/" className="px-5 py-2 bg-zinc-800 text-white rounded-full text-sm font-bold hover:bg-zinc-700 transition-colors">
                            Explore
                        </Link>
                        <Link href="/studio/upload" className="px-5 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors">
                            Upload Video
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
