'use client';

import Link from 'next/link';

export default function CopyrightPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Copyright</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Protecting Creative Rights</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">1. Ownership</h2>
                        <p>All content uploaded to Playra remains the intellectual property of its respective creators. By uploading content, you grant Playra a license to host, display, and distribute your content within our platform and related services.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">2. Platform Content</h2>
                        <p>The Playra platform, including its design, logos, trademarks, and proprietary technology, is owned by Codedwaves LLC. Unauthorized use, reproduction, or distribution of Playra&apos;s platform content is strictly prohibited.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">3. DMCA Compliance</h2>
                        <p>Playra respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe your copyrighted work has been used without authorization, please submit a takedown request with sufficient details for us to investigate.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">4. User Responsibility</h2>
                        <p>Users are solely responsible for ensuring they have the necessary rights to upload and share content on Playra. Uploading content that infringes on third-party copyrights may result in account termination and legal action.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">5. Fair Use</h2>
                        <p>Playra recognizes fair use provisions for commentary, criticism, education, and parody. However, users should be familiar with copyright law and ensure their content falls within fair use guidelines before uploading.</p>
                    </section>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <p className="text-blue-400 font-semibold">
                            This page will be updated soon with our complete copyright policy and DMCA takedown procedures.
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
