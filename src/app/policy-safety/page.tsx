'use client';

import Link from 'next/link';

export default function PolicySafetyPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Policy & Safety</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Community Guidelines</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">1. Content Standards</h2>
                        <p>Playra maintains high standards for content quality and safety. All uploaded content must comply with our community guidelines. We prohibit hate speech, harassment, violent content, and misinformation that could harm our community.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">2. Reporting System</h2>
                        <p>Our robust reporting system allows users to flag inappropriate content or behavior. Reports are reviewed by our moderation team and appropriate action is taken, including content removal or account suspension when necessary.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">3. Creator Responsibility</h2>
                        <p>Creators are responsible for the content they upload and the interactions they have with their audience. We encourage positive engagement and reserve the right to remove creators who repeatedly violate our policies.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">4. Safety Features</h2>
                        <p>Playra includes built-in safety features such as content filtering, blocking capabilities, and privacy controls. Users can customize their experience to ensure a safe and enjoyable discovery journey.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">5. Enforcement</h2>
                        <p>Violations of our policies may result in warnings, temporary restrictions, or permanent account suspension depending on severity. We are committed to maintaining a safe platform for all users.</p>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <p className="text-blue-400 font-semibold">
                            This page will be updated soon with more comprehensive safety information and detailed community guidelines.
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
