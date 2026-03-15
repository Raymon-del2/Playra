'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CreateBottomSheet from '@/components/CreateBottomSheet';

export default function MobileNav({
    isSignedIn = false,
    userAvatar = ""
}: {
    isSignedIn?: boolean,
    userAvatar?: string
}) {
    const pathname = usePathname();
    const [isCreateOpen, setIsCreateOpen] = useState(false);    const navItems = [
        { icon: 'home', label: 'Home', path: '/' },
        { icon: 'shorts', label: 'Style', path: '/styles' },
        { icon: 'create', label: '', path: '#', isAction: true },
        { icon: 'subscriptions', label: 'Subscriptions', path: '/subscriptions' },
        { icon: 'you', label: 'You', path: '/library' },
    ];

    const getIcon = (item: any) => {
        const isActive = pathname === item.path;
        const icons: { [key: string]: JSX.Element } = {
            home: isActive ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10V21H9V15H15V21H20V10L12 3L4 10Z" /></svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3L4 10V21H9V15H15V21H20V10L12 3L4 10Z" /></svg>
            ),
            shorts: (
                <svg className="w-6 h-6" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M17.65,10.15L12,5l-5.65,5.15V21h11.3V10.15z" />
                    <path d="M10,13l4,2-4,2V13z" fill="currentColor" />
                </svg>
            ),
            subscriptions: isActive ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 18H14V20H10V18ZM17 18V20H19V18H17ZM5 18V20H7V18H5ZM20 6H4V16H20V6ZM22 4V18H2V4H22Z" /></svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 18H14V20H10V18ZM17 18V20H19V18H17ZM5 18V20H7V18H5ZM20 6H4V16H20V6ZM22 4V18H2V4H22Z" /></svg>
            ),
            you: (
                <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${isActive ? 'border-white' : 'border-white/20'}`}>
                    {isSignedIn && userAvatar ? (
                        <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </div>
                    )}
                </div>
            ),
        };
        return icons[item.icon];
    };

    return (
        <>
            <nav suppressHydrationWarning className="mobile-nav-fixed lg:hidden bg-[#0f0f0f] border-t border-white/5 pb-safe">
                <div suppressHydrationWarning className="flex items-center justify-around h-[50px] w-full">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;

                        // Special handling for Create button
                        if (item.isAction) {
                            return (
                                <button
                                    key="create-action"
                                    onClick={() => setIsCreateOpen(true)}
                                    className="flex items-center justify-center"
                                >
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-90 transition-transform">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    </div>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] active:scale-95 transition-transform"
                            >
                                <span className={`${isActive ? 'text-white' : 'text-zinc-400'} transition-colors`}>
                                    {getIcon(item)}
                                </span>
                                {item.label && (
                                    <span className={`text-[10px] ${isActive ? 'font-bold text-white' : 'font-medium text-zinc-400'} transition-colors`}>
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <CreateBottomSheet isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </>
    );
}

// Add CSS for slide-in animation if not already present

