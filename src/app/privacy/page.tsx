'use client';

import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Privacy Policy</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Last updated: January 2026</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">1. Discovery Data Collection</h2>
                        <p>We collect high-fidelity metadata related to your discovery interactions to improve our vertical feed algorithms. This include mutes, auto-previews, and session durations.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">2. Identity Protection</h2>
                        <p>Your email and authentication data via Firebase are encrypted and never shared. We only display your chosen discovery username and bio to the public.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">3. High-Fidelity Analytics</h2>
                        <p>Standard analytics are used to maintain the professional standards of the platform. We ensure that your Discovery experience remains private and strictly under your control.</p>
                    </section>

                    <section className="pt-10 border-t border-white/5">
                        <Link href="/signin" className="inline-flex items-center gap-2 text-white font-black hover:text-blue-400 transition-colors uppercase tracking-widest text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Sign In
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}
