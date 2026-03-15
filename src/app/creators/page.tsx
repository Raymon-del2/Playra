'use client';

import Link from 'next/link';

export default function CreatorsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">For Creators</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Build Your Audience</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">1. Getting Started</h2>
                        <p>Start your creative journey on Playra by creating your channel. Choose a unique username, add a bio, and upload your first video. Our platform is designed to help new creators find their audience from day one.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">2. Creator Studio</h2>
                        <p>Our powerful Studio dashboard gives you everything you need to manage your content. Upload videos, track performance with analytics, respond to comments, and organize your channel - all in one place.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">3. Style System</h2>
                        <p>Stand out with Playra&apos;s unique Style system. Define your visual aesthetic and help viewers discover content that matches their vibe. From minimalist to bold, your style is your brand.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">4. Growing Your Audience</h2>
                        <p>Build your community through consistent uploads, engaging with your viewers, and collaborating with other creators. Our discovery algorithm helps your content reach the right audience.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">5. Monetization</h2>
                        <p>Playra is committed to supporting creators. As we grow, we&apos;ll be introducing new ways for creators to earn from their content and build sustainable channels.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">6. Guidelines</h2>
                        <p>Follow our community guidelines to keep your channel in good standing. We encourage authentic, engaging content that adds value to our community.</p>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <p className="text-blue-400 font-semibold">
                            This page will be updated soon with more resources, tutorials, and tips for creators.
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
