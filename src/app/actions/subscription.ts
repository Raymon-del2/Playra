'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

const newSupabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const newSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';
const newSupabase = createClient(newSupabaseUrl, newSupabaseAnonKey);

export async function subscribe(subscriberId: string, channelId: string) {
    try {
        const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error } = await newSupabase.from('subscriptions').insert({
            id,
            subscriber_id: subscriberId,
            channel_id: channelId,
            notifications: false
        });

        if (error && !error.message.includes('duplicate')) {
            throw error;
        }

        revalidatePath('/subscriptions');
        revalidatePath(`/channel/${channelId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error subscribing:", error);
        return { success: false, error: "Failed to subscribe" };
    }
}

export async function unsubscribe(subscriberId: string, channelId: string) {
    try {
        await newSupabase.from('subscriptions').delete()
            .eq('subscriber_id', subscriberId)
            .eq('channel_id', channelId);

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
        const { data } = await newSupabase.from('subscriptions')
            .select('id')
            .eq('subscriber_id', subscriberId)
            .eq('channel_id', channelId)
            .maybeSingle();
        return { isSubscribed: !!data };
    } catch (error) {
        console.error("Error checking subscription:", error);
        return { isSubscribed: false };
    }
}

export async function getSubscriptions(subscriberId: string) {
    try {
        const { data } = await newSupabase
            .from('subscriptions')
            .select('channel_id, created_at')
            .eq('subscriber_id', subscriberId)
            .order('created_at', { ascending: false });

        if (!data?.length) return [];

        const channelIds = data.map(d => d.channel_id);
        const { data: profiles } = await newSupabase
            .from('profiles')
            .select('id, name, avatar, description, verified')
            .in('id', channelIds);

        return (profiles || []).map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            description: p.description,
            verified: p.verified
        }));
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return [];
    }
}

export async function getSuggestedCreators(subscriberId: string) {
    try {
        // Get IDs of channels user is already subscribed to
        const { data: subs } = await newSupabase
            .from('subscriptions')
            .select('channel_id')
            .eq('subscriber_id', subscriberId);
        
        const subscribedIds = new Set((subs || []).map(r => r.channel_id));
        subscribedIds.add(subscriberId);

        // Get active creators from Supabase
        const { data: activeChannels } = await supabase
            .from('videos')
            .select('channel_id')
            .not('channel_id', 'is', null)
            .limit(100);

        const activeCreatorIds = Array.from(new Set(activeChannels?.map(v => v.channel_id) || []));
        const candidateIds = activeCreatorIds.filter(id => !subscribedIds.has(id));

        if (candidateIds.length === 0) return { suggested: [], self: null };

        // Fetch details from newSupabase profiles
        const { data: profiles } = await newSupabase
            .from('profiles')
            .select('id, name, avatar, description, verified')
            .in('id', candidateIds.slice(0, 25));

        const channels = (profiles || []).map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            description: p.description,
            verified: p.verified
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
        const { count } = await newSupabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channelId);
        return count || 0;
    } catch (error) {
        console.error("Error getting subscriber count:", error);
        return 0;
    }
}

export async function isSubscribed(subscriberId: string, channelId: string) {
    try {
        const { data } = await newSupabase
            .from('subscriptions')
            .select('notifications')
            .eq('subscriber_id', subscriberId)
            .eq('channel_id', channelId)
            .maybeSingle();
        
        if (data) {
            return {
                subscribed: true,
                notifications: data.notifications ?? true
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
        const { data } = await newSupabase
            .from('subscriptions')
            .select('notifications')
            .eq('subscriber_id', subscriberId)
            .eq('channel_id', channelId)
            .maybeSingle();

        if (!data) return false;

        const newNotifications = !data.notifications;

        await newSupabase.from('subscriptions')
            .update({ notifications: newNotifications })
            .eq('subscriber_id', subscriberId)
            .eq('channel_id', channelId);

        return newNotifications;
    } catch (error) {
        console.error("Error toggling notifications:", error);
        return false;
    }
}
