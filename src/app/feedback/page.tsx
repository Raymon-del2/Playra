'use client';

import Link from 'next/link';

export default function FeedbackPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Feedback</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">We Want to Hear From You</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">How to Leave Feedback</h2>
                        <p>Your feedback helps us improve Playra for everyone. Whether you found a bug, have a suggestion, or just want to share your thoughts, we want to hear from you.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Send Us a Message</h2>
                        <p>The best way to share your feedback is through our <span className="text-white font-bold">Contact Us</span> page. You can send us detailed messages about:</p>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>Bug reports and technical issues</li>
                            <li>Feature suggestions and ideas</li>
                            <li>General feedback about the platform</li>
                            <li>Questions about using Playra</li>
                            <li>Partnership or collaboration inquiries</li>
                        </ul>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-3">📬 Ready to share your feedback?</h3>
                        <p className="mb-4">Click the button below to go to our contact form and send us your message.</p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-xl hover:bg-zinc-200 transition-colors"
                        >
                            Go to Contact Us
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">What We Do With Your Feedback</h2>
                        <ul className="space-y-2 list-disc list-inside">
                            <li><span className="text-white">Review every submission</span> - We read all feedback we receive</li>
                            <li><span className="text-white">Track feature requests</span> - Popular suggestions get prioritized</li>
                            <li><span className="text-white">Fix bugs quickly</span> - Bug reports help us identify and resolve issues</li>
                            <li><span className="text-white">Improve the platform</span> - Your insights directly influence our roadmap</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Thank You!</h2>
                        <p>We truly appreciate you taking the time to help make Playra better. Every piece of feedback brings us closer to building the platform you want to use.</p>
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
