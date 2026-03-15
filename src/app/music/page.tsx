'use client';

import Link from 'next/link';

export default function MusicPage() {
    return (
        <div className="min-h-screen bg-gray-900 pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent" />

                <div className="relative px-6 py-12 md:py-16">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Music
                            </h1>
                            <p className="text-zinc-400 text-sm mt-1">
                                Discover trending songs and artists
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon Content */}
            <div className="px-4 md:px-6 max-w-5xl">
                <div className="text-center py-20">
                    <div className="relative w-full max-w-md mx-auto h-56 rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-purple-500/10">
                        <img 
                            src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80" 
                            alt="Music Coming Soon" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/20">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                Coming Soon
                            </span>
                        </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Music is Coming Soon</h2>
                    <p className="text-zinc-400 max-w-lg mx-auto mb-8 text-lg">
                        Get ready for a dedicated music experience on Playra. Discover trending songs, artists, and music videos all in one place.
                    </p>
                    <Link 
                        href="/trending"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Browse Trending Now
                    </Link>
                </div>

                {/* Features Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 text-center">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-white mb-1">Music Videos</h3>
                        <p className="text-sm text-zinc-500">Watch official music videos from your favorite artists</p>
                    </div>
                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 text-center">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-white mb-1">Artists</h3>
                        <p className="text-sm text-zinc-500">Follow artists and discover new music</p>
                    </div>
                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 text-center">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-white mb-1">Playlists</h3>
                        <p className="text-sm text-zinc-500">Create and share your own playlists</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
