'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface CreateMenuProps {
    isOpen: boolean;
    onClose: () => void;
    profileId?: string;
}

export default function CreateMenu({ isOpen, onClose, profileId }: CreateMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

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

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[180px] bg-[#282828] rounded-xl shadow-2xl z-[9999] text-zinc-900 border border-zinc-200 py-2 overflow-hidden"
        >
            <div className="px-4 py-2 text-xs text-zinc-500">Create options coming soon</div>
        </div>
    );
}
