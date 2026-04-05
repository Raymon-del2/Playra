'use server';

import { createClient } from '@supabase/supabase-js';

const newSupabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const newSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';
const newSupabase = createClient(newSupabaseUrl, newSupabaseAnonKey);

export type ViewRecord = {
    id: string;
    video_id: string;
    profile_id: string | null;
    viewed_at: string;
    hour_of_day: number;
};

// Track when a video is viewed
export async function trackVideoView(videoId: string, profileId?: string) {
    try {
        const now = new Date();
        const hour = now.getHours();
        const id = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await newSupabase.from('video_views').insert({
            id,
            video_id: videoId,
            profile_id: profileId || null,
            user_id: profileId || null,
            watched_seconds: 0,
            created_at: now.toISOString()
        });
        
        return { success: true };
    } catch (error) {
        console.error("Error tracking video view:", error);
        return { success: false };
    }
}

// Get peak viewing time for a channel's videos
export async function getPeakViewingTime(channelId: string): Promise<string> {
    try {
        // Get all video IDs for this channel from old Supabase
        const { supabase: oldSupabase } = await import("@/lib/supabase");
        const { data: videos } = await oldSupabase
            .from('videos')
            .select('id')
            .eq('channel_id', channelId);
        
        if (!videos || videos.length === 0) return "No data";
        
        const videoIds = videos.map(v => v.id);
        
        // Get view counts by hour
        const { data: hourCounts } = await newSupabase
            .from('video_views')
            .select('created_at')
            .in('video_id', videoIds);
        
        if (!hourCounts || hourCounts.length === 0) return "No views yet";
        
        // Determine time of day based on peak hour
        const hourCountsObj: Record<number, number> = {};
        hourCounts.forEach((v: any) => {
            const h = new Date(v.created_at).getHours();
            hourCountsObj[h] = (hourCountsObj[h] || 0) + 1;
        });
        
        const peakHour = Number(Object.entries(hourCountsObj).sort((a, b) => b[1] - a[1])[0]?.[0] || 0);
        
        if (peakHour >= 5 && peakHour < 12) return "Morning";
        if (peakHour >= 12 && peakHour < 17) return "Afternoon";
        if (peakHour >= 17 && peakHour < 21) return "Evening";
        return "Night";
    } catch (error) {
        console.error("Error getting peak viewing time:", error);
        return "No data";
    }
}

// Get view time distribution for analytics
export async function getViewTimeDistribution(channelId: string): Promise<{
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
}> {
    try {
        const { supabase: oldSupabase } = await import("@/lib/supabase");
        const { data: videos } = await oldSupabase
            .from('videos')
            .select('id')
            .eq('channel_id', channelId);
        
        if (!videos || videos.length === 0) {
            return { morning: 0, afternoon: 0, evening: 0, night: 0 };
        }
        
        const videoIds = videos.map(v => v.id);
        
        const { data: views } = await newSupabase
            .from('video_views')
            .select('created_at')
            .in('video_id', videoIds);
        
        let morning = 0, afternoon = 0, evening = 0, night = 0;
        
        (views || []).forEach((v: any) => {
            const h = new Date(v.created_at).getHours();
            if (h >= 5 && h < 12) morning++;
            else if (h >= 12 && h < 17) afternoon++;
            else if (h >= 17 && h < 21) evening++;
            else night++;
        });
        
        return { morning, afternoon, evening, night };
    } catch (error) {
        console.error("Error getting view time distribution:", error);
        return { morning: 0, afternoon: 0, evening: 0, night: 0 };
    }
}
