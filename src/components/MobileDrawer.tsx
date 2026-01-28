'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type MobileDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    isSignedIn: boolean;
};

export default function MobileDrawer({ isOpen, onClose, isSignedIn }: MobileDrawerProps) {
    const pathname = usePathname();

    if (!isOpen) return null;

    const exploreItems = [
        { icon: 'trending', label: 'Trending', path: '/trending' },
        { icon: 'music', label: 'Music', path: '/music' },
        { icon: 'gaming', label: 'Gaming', path: '/gaming' },
        { icon: 'news', label: 'News', path: '/news' },
        { icon: 'sports', label: 'Sports', path: '/sports' },
        { icon: 'community', label: 'Community', path: '/community' },
    ];

    const settingItems = [
        { icon: 'help', label: 'Help', path: '/help' },
        { icon: 'feedback', label: 'Send feedback', path: '/feedback' },
    ];

    const getIcon = (icon: string) => {
        const icons: { [key: string]: JSX.Element } = {
            trending: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>,
            music: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
            gaming: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm4 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 4c-5.522 0-10 4.478-10 10s4.478 10 10 10 10-4.478 10-10-4.478-10-10-10zM12 18l-1-2h2l-1 2z" /></svg>,
            news: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>,
            sports: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>,
            community: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a5 5 0 00-5-5M7 20H2v-1a5 5 0 015-5m10-6a4 4 0 11-8 0 4 4 0 018 0zm-6 0a4 4 0 01-8 0 4 4 0 018 0z" /></svg>,
            help: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>,
            feedback: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>,
        };
        return icons[icon] || <div className="w-6 h-6 bg-zinc-800 rounded" />;
    };

    return (
        <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-zinc-900 border-r border-white/5 animate-slide-in-left overflow-y-auto scrollbar-hide">
                <div className="px-5 h-14 sm:h-16 flex items-center justify-between border-b border-white/5">
                    <Link href="/" onClick={onClose} className="flex items-center gap-1">
                        <img src="/Playra.png" alt="Playra" className="h-[18px] w-auto brightness-200" />
                    </Link>
                    <button onClick={onClose} className="p-2 -mr-2 text-white/50 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>

                <div className="py-4">
                    <div className="px-5 mb-2">
                        <h3 className="text-[11px] font-black text-white/30 uppercase tracking-widest">Explore</h3>
                    </div>
                    <ul className="space-y-0.5 px-3">
                        {exploreItems.map((item) => (
                            <li key={item.label}>
                                <Link
                                    href={item.path}
                                    className="flex items-center gap-5 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white group"
                                    onClick={onClose}
                                >
                                    <span className="group-hover:scale-110 transition-transform">{getIcon(item.icon)}</span>
                                    <span className="text-[14px] font-bold tracking-tight">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="h-px bg-white/5 mx-5 my-6" />

                    <ul className="space-y-0.5 px-3">
                        {settingItems.map((item) => (
                            <li key={item.label}>
                                <Link
                                    href={item.path}
                                    className="flex items-center gap-5 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white group"
                                    onClick={onClose}
                                >
                                    <span className="group-hover:rotate-12 transition-transform">{getIcon(item.icon)}</span>
                                    <span className="text-[14px] font-bold tracking-tight">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {!isSignedIn && (
                        <div className="mx-6 mt-8 p-6 rounded-[24px] bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/5">
                            <p className="text-[13px] font-bold text-white mb-4 leading-relaxed">Sign in to like videos, comment, and subscribe.</p>
                            <Link
                                href="/signin"
                                onClick={onClose}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/50 text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-400/10 transition-all active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Sign In
                            </Link>
                        </div>
                    )}

                    <div className="mt-12 px-8 pb-12 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                        <Link href="/privacy" onClick={onClose} className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" onClick={onClose} className="hover:text-white transition-colors">Terms</Link>
                        <Link href="/help" onClick={onClose} className="hover:text-white transition-colors">Help</Link>
                        <p className="w-full mt-4 text-[9px] font-bold italic tracking-normal">© 2026 Playra Discovery</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
