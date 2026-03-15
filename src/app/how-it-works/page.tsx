'use client';

import Link from 'next/link';

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">How Playra Works</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Discover. Create. Connect.</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">1. Vertical Discovery Feed</h2>
                        <p>Playra delivers a next-generation vertical video experience designed for immersive discovery. Our algorithm learns your preferences to surface content that matters to you, creating a personalized journey through videos, styles, and creators.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">2. Style System</h2>
                        <p>Discover and apply unique visual styles to your content. Playra&apos;s Style feature allows creators to define their aesthetic and helps viewers find content that matches their vibe. From minimalist to bold, there&apos;s a style for every creator.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">3. Creator Studio</h2>
                        <p>Our comprehensive Studio gives creators the tools they need to manage content, track analytics, and grow their audience. Upload videos, organize playlists, and engage with your community all in one place.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">4. Community & Engagement</h2>
                        <p>Connect with fellow creators and viewers through comments, likes, and subscriptions. The Community section brings together trending discussions and helps you stay connected with what&apos;s happening.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">5. New Features Coming Soon</h2>
                        <p>We&apos;re constantly evolving Playra to bring you the best discovery experience. Stay tuned for:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Enhanced Music integration for soundtrack discovery</li>
                            <li>Gaming content hub with live streaming capabilities</li>
                            <li>Sports highlights and live event coverage</li>
                            <li>Advanced analytics for creators</li>
                            <li>Mobile app for on-the-go creation and discovery</li>
                        </ul>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <p className="text-blue-400 font-semibold">
                            This page will be updated soon with more detailed information about Playra&apos;s features and capabilities.
                        </p>
                    </div>

                    <section className="pt-10 border-t border-white/5">
                        <Link href="/" className="inline-flex items-center gap-2 text-white font-black hover:text-blue-400 transition-colors uppercase tracking-widest text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Home
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}
