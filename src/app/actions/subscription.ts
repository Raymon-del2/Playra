'use server';

import { turso } from "@/lib/turso";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function subscribe(subscriberId: string, channelId: string) {
    try {
        const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await turso.execute({
            sql: "INSERT INTO subscriptions (id, subscriber_id, channel_id) VALUES (?, ?, ?)",
            args: [id, subscriberId, channelId]
        });

        revalidatePath('/subscriptions');
        revalidatePath(`/channel/${channelId}`);
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            return { success: true }; // Already subscribed
        }
        console.error("Error subscribing:", error);
        return { success: false, error: "Failed to subscribe" };
    }
}

export async function unsubscribe(subscriberId: string, channelId: string) {
    try {
        await turso.execute({
            sql: "DELETE FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?",
            args: [subscriberId, channelId]
        });

        revalidatePath('/subscriptions');
        revalidatePath(`/channel/${channelId}`);
        return { success: true };
    } catch (error) {
        console.error("Error unsubscribing:", error);
        return { success: false, error: "Failed to unsubscribe" };
    }
}

export async function getSubscriptionStatus(subscriberId: string, channelId: string) {
    try {
        const result = await turso.execute({
            sql: "SELECT id FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?",
            args: [subscriberId, channelId]
        });
        return { isSubscribed: result.rows.length > 0 };
    } catch (error) {
        console.error("Error checking subscription:", error);
        return { isSubscribed: false };
    }
}

export async function getSubscriptions(subscriberId: string) {
    try {
        const result = await turso.execute({
            sql: `
                SELECT c.* 
                FROM subscriptions s
                JOIN channels c ON s.channel_id = c.id
                WHERE s.subscriber_id = ?
                ORDER BY s.created_at DESC
            `,
            args: [subscriberId]
        });
        return result.rows.map(row => ({
            id: row.id as string,
            name: row.name as string,
            avatar: row.avatar as string,
            description: row.description as string,
            verified: Boolean(row.verified)
        }));
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return [];
    }
}

export async function getSuggestedCreators(subscriberId: string) {
    try {
        // 1. Get IDs of channels user is already subscribed to
        const subResult = await turso.execute({
            sql: "SELECT channel_id FROM subscriptions WHERE subscriber_id = ?",
            args: [subscriberId]
        });
        const subscribedIds = new Set(subResult.rows.map(r => r.channel_id as string));
        subscribedIds.add(subscriberId); // Don't suggest self

        // 2. Get active creators from Supabase (people who uploaded videos)
        // We limit to 50 unique channels to keep it manageable
        if (!supabase) return [];

        const { data: activeChannels } = await supabase
            .from('videos')
            .select('channel_id')
            .not('channel_id', 'is', null) // filter nulls
            .limit(100);
        // Note: .distinct() or .select('channel_id', { count: 'exact', head: false }) isn't direct in basic select without distinct modifier
        // We'll filter in JS.

        const activeCreatorIds = Array.from(new Set(activeChannels?.map(v => v.channel_id) || []));

        // 3. Filter out already subscribed
        const candidateIds = activeCreatorIds.filter(id => !subscribedIds.has(id));

        // 4. Check if self is a creator (uploaded videos)
        const isSelfCreator = activeCreatorIds.includes(subscriberId);

        // Combine fetch requests
        const idsToFetch = [...candidateIds];
        if (isSelfCreator && !candidateIds.includes(subscriberId)) {
            idsToFetch.push(subscriberId);
        }

        if (idsToFetch.length === 0) return { suggested: [], self: null };

        // 5. Fetch details from Turso
        const placeholders = idsToFetch.map(() => '?').join(',');

        const result = await turso.execute({
            sql: `SELECT * FROM channels WHERE id IN (${placeholders}) LIMIT 25`,
            args: idsToFetch
        });

        const channels = result.rows.map(row => ({
            id: row.id as string,
            name: row.name as string,
            avatar: row.avatar as string,
            description: row.description as string,
            verified: Boolean(row.verified)
        }));

        const selfChannel = channels.find(c => c.id === subscriberId) || null;
        const suggested = channels.filter(c => c.id !== subscriberId);

        return { suggested, self: selfChannel };

    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return { suggested: [], self: null };
    }
}

export async function getSubscriberCount(channelId: string) {
    try {
        const result = await turso.execute({
            sql: "SELECT COUNT(*) as count FROM subscriptions WHERE channel_id = ?",
            args: [channelId]
        });
        return Number(result.rows[0].count);
    } catch (error) {
        console.error("Error getting subscriber count:", error);
        return 0;
    }
}

export async function isSubscribed(subscriberId: string, channelId: string) {
    try {
        const result = await turso.execute({
            sql: "SELECT id, notifications FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?",
            args: [subscriberId, channelId]
        });
        if (result.rows.length > 0) {
            return {
                subscribed: true,
                notifications: Boolean(result.rows[0].notifications ?? 1)
            };
        }
        return { subscribed: false, notifications: false };
    } catch (error) {
        console.error("Error checking subscription:", error);
        return { subscribed: false, notifications: false };
    }
}

export async function subscribeToChannel(subscriberId: string, channelId: string) {
    return subscribe(subscriberId, channelId);
}

export async function unsubscribeFromChannel(subscriberId: string, channelId: string) {
    return unsubscribe(subscriberId, channelId);
}

export async function toggleSubscriptionNotifications(subscriberId: string, channelId: string) {
    try {
        // Get current status
        const result = await turso.execute({
            sql: "SELECT notifications FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?",
            args: [subscriberId, channelId]
        });

        if (result.rows.length === 0) {
            return false;
        }

        const currentNotifications = Boolean(result.rows[0].notifications ?? 1);
        const newNotifications = !currentNotifications;

        await turso.execute({
            sql: "UPDATE subscriptions SET notifications = ? WHERE subscriber_id = ? AND channel_id = ?",
            args: [newNotifications ? 1 : 0, subscriberId, channelId]
        });

        return newNotifications;
    } catch (error) {
        console.error("Error toggling notifications:", error);
        return false;
    }
}
