'use client';

import Link from 'next/link';

export default function DevelopersPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Developers</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Developer Preview</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                        <h2 className="text-2xl font-black text-yellow-400 mb-2">🚧 Playra — Developer Preview</h2>
                        <p>Playra is currently in <span className="text-white font-bold">active development</span>.</p>
                    </div>

                    <section className="space-y-4">
                        <p>Some features you see are experimental, incomplete, or being rebuilt as we work toward a faster, smarter creator platform. We&apos;re focusing on building tools that empower creators, improve performance, and introduce new ways to create and interact with video content.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">🔧 What&apos;s happening right now</h2>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>Core systems are being optimized</li>
                            <li>New creator tools are under development</li>
                            <li>Studio and analytics upgrades in progress</li>
                            <li>Experimental features being tested internally</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">🧪 Developer Notes</h2>
                        <p>This version is a <span className="text-white font-bold">dev environment</span>. Expect:</p>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>UI changes</li>
                            <li>Temporary placeholders</li>
                            <li>Limited functionality</li>
                            <li>Occasional bugs or resets</li>
                        </ul>
                        <p>Your feedback helps shape Playra while it evolves.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">⏳ Coming Soon</h2>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>Enhanced creator studio</li>
                            <li>Improved discovery feed</li>
                            <li>Collaboration & remix upgrades</li>
                            <li>Performance improvements across devices</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <p>Thanks for being early. You&apos;re seeing Playra while it&apos;s still being built.</p>
                        <p className="text-white font-bold">— Playra Development</p>
                    </section>

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
