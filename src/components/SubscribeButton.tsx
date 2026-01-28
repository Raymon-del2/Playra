'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    isSubscribed,
    subscribeToChannel,
    unsubscribeFromChannel,
    toggleSubscriptionNotifications,
    getSubscriberCount,
} from '@/app/actions/subscription';

interface SubscribeButtonProps {
    channelId: string;
    channelName?: string;
    profileId?: string | null;
    showCount?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function SubscribeButton({
    channelId,
    channelName,
    profileId,
    showCount = true,
    size = 'md',
    className = '',
}: SubscribeButtonProps) {
    const [subscribed, setSubscribed] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isOwnChannel = profileId === channelId;

    useEffect(() => {
        loadSubscriptionStatus();
    }, [channelId, profileId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadSubscriptionStatus = async () => {
        try {
            const count = await getSubscriberCount(channelId);
            setSubscriberCount(count);

            if (profileId) {
                const status = await isSubscribed(profileId, channelId);
                setSubscribed(status.subscribed);
                setNotifications(status.notifications);
            }
        } catch (error) {
            console.error('Failed to load subscription status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!profileId || isOwnChannel) return;

        setIsAnimating(true);
        try {
            if (subscribed) {
                setShowMenu(!showMenu);
            } else {
                await subscribeToChannel(profileId, channelId);
                setSubscribed(true);
                setNotifications(true);
                setSubscriberCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to subscribe:', error);
        } finally {
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    const handleUnsubscribe = async () => {
        if (!profileId) return;

        try {
            await unsubscribeFromChannel(profileId, channelId);
            setSubscribed(false);
            setNotifications(false);
            setSubscriberCount(prev => Math.max(0, prev - 1));
            setShowMenu(false);
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
        }
    };

    const handleToggleNotifications = async () => {
        if (!profileId) return;

        try {
            const newStatus = await toggleSubscriptionNotifications(profileId, channelId);
            setNotifications(newStatus);
        } catch (error) {
            console.error('Failed to toggle notifications:', error);
        }
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-2.5 text-base',
    };

    if (isOwnChannel) {
        return null;
    }

    if (!profileId) {
        return (
            <Link
                href="/signin"
                className={`inline-flex items-center gap-2 font-bold rounded-full bg-white text-black hover:bg-gray-200 transition-all ${sizeClasses[size]} ${className}`}
            >
                Subscribe
                {showCount && subscriberCount > 0 && (
                    <span className="text-gray-500 font-normal">
                        {formatCount(subscriberCount)}
                    </span>
                )}
            </Link>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className={`
                    inline-flex items-center gap-2 font-bold rounded-full transition-all duration-200
                    ${sizeClasses[size]}
                    ${subscribed
                        ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10'
                        : 'bg-white text-black hover:bg-gray-200'
                    }
                    ${isAnimating ? 'scale-95' : 'scale-100'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${className}
                `}
            >
                {subscribed ? (
                    <>
                        {notifications ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm0-15.5c2.49 0 4 2.02 4 4.5v.1l2 2V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.24.06-.47.15-.69.23l1.64 1.64c.18-.02.36-.05.55-.05zM5.41 3.35L4 4.76l2.81 2.81C6.29 8.57 6 9.74 6 11v5l-2 2v1h14.24l1.74 1.74 1.41-1.41L5.41 3.35zM16 17H8v-6c0-.68.12-1.32.34-1.9L16 16.76V17z" />
                            </svg>
                        )}
                        <span>Subscribed</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </>
                ) : (
                    <>
                        <span>Subscribe</span>
                        {showCount && subscriberCount > 0 && (
                            <span className="opacity-70 font-normal">
                                {formatCount(subscriberCount)}
                            </span>
                        )}
                    </>
                )}
            </button>

            {/* Dropdown Menu */}
            {showMenu && subscribed && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-white/5">
                        <p className="text-sm text-zinc-400">
                            Subscribed to <span className="text-white font-bold">{channelName || 'this channel'}</span>
                        </p>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={handleToggleNotifications}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                        >
                            {notifications ? (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm0-15.5c2.49 0 4 2.02 4 4.5v.1l2 2V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.24.06-.47.15-.69.23l1.64 1.64c.18-.02.36-.05.55-.05zM5.41 3.35L4 4.76l2.81 2.81C6.29 8.57 6 9.74 6 11v5l-2 2v1h14.24l1.74 1.74 1.41-1.41L5.41 3.35zM16 17H8v-6c0-.68.12-1.32.34-1.9L16 16.76V17z" />
                                </svg>
                            )}
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-white">
                                    {notifications ? 'All' : 'None'}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {notifications ? 'Get notified of all uploads' : 'Notifications off'}
                                </p>
                            </div>
                            {notifications && (
                                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={handleUnsubscribe}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-red-400"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm font-bold">Unsubscribe</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
