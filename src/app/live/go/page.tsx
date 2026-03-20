'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GoLivePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* Hero Image Section */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        {/* Background Image - Live streaming abstract */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f]/60 via-transparent to-[#0f0f0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 via-transparent to-red-600/30" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
          {/* Pulsing Live Badge */}
          <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 border border-red-500/30 backdrop-blur-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <span className="text-red-400 font-semibold text-sm tracking-wide">LIVE</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-red-400">
            Go Live
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl">
            Connect with your audience in real-time
          </p>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/80 border border-zinc-700 mb-8">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-zinc-300 text-sm font-medium">Coming Soon</span>
          </div>

          <h2 className="text-2xl font-bold mb-4">Live Streaming is on its way</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            We&apos;re building an amazing live streaming experience for you. 
            Stream directly to your audience, interact in real-time, and grow your community.
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">Go Live Anywhere</p>
              <p className="text-xs text-zinc-500 mt-1">Stream from any device</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">Real-time Chat</p>
              <p className="text-xs text-zinc-500 mt-1">Engage with viewers</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">Grow Community</p>
              <p className="text-xs text-zinc-500 mt-1">Build your audience</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">Analytics</p>
              <p className="text-xs text-zinc-500 mt-1">Track your growth</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link
              href="/studio/content"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-black rounded-full font-bold transition-colors hover:bg-zinc-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Upload Video Instead
            </Link>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center w-full px-6 py-3 text-zinc-500 hover:text-white transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
