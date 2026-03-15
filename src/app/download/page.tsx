'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Smartphone, Tv, Apple, Download, Play, Bell, Upload } from 'lucide-react';

const DownloadCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  color,
  colorClass,
  version, 
  size,
  downloadUrl,
  downloadText,
  extraContent,
  isRecommended
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  colorClass: string;
  version: string;
  size: string;
  downloadUrl?: string;
  downloadText: string;
  extraContent?: React.ReactNode;
  isRecommended?: boolean;
}) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:bg-zinc-900 hover:border-zinc-700">
      <div className="flex items-start gap-4">
        {/* Modern Icon Container */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {isRecommended && (
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700">
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400">{subtitle}</p>
        </div>
      </div>

      <div className="mt-6">
        {extraContent ? (
          extraContent
        ) : (
          <a
            href={downloadUrl}
            download
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform active:scale-[0.98] hover:bg-zinc-200"
          >
            <Download className="h-4 w-4" />
            {downloadText}
          </a>
        )}
        <p className="mt-3 text-center text-xs text-zinc-500">
          {version} • {size}
        </p>
      </div>
    </div>
  );
};

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
                <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
                    Open in Browser
                </Link>
            </div>

            {/* Hero */}
            <div className="max-w-4xl mx-auto px-6 py-16 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-zinc-800/50 flex items-center justify-center">
                    <img src="/Playra.png" alt="Playra" className="w-16 h-16" />
                </div>

                <h1 className="text-4xl font-black mb-3">Get Playra</h1>
                <p className="text-zinc-400 mb-12 max-w-md mx-auto">
                    Watch videos, subscribe to creators, and discover amazing content — all in one app.
                </p>

                {/* Download Cards - Linear Style */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                    {/* Android */}
                    <DownloadCard
                        title="Android"
                        subtitle="Phones & Tablets"
                        icon={Smartphone}
                        color="bg-green-500/10"
                        colorClass="text-green-400"
                        version="Version 1.0.0"
                        size="12 MB"
                        downloadUrl="/playra.apk"
                        downloadText="Download APK"
                        isRecommended={platform === 'android'}
                    />

                    {/* Android TV */}
                    <DownloadCard
                        title="Android TV"
                        subtitle="Smart TVs & Boxes"
                        icon={Tv}
                        color="bg-purple-500/10"
                        colorClass="text-purple-400"
                        version="Coming Soon"
                        size="15 MB"
                        downloadText=""
                        isRecommended={platform === 'tv'}
                        extraContent={
                            <div className="bg-zinc-800/50 rounded-lg p-4 text-left border border-zinc-800">
                                <p className="text-sm text-zinc-300 mb-3 font-medium">
                                    TV App Coming Soon
                                </p>
                                <p className="text-xs text-zinc-400">
                                    For now, use Playra in your TV browser:
                                </p>
                                <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside mt-2">
                                    <li>Open your TV browser</li>
                                    <li>Go to <strong className="text-zinc-300">playra.com</strong></li>
                                    <li>Watch and enjoy!</li>
                                </ol>
                            </div>
                        }
                    />

                    {/* iOS */}
                    <DownloadCard
                        title="iPhone & iPad"
                        subtitle="Add to Home Screen"
                        icon={Apple}
                        color="bg-blue-500/10"
                        colorClass="text-blue-400"
                        version="Web App"
                        size="No Install"
                        downloadText=""
                        isRecommended={platform === 'ios'}
                        extraContent={
                            <div className="bg-zinc-800/50 rounded-lg p-4 text-left border border-zinc-800">
                                <p className="text-sm text-zinc-300 mb-3 font-medium">
                                    How to install:
                                </p>
                                <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside">
                                    <li>Tap the <strong className="text-zinc-300">Share</strong> button in Safari</li>
                                    <li>Select <strong className="text-zinc-300">"Add to Home Screen"</strong></li>
                                    <li>Tap <strong className="text-zinc-300">"Add"</strong></li>
                                </ol>
                            </div>
                        }
                    />
                </div>

                {/* Features - Linear Style */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
                    <div className="group">
                        <div className="w-12 h-12 bg-zinc-800/50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                            <Play className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-sm text-white">Stream Videos</h3>
                        <p className="text-xs text-zinc-500 mt-1">HD quality streaming</p>
                    </div>
                    <div className="group">
                        <div className="w-12 h-12 bg-zinc-800/50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                            <Bell className="w-6 h-6 text-red-400" />
                        </div>
                        <h3 className="font-semibold text-sm text-white">Subscribe</h3>
                        <p className="text-xs text-zinc-500 mt-1">Follow creators</p>
                    </div>
                    <div className="group">
                        <div className="w-12 h-12 bg-zinc-800/50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                            <Upload className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="font-semibold text-sm text-white">Upload</h3>
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
