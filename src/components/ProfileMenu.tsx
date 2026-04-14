'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { submitFeedback } from '@/app/actions/feedback';

interface ProfileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    activeProfile: any;
    userEmail?: string;
}

export default function ProfileMenu({ isOpen, onClose, activeProfile, userEmail }: ProfileMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Reset feedback state when dropdown closes
    useEffect(() => {
        if (!isOpen) {
            setIsFeedbackOpen(false);
            setSubmitSuccess(false);
            setFeedbackMessage('');
        }
    }, [isOpen]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            window.location.href = '/signin';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackMessage.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setSubmitSuccess(true);
        
        try {
            await submitFeedback(feedbackMessage);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setIsSubmitting(false);
            setFeedbackMessage('');
            setTimeout(() => {
                setIsFeedbackOpen(false);
                setSubmitSuccess(false);
            }, 2000);
        }
    };

    if (!isOpen || !activeProfile) return null;

    const displayHandle = `@${activeProfile.name.replace(/^@+/, '').replace(/\s+/g, '').toLowerCase()}`;

    return (
        <>
        <div
            ref={menuRef}
            className="absolute top-full mt-2 right-0 w-[300px] bg-[#282828] rounded-xl shadow-2xl py-2 z-50 text-white border border-gray-700/50"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700/50 flex gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                    {activeProfile.avatar ? (
                        <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                            {activeProfile.name?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">{activeProfile.name}</span>
                    <span className="text-gray-400 text-sm truncate">{displayHandle}</span>
                    <Link href={`/channel/${activeProfile.id}`} className="text-blue-400 text-sm mt-1 hover:text-blue-300">
                        View your channel
                    </Link>
                </div>
            </div>

            <div className="py-2">
                {/* Section 1 */}
                <div className="py-2 border-b border-gray-700/50">
                    <MenuItem
                        icon={<SwitchAccountIcon />}
                        label="Switch account"
                        onClick={() => router.push('/select-profile')}
                    />
                    <MenuItem
                        icon={<SignOutIcon />}
                        label="Sign out"
                        onClick={handleSignOut}
                    />
                </div>

                {/* Section 2 */}
                <div className="py-2 border-b border-gray-700/50">
                    <MenuItem
                        icon={<StudioIcon />}
                        label="Playra Studio"
                        onClick={() => router.push('/studio')}
                    />
                </div>

                {/* Section 3 */}
                <div className="py-2">
                    <MenuItem
                        icon={<BeHelperIcon />}
                        label="Be a helper"
                        onClick={() => { onClose(); setIsFeedbackOpen(true); }}
                    />
                </div>
            </div>
        </div>

        {isFeedbackOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60" onClick={() => setIsFeedbackOpen(false)} />
                <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                    <button
                        onClick={() => { setIsFeedbackOpen(false); setSubmitSuccess(false); setFeedbackMessage(''); }}
                        className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {!submitSuccess ? (
                        <>
                            <h3 className="text-xl font-bold text-white mb-2">Help Playra Grow</h3>
                            <p className="text-sm text-zinc-400 mb-4">Share your ideas, feedback, or suggestions to help improve Playra.</p>

                            <form onSubmit={handleFeedbackSubmit}>
                                <textarea
                                    value={feedbackMessage}
                                    onChange={(e) => setFeedbackMessage(e.target.value)}
                                    placeholder="What would you like to share?"
                                    className="w-full h-32 bg-zinc-800 border border-white/10 rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                                    disabled={isSubmitting}
                                />

                                <button
                                    type="submit"
                                    disabled={!feedbackMessage.trim() || isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                            <p className="text-sm text-zinc-400">Your feedback helps make Playra better.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
        </>
    );
}

function MenuItem({
    icon,
    label,
    hasSubmenu = false,
    onClick
}: {
    icon: React.ReactNode,
    label: string,
    hasSubmenu?: boolean,
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-zinc-700/50 transition-colors text-left group"
        >
            <div className="flex items-center gap-4">
                <span className="text-gray-300 group-hover:text-white">{icon}</span>
                <span className="text-sm font-normal text-gray-200 group-hover:text-white">{label}</span>
            </div>
            {hasSubmenu && (
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            )}
        </button>
    );
}

// Icons
const CmailIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="12" y="16" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">C</text>
    </svg>
);

const SwitchAccountIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const SignOutIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const StudioIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const FeedbackIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);

const BeHelperIcon = () => (
    <img src="/self_improvement_24dp_EFEFEF_FILL0_wght400_GRAD0_opsz24.svg" className="w-6 h-6" alt="" />
);
