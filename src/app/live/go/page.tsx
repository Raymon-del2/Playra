'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GoLivePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Live icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-600/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3">Live Streaming</h1>
        <p className="text-zinc-400 text-lg mb-2">Coming Soon</p>
        <p className="text-zinc-500 mb-8">
          We&apos;re building an amazing live streaming experience for you. 
          Stay tuned for the launch!
        </p>

        {/* Redirect to Studio */}
        <Link
          href="/studio/content"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-full font-bold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Upload Video Instead
        </Link>

        <button
          onClick={() => router.back()}
          className="block mx-auto mt-4 text-zinc-500 hover:text-white transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
