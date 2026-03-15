'use client';

import Link from 'next/link';

export default function PressPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Press</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">News & Media Resources</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">1. Brand Assets</h2>
                        <p>Download official Playra logos, icons, and brand guidelines for media use. All assets are available in various formats including PNG, SVG, and vector files for print and digital applications.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">2. Company Facts</h2>
                        <p>Playra is developed by Codedwaves LLC. We are a team dedicated to revolutionizing video discovery through innovative technology and user-centered design. Our platform serves creators and viewers worldwide.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">3. Media Inquiries</h2>
                        <p>For press inquiries, interview requests, or additional information about Playra, please contact our media relations team. We are available to provide commentary on the future of video platforms, creator economy trends, and digital content innovation.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">4. Recent News</h2>
                        <p>Stay updated with the latest announcements from Playra including new feature releases, platform milestones, and company updates. Check back regularly for press releases and media coverage.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">5. Partnerships</h2>
                        <p>Playra collaborates with creators, brands, and technology partners to enhance the video discovery experience. We welcome inquiries from potential partners who share our vision for the future of content.</p>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <p className="text-blue-400 font-semibold">
                            This page will be updated soon with downloadable brand assets, press releases, and contact information for media inquiries.
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
