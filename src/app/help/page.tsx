'use client';

import Link from 'next/link';

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Support Hub</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Playra Discovery Assistant</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
                        <h3 className="text-xl font-black text-white mb-3">Discovery Issues</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">Having trouble with auto-previews or the vertical feed? Try clearing your handheld cache.</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
                        <h3 className="text-xl font-black text-white mb-3">Account Setup</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">Need to change your unique discovery metadata? You can adjust your bio and username in the You tab.</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Common Questions</h2>
                        <div className="space-y-4">
                            <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden pointer-events-auto">
                                <summary className="p-5 font-bold cursor-pointer list-none flex justify-between items-center group-open:bg-white/[0.03]">
                                    How do I enable high-fidelity previews?
                                    <span className="group-open:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg></span>
                                </summary>
                                <div className="p-5 text-zinc-400 text-sm border-t border-white/5">Auto-previews are enabled by default on high-performance handheld devices. You can toggle them in settings.</div>
                            </details>
                        </div>
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
