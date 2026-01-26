'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Adjust import if needed
import { signOut } from 'firebase/auth';

interface ProfileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    activeProfile: any;
    userEmail?: string;
}

export default function ProfileMenu({ isOpen, onClose, activeProfile, userEmail }: ProfileMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

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

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // Optional: Clear active profile cookie manually if needed, 
            // but session handling should probably do it or middleware.
            // For now, reload or redirect to home.
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (!isOpen || !activeProfile) return null;

    return (
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
                    <span className="text-gray-400 text-sm truncate">@{activeProfile.name.replace(/\s+/g, '').toLowerCase()}</span>
                    <Link href="/channel" className="text-blue-400 text-sm mt-1 hover:text-blue-300">
                        View your channel
                    </Link>
                </div>
            </div>

            <div className="max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
                {/* Section 1 */}
                <div className="py-2 border-b border-gray-700/50">
                    <MenuItem icon={<GoogleIcon />} label="Google Account" />
                    <MenuItem
                        icon={<SwitchAccountIcon />}
                        label="Switch account"
                        hasSubmenu
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
                    <MenuItem icon={<StudioIcon />} label="Playra Studio" />
                    <MenuItem icon={<PurchasesIcon />} label="Purchases and memberships" />
                </div>

                {/* Section 3 */}
                <div className="py-2 border-b border-gray-700/50">
                    <MenuItem icon={<DataIcon />} label="Your data in Playra" />
                    <MenuItem icon={<AppearanceIcon />} label="Appearance: Device theme" hasSubmenu />
                    <MenuItem icon={<LanguageIcon />} label="Display language: English" hasSubmenu />
                    <MenuItem icon={<RestrictedIcon />} label="Restricted Mode: Off" hasSubmenu />
                    <MenuItem icon={<LocationIcon />} label="Location: Kenya" hasSubmenu />
                    <MenuItem icon={<KeyboardIcon />} label="Keyboard shortcuts" />
                </div>

                {/* Section 4 */}
                <div className="py-2 border-b border-gray-700/50">
                    <MenuItem icon={<SettingsIcon />} label="Settings" />
                </div>

                {/* Section 5 */}
                <div className="py-2">
                    <MenuItem icon={<HelpIcon />} label="Help" />
                    <MenuItem icon={<FeedbackIcon />} label="Send feedback" />
                </div>
            </div>
        </div>
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
const GoogleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
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

const PurchasesIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DataIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const AppearanceIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const LanguageIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
);

const RestrictedIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LocationIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const KeyboardIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const HelpIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const FeedbackIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);
