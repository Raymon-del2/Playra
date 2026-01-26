'use client';

import { useState, useEffect } from 'react';
import { getActiveProfile } from '@/app/actions/profile';
import Link from 'next/link';

export default function ChannelPage() {
    const [activeProfile, setActiveProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Home');

    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await getActiveProfile();
            setActiveProfile(profile);
            setLoading(false);
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!activeProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-2xl font-bold">No active profile selected</h1>
                <Link href="/select-profile" className="px-6 py-2 bg-white text-black rounded-full font-bold">
                    Select Profile
                </Link>
            </div>
        );
    }

    const handle = `@${activeProfile.name.replace(/\s+/g, '')}-g8j`; // Emulating the handle style in image

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header Section */}
            <div className="max-w-[1284px] mx-auto px-4 md:px-6 pt-6 sm:pt-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
                    {/* Avatar */}
                    <div className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                        {activeProfile.avatar ? (
                            <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-500">
                                {activeProfile.name[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
                        <h1 className="text-[24px] sm:text-[36px] font-black leading-tight mb-1">{activeProfile.name}</h1>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-2 text-[14px] text-zinc-400 font-medium mb-3">
                            <span className="text-white font-bold">{handle}</span>
                            <span>•</span>
                            <span>No subscribers</span>
                            <span>•</span>
                            <span>No videos</span>
                        </div>

                        <div className="text-[14px] text-zinc-400 mb-6 max-w-2xl group cursor-pointer">
                            More about this channel <span className="text-zinc-500 font-bold group-hover:text-white transition-colors">...more</span>
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                            <button className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-bold transition-colors">
                                Customize channel
                            </button>
                            <button className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-bold transition-colors">
                                Manage videos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 border-b border-white/10">
                    <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
                        {['Home', 'Playlists', 'Posts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm sm:text-[15px] font-bold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-white' : 'text-zinc-400 hover:text-white'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
                                )}
                            </button>
                        ))}
                        <button className="pb-3 text-zinc-400 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="py-12 flex flex-col items-center text-center">
                    {/* Empty State Illustration */}
                    <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl" />

                        {/* Star Section */}
                        <div className="absolute -top-4 -right-2 text-zinc-600 animate-pulse">
                            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l2.4 7.4h7.8l-6.3 4.6 2.4 7.4-6.3-4.6-6.3 4.6 2.4-7.4-6.3-4.6h7.8z" />
                            </svg>
                        </div>

                        {/* Clapboard Section */}
                        <div className="relative transform rotate-[-12deg]">
                            <div className="w-24 h-20 bg-zinc-800 rounded-lg relative overflow-hidden border border-zinc-700 shadow-2xl">
                                {/* Clapboard stripes top */}
                                <div className="h-6 bg-zinc-900 flex -space-x-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-6 h-full bg-teal-400 transform skew-x-[30deg] -translate-x-2" />
                                    ))}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center">
                                        <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom decorative squiggle */}
                        <div className="absolute -bottom-2 text-zinc-700">
                            <svg className="w-16 h-4" viewBox="0 0 64 16" fill="none" stroke="currentColor" strokeWidth={3}>
                                <path d="M0 8q8-8 16 0t16 0 16 0 16 0" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-[18px] font-bold mb-2">Create content on any device</h2>
                    <p className="text-[14px] text-zinc-400 max-w-xs mb-8">
                        Upload and record at home or on the go. Everything you make public will appear here.
                    </p>
                    <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors">
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
