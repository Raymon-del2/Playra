'use client';

import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">About Playra</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">The Future of Video Discovery</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Our Mission</h2>
                        <p>Playra is reimagining how people discover and engage with video content. We believe in a vertical, immersive experience that puts creators and viewers first. Our platform combines cutting-edge technology with intuitive design to deliver the next generation of video discovery.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">What Makes Us Different</h2>
                        <p>Unlike traditional platforms, Playra focuses on high-fidelity discovery through our unique vertical feed algorithm. We prioritize genuine engagement over vanity metrics, creating an ecosystem where quality content thrives and creators are fairly rewarded for their work.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">For Creators</h2>
                        <p>We provide powerful tools for content creation, analytics, and audience growth. Our Style system lets you define your unique aesthetic, while the Studio dashboard gives you complete control over your channel and content management.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">For Viewers</h2>
                        <p>Discover content that matches your interests through our personalized discovery feed. Subscribe to your favorite creators, build playlists, and engage with a community that shares your passions.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Our Team</h2>
                        <p>Playra is built by Codedwaves LLC, a team dedicated to pushing the boundaries of digital content platforms. We&apos;re constantly innovating to bring you the best possible experience.</p>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <p className="text-blue-400 font-semibold">
                            This page will be updated soon with more information about our team, history, and vision for the future.
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
