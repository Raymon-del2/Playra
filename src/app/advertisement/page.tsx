'use client';

import Link from 'next/link';

export default function AdvertisementPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Advertisement</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Our Stance on Ads</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">We Hate Ads</h2>
                        <p>Let&apos;s be clear: <span className="text-white font-bold">We do not like advertisements.</span> We hate them. Ads destroy the user experience, interrupt creative flow, and turn meaningful content consumption into a frustrating chore.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Why Ads Ruin Everything</h2>
                        <ul className="space-y-3 list-disc list-inside">
                            <li><span className="text-white">They break workflow</span> - Nothing kills your vibe like an ad popping up mid-video</li>
                            <li><span className="text-white">They waste time</span> - Your time is valuable, and ads steal it from you</li>
                            <li><span className="text-white">They ruin immersion</span> - Great content deserves uninterrupted attention</li>
                            <li><span className="text-white">They compromise privacy</span> - Ad tracking follows you everywhere</li>
                            <li><span className="text-white">They clutter the interface</span> - Clean design is impossible with ad banners everywhere</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">The Playra Difference</h2>
                        <p>Playra is built on a different philosophy. We believe discovery should be pure, uninterrupted, and focused on what matters: <span className="text-white font-bold">great content and genuine connections.</span></p>
                        <p>We will never force ads on our users. No pre-rolls. No mid-rolls. No banner ads. No tracking pixels. Your experience comes first.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Supporting Creators Without Ads</h2>
                        <p>We&apos;re building alternative ways for creators to earn revenue that don&apos;t rely on ruining the viewer experience. Direct support, premium features, and creator-first monetization models that respect everyone involved.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">No Ads. Period.</h2>
                        <p>If you&apos;re looking to advertise on Playra, we respectfully decline. This platform is an ad-free zone, and that&apos;s never going to change. We&apos;re here for the creators, the viewers, and the love of content - not for ad revenue.</p>
                    </section>

                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                        <p className="text-green-400 font-semibold text-center text-lg">
                            🚫 Advertisement Free Zone 🚫
                        </p>
                        <p className="text-zinc-400 text-center mt-2">
                            Enjoy your content. Without interruptions.
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
