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
                        <h2 className="text-2xl font-black text-white italic">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden pointer-events-auto">
                                <summary className="p-5 font-bold cursor-pointer list-none flex justify-between items-center group-open:bg-white/[0.03]">
                                    How do I enable high-fidelity previews?
                                    <span className="group-open:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg></span>
                                </summary>
                                <div className="p-5 text-zinc-400 text-sm border-t border-white/5">Auto-previews are enabled by default on high-performance handheld devices. You can toggle them in settings.</div>
                            </details>

                            <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden pointer-events-auto">
                                <summary className="p-5 font-bold cursor-pointer list-none flex justify-between items-center group-open:bg-white/[0.03]">
                                    How do I upload videos?
                                    <span className="group-open:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg></span>
                                </summary>
                                <div className="p-5 text-zinc-400 text-sm border-t border-white/5">Click the upload button in the sidebar or navigate to the Studio to start uploading your videos. Supported formats include MP4, MOV, and WebM.</div>
                            </details>

                            <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden pointer-events-auto">
                                <summary className="p-5 font-bold cursor-pointer list-none flex justify-between items-center group-open:bg-white/[0.03]">
                                    How do I customize my channel?
                                    <span className="group-open:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg></span>
                                </summary>
                                <div className="p-5 text-zinc-400 text-sm border-t border-white/5">Go to Your channel in the You tab to update your profile picture, banner, bio, and channel name. You can also set your unique Style.</div>
                            </details>

                            <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden pointer-events-auto">
                                <summary className="p-5 font-bold cursor-pointer list-none flex justify-between items-center group-open:bg-white/[0.03]">
                                    How do I subscribe to channels?
                                    <span className="group-open:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg></span>
                                </summary>
                                <div className="p-5 text-zinc-400 text-sm border-t border-white/5">Click the subscribe button on any channel page. You can manage your subscriptions in the Subscriptions tab.</div>
                            </details>

                            <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden pointer-events-auto">
                                <summary className="p-5 font-bold cursor-pointer list-none flex justify-between items-center group-open:bg-white/[0.03]">
                                    How do I report a problem?
                                    <span className="group-open:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg></span>
                                </summary>
                                <div className="p-5 text-zinc-400 text-sm border-t border-white/5">Use our Contact Us page to report bugs, technical issues, or any problems you encounter. We review all reports and respond as quickly as possible.</div>
                            </details>

                            <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden pointer-events-auto">
                                <summary className="p-5 font-bold cursor-pointer list-none flex justify-between items-center group-open:bg-white/[0.03]">
                                    What does the badge mean?
                                    <span className="group-open:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg></span>
                                </summary>
                                <div className="p-5 text-zinc-400 text-sm border-t border-white/5">The badge shows that you are one of the first 500 members to join Playra. It's a special recognition for being an early supporter of our community.</div>
                            </details>

                            <details className="group bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden pointer-events-auto">
                                <summary className="p-5 font-bold cursor-pointer list-none flex justify-between items-center group-open:bg-white/[0.03]">
                                    Is Playra free to use?
                                    <span className="group-open:rotate-180 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg></span>
                                </summary>
                                <div className="p-5 text-zinc-400 text-sm border-t border-white/5">Yes! Playra is free to use for both creators and viewers. We believe in providing an ad-free, accessible platform for everyone.</div>
                            </details>
                        </div>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-3">Still need help?</h3>
                        <p className="mb-4">Can&apos;t find the answer you&apos;re looking for? Contact us directly and we&apos;ll be happy to assist you.</p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-xl hover:bg-zinc-200 transition-colors"
                        >
                            Contact Us
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
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
