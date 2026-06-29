'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
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
            window.location.href = '/signin';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (!isOpen || !activeProfile) return null;

    const displayHandle = `@${activeProfile.name.replace(/^@+/, '').replace(/\s+/g, '').toLowerCase()}`;

    return (
        <>
        <div
            ref={menuRef}
            className="absolute top-full mt-2 right-0 w-[300px] bg-[#282828] rounded-xl shadow-2xl py-2 z-50 text-zinc-900 border border-gray-700/50"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700/50 flex gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-300 flex-shrink-0">
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
                    <span className="text-gray-500 text-sm truncate">{displayHandle}</span>
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
            </div>
        </div>
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
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-zinc-300/50 transition-colors text-left group"
        >
            <div className="flex items-center gap-4">
                <span className="text-gray-700 group-hover:text-zinc-900">{icon}</span>
                <span className="text-sm font-normal text-gray-200 group-hover:text-zinc-900">{label}</span>
            </div>
            {hasSubmenu && (
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
