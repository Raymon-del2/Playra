'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function DownloadPage() {
    const [platform, setPlatform] = useState<'android' | 'ios' | 'tv' | 'desktop'>('desktop');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userAgent = window.navigator.userAgent.toLowerCase();
            if (/android/i.test(userAgent)) {
                if (/tv|television|smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast.tv/i.test(userAgent)) {
                    setPlatform('tv');
                } else {
                    setPlatform('android');
                }
            } else if (/iphone|ipad|ipod/i.test(userAgent)) {
                setPlatform('ios');
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/Playra.png" alt="Playra" className="w-8 h-8" />
                    <span className="font-bold text-lg">Playra</span>
                </Link>
                <Link href="/" className="text-sm text-zinc-400 hover:text-white">
                    Open in Browser
                </Link>
            </div>

            {/* Hero */}
            <div className="max-w-2xl mx-auto px-6 py-16 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                    <img src="/Playra.png" alt="Playra" className="w-16 h-16" />
                </div>

                <h1 className="text-4xl font-black mb-3">Get Playra</h1>
                <p className="text-zinc-400 mb-10 max-w-md mx-auto">
                    Watch videos, subscribe to creators, and discover amazing content - all in one app.
                </p>

                {/* Download Buttons */}
                <div className="space-y-4 max-w-sm mx-auto">
                    {/* Android */}
                    <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.6 11.5c-.3 0-.6-.1-.8-.3l-4.8-4.8c-.4-.4-.4-1.1 0-1.5l4.8-4.8c.2-.2.5-.3.8-.3s.6.1.8.3c.4.4.4 1.1 0 1.5L14.3 5.9l4.1 4.1c.4.4.4 1.1 0 1.5-.2.2-.5.3-.8.3z" />
                                    <path d="M6.4 11.5c-.3 0-.6-.1-.8-.3-.4-.4-.4-1.1 0-1.5l4.1-4.1-4.1-4.1c-.4-.4-.4-1.1 0-1.5.4-.4 1.1-.4 1.5 0l4.8 4.8c.4.4.4 1.1 0 1.5l-4.8 4.8c-.2.2-.5.3-.7.3z" />
                                    <path d="M12 24c-1.2 0-2.2-.4-3-1.2l-6-6c-1.6-1.6-1.6-4.3 0-5.9l6-6c.8-.8 1.8-1.2 3-1.2s2.2.4 3 1.2l6 6c.8.8 1.2 1.8 1.2 3s-.4 2.2-1.2 3l-6 6c-.8.8-1.8 1.2-3 1.2zm0-18.2c-.6 0-1.2.2-1.6.7l-6 6c-.9.9-.9 2.4 0 3.3l6 6c.4.4 1 .7 1.6.7s1.2-.2 1.6-.7l6-6c.4-.4.7-1 .7-1.6s-.2-1.2-.7-1.6l-6-6c-.4-.5-1-.8-1.6-.8z" />
                                </svg>
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold">Android</h3>
                                <p className="text-xs text-zinc-500">Phones & Tablets</p>
                            </div>
                            {platform === 'android' && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                    Recommended
                                </span>
                            )}
                        </div>
                        <a
                            href="/playra.apk"
                            download
                            className="block w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                        >
                            Download APK
                        </a>
                        <p className="text-xs text-zinc-500 mt-2">
                            Version 1.0.0 • 12 MB
                        </p>
                    </div>

                    {/* Android TV */}
                    <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold">Android TV</h3>
                                <p className="text-xs text-zinc-500">Smart TVs & Streaming Boxes</p>
                            </div>
                            {platform === 'tv' && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                                    Recommended
                                </span>
                            )}
                        </div>
                        <a
                            href="/playra-tv.apk"
                            download
                            className="block w-full bg-zinc-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-zinc-600 transition-colors"
                        >
                            Download TV APK
                        </a>
                        <p className="text-xs text-zinc-500 mt-2">
                            Optimized for big screens
                        </p>
                    </div>

                    {/* iOS */}
                    <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                            </div>
                            <div className="text-left flex-1">
                                <h3 className="font-bold">iPhone & iPad</h3>
                                <p className="text-xs text-zinc-500">Add to Home Screen</p>
                            </div>
                            {platform === 'ios' && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                    Recommended
                                </span>
                            )}
                        </div>
                        <div className="bg-zinc-700/50 rounded-xl p-3 text-left">
                            <p className="text-sm text-zinc-300 mb-2">
                                <strong>How to install:</strong>
                            </p>
                            <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
                                <li>Tap the <strong>Share</strong> button in Safari</li>
                                <li>Select <strong>"Add to Home Screen"</strong></li>
                                <li>Tap <strong>"Add"</strong></li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
                    <div>
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-sm">Stream Videos</h3>
                        <p className="text-xs text-zinc-500 mt-1">HD quality streaming</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-sm">Subscribe</h3>
                        <p className="text-xs text-zinc-500 mt-1">Follow creators</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-sm">Upload</h3>
                        <p className="text-xs text-zinc-500 mt-1">Share your videos</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-8 border-t border-white/5">
                <p className="text-xs text-zinc-500">
                    © 2026 Playra. All rights reserved.
                </p>
            </div>
        </div>
    );
}
