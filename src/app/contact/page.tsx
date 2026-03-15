'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitContactMessage } from '@/app/actions/contact';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        const result = await submitContactMessage(
            formData.name,
            formData.email,
            formData.subject,
            formData.message
        );

        if (result.success) {
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } else {
            setStatus('error');
            setErrorMessage(result.error || 'Failed to send message');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                    <img src="/Playra.png" alt="Playra" className="h-8 w-auto brightness-200 mb-8" />
                    <h1 className="text-4xl font-black mb-4 italic tracking-tight">Contact Us</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">We&apos;d love to hear from you</p>
                </div>

                <div className="space-y-12 text-zinc-400 font-medium leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-white italic">Get in Touch</h2>
                        <p>Have a question, suggestion, or need assistance? Fill out the form below and our team will get back to you as soon as possible.</p>
                    </section>

                    {status === 'success' ? (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-green-400 mb-2">Message Sent!</h3>
                            <p className="text-zinc-400">Thank you for reaching out. We&apos;ve received your message and will respond within 24-48 hours.</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-4 text-white font-semibold hover:text-green-400 transition-colors"
                            >
                                Send another message →
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-semibold text-white">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        minLength={2}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-semibold text-white">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-semibold text-white">Subject</label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-[#1f1f1f]">Select a subject</option>
                                    <option value="general" className="bg-[#1f1f1f]">General Inquiry</option>
                                    <option value="support" className="bg-[#1f1f1f]">Technical Support</option>
                                    <option value="feedback" className="bg-[#1f1f1f]">Feedback</option>
                                    <option value="business" className="bg-[#1f1f1f]">Business Partnership</option>
                                    <option value="bug" className="bg-[#1f1f1f]">Bug Report</option>
                                    <option value="other" className="bg-[#1f1f1f]">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-semibold text-white">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    minLength={10}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Tell us how we can help you..."
                                />
                                <p className="text-xs text-zinc-500">Minimum 10 characters</p>
                            </div>

                            {status === 'error' && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <p className="text-red-400 text-sm">{errorMessage}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full sm:w-auto px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'submitting' ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}

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
