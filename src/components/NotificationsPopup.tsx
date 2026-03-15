'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getSubscriptions } from '@/app/actions/subscription';
import { supabase } from '@/lib/supabase';

interface Notification {
    id: string;
    videoId: string;
    channelName: string;
    channelAvatar: string;
    message: string;
    thumbnail: string;
    timestamp: string;
    createdAt: string;
    isImportant?: boolean;
}

interface NotificationsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onCountChange?: (count: number) => void;
    activeProfile?: any;
}

const STORAGE_KEY = 'playra_dismissed_notifications';

export default function NotificationsPopup({ isOpen, onClose, onCountChange, activeProfile }: NotificationsPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    // Load dismissed notifications from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    setDismissedIds(JSON.parse(stored));
                } catch (e) {
                    console.error('Failed to parse dismissed notifications:', e);
                }
            }
        }
    }, []);

    // Save dismissed notifications to localStorage
    const saveDismissed = useCallback((ids: string[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        }
    }, []);

    // Fetch new videos from subscribed channels
    const fetchNotifications = useCallback(async () => {
        console.log('[Notifications] Fetching for profile:', activeProfile?.id);
        if (!activeProfile?.id) {
            console.log('[Notifications] No active profile, returning empty');
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        try {
            // Get subscribed channels
            console.log('[Notifications] Getting subscriptions for:', activeProfile.id);
            const subscriptions = await getSubscriptions(activeProfile.id);
            console.log('[Notifications] Subscriptions:', subscriptions);
            if (!subscriptions || subscriptions.length === 0) {
                console.log('[Notifications] No subscriptions found');
                setNotifications([]);
                setIsLoading(false);
                return;
            }

            const channelIds = subscriptions.map(sub => sub.id);
            console.log('[Notifications] Channel IDs:', channelIds);

            // Get recent videos from subscribed channels (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            console.log('[Notifications] Looking for videos since:', sevenDaysAgo.toISOString());

            const { data: videos, error } = await supabase!
                .from('videos')
                .select('*')
                .in('channel_id', channelIds)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(20);

            console.log('[Notifications] Videos result:', videos, 'Error:', error);

            if (error) {
                console.error('[Notifications] Supabase error:', error);
                setNotifications([]);
                setIsLoading(false);
                return;
            }

            if (!videos || videos.length === 0) {
                console.log('[Notifications] No videos found in last 7 days');
                setNotifications([]);
                setIsLoading(false);
                return;
            }

            // Map videos to notifications
            const newNotifications: Notification[] = videos.map(video => {
                const channel = subscriptions.find(sub => sub.id === video.channel_id);
                const createdAt = new Date(video.created_at);
                const now = new Date();
                const diffHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
                
                let timeAgo: string;
                if (diffHours < 1) {
                    timeAgo = 'Just now';
                } else if (diffHours < 24) {
                    timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                } else {
                    const diffDays = Math.floor(diffHours / 24);
                    timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                }

                return {
                    id: `notif_${video.id}`,
                    videoId: video.id,
                    channelName: channel?.name || video.channel_name || 'Unknown',
                    channelAvatar: channel?.avatar || video.channel_avatar || '/default-avatar.png',
                    message: `uploaded: ${video.title}`,
                    thumbnail: video.thumbnail_url || '/default-thumbnail.png',
                    timestamp: timeAgo,
                    createdAt: video.created_at,
                    isImportant: diffHours < 6 // Mark as important if less than 6 hours old
                };
            });

            console.log('[Notifications] Created notifications:', newNotifications);

            // Filter out dismissed notifications
            const filteredNotifications = newNotifications.filter(
                notif => !dismissedIds.includes(notif.id)
            );
            console.log('[Notifications] After filtering dismissed:', filteredNotifications);

            setNotifications(filteredNotifications);
        } catch (error) {
            console.error('[Notifications] Failed to fetch notifications:', error);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeProfile?.id, dismissedIds]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setIsLoading(true);
            fetchNotifications();
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, fetchNotifications]);

    useEffect(() => {
        onCountChange?.(notifications.length);
    }, [notifications, onCountChange]);

    const handleDismiss = (notificationId: string) => {
        const newDismissedIds = [...dismissedIds, notificationId];
        setDismissedIds(newDismissedIds);
        saveDismissed(newDismissedIds);
        
        // Remove from current notifications
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    if (!isOpen) return null;

    const importantNotifs = notifications.filter(n => n.isImportant);
    const otherNotifs = notifications.filter(n => !n.isImportant);

    return (
        <div
            ref={popupRef}
            className="absolute top-full mt-2 right-0 w-[420px] max-h-[80vh] bg-[#212121] rounded-xl shadow-2xl z-[100] text-white border border-white/10 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h2 className="text-[16px] font-bold">Notifications</h2>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(80vh-60px)] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="text-zinc-500 text-sm mt-4">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <svg className="w-16 h-16 text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-zinc-500 text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <>
                        {/* Important Section */}
                        {importantNotifs.length > 0 && (
                            <div className="py-2">
                                <h3 className="px-4 py-2 text-[13px] font-bold text-zinc-400">Important</h3>
                                {importantNotifs.map(notif => (
                                    <NotificationItem key={notif.id} notification={notif} onDismiss={handleDismiss} />
                                ))}
                            </div>
                        )}

                        {/* More Notifications Section */}
                        {otherNotifs.length > 0 && (
                            <div className="py-2 border-t border-white/5">
                                <h3 className="px-4 py-2 text-[13px] font-bold text-zinc-400">More notifications</h3>
                                {otherNotifs.map(notif => (
                                    <NotificationItem key={notif.id} notification={notif} onDismiss={handleDismiss} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: (id: string) => void }) {
    return (
        <div className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
            {/* Blue dot for unread */}
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-5 flex-shrink-0" />

            {/* Clickable area to navigate to video */}
            <Link
                href={`/watch/${notification.videoId}`}
                className="flex items-start gap-3 flex-1 min-w-0"
                onClick={() => onDismiss(notification.id)}
            >
                {/* Channel Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                    <img src={notification.channelAvatar} alt={notification.channelName} className="w-full h-full object-cover" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white leading-snug">
                        <span className="font-bold">{notification.channelName}</span>{' '}
                        <span className="text-zinc-300">{notification.message}</span>
                    </p>
                    <p className="text-[12px] text-zinc-500 mt-1">{notification.timestamp}</p>
                </div>

                {/* Thumbnail */}
                <div className="w-[100px] aspect-video rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    <img src={notification.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
            </Link>

            {/* Dismiss button */}
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(notification.id); }}
                className="p-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Dismiss notification"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
