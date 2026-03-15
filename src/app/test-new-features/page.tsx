'use client';

import Link from 'next/link';

export default function TestNewFeaturesPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Test New Features</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Help Shape the Future of Playra</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">🧪 Be a Beta Tester</h2>
                        <p>Want to try the latest features before everyone else? Join our beta testing program and get early access to experimental tools, new creator features, and platform updates.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">What You Can Do</h2>
                        
                        <div className="grid gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-white mb-2">📹 Test New Video Features</h3>
                                <p className="text-sm">Try out experimental upload tools, new video formats, and advanced editing features. Report any bugs or issues you encounter.</p>
                            </div>
                            
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-white mb-2">🎨 Try Beta Studio Tools</h3>
                                <p className="text-sm">Access preview versions of creator studio updates, new analytics dashboards, and content management features.</p>
                            </div>
                            
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-white mb-2">🔍 Explore Discovery Experiments</h3>
                                <p className="text-sm">Test new recommendation algorithms, search improvements, and feed customization options before they roll out to everyone.</p>
                            </div>
                            
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-white mb-2">🐛 Report Bugs & Issues</h3>
                                <p className="text-sm">Found something broken? Let us know! Your bug reports help us fix issues before features go live.</p>
                            </div>
                            
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <h3 className="text-lg font-bold text-white mb-2">💡 Share Your Feedback</h3>
                                <p className="text-sm">Tell us what works, what doesn&apos;t, and what you&apos;d like to see. Your opinions directly influence our roadmap.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">How to Participate</h2>
                        <ol className="space-y-3 list-decimal list-inside">
                            <li><span className="text-white">Enable Beta Features</span> - Go to Settings and turn on &quot;Beta Features&quot; in your account preferences</li>
                            <li><span className="text-white">Join the Beta Channel</span> - Opt-in to receive beta updates and early access notifications</li>
                            <li><span className="text-white">Test & Report</span> - Use new features and submit feedback through the in-app feedback tool</li>
                            <li><span className="text-white">Join Discord</span> - Connect with other beta testers and the Playra team on our Discord server</li>
                        </ol>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Current Experiments</h2>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>Enhanced vertical feed with auto-preview</li>
                            <li>New creator monetization tools</li>
                            <li>AI-powered content recommendations</li>
                            <li>Collaborative video features</li>
                            <li>Advanced analytics dashboard</li>
                        </ul>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <p className="text-blue-400 font-semibold">
                            Want to join the beta program? Contact us through the feedback form or email us directly. We&apos;re always looking for enthusiastic testers!
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
