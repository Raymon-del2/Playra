'use server';

import { turso } from "@/lib/turso";

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
        
        await turso.execute({
            sql: `INSERT INTO video_views (id, video_id, profile_id, viewed_at, hour_of_day) VALUES (?, ?, ?, ?, ?)`,
            args: [id, videoId, profileId || null, now.toISOString(), hour]
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
        // Get all video IDs for this channel
        const { rows: videos } = await turso.execute({
            sql: "SELECT id FROM videos WHERE channel_id = ?",
            args: [channelId]
        });
        
        if (videos.length === 0) return "No data";
        
        const videoIds = videos.map(v => v.id);
        const placeholders = videoIds.map(() => '?').join(',');
        
        // Get view counts by hour
        const { rows: hourCounts } = await turso.execute({
            sql: `SELECT hour_of_day, COUNT(*) as count 
                  FROM video_views 
                  WHERE video_id IN (${placeholders})
                  GROUP BY hour_of_day 
                  ORDER BY count DESC`,
            args: videoIds
        });
        
        if (hourCounts.length === 0) return "No views yet";
        
        // Determine time of day based on peak hour
        const peakHour = Number(hourCounts[0].hour_of_day);
        
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
        const { rows: videos } = await turso.execute({
            sql: "SELECT id FROM videos WHERE channel_id = ?",
            args: [channelId]
        });
        
        if (videos.length === 0) {
            return { morning: 0, afternoon: 0, evening: 0, night: 0 };
        }
        
        const videoIds = videos.map(v => v.id);
        const placeholders = videoIds.map(() => '?').join(',');
        
        const { rows } = await turso.execute({
            sql: `SELECT 
                SUM(CASE WHEN hour_of_day >= 5 AND hour_of_day < 12 THEN 1 ELSE 0 END) as morning,
                SUM(CASE WHEN hour_of_day >= 12 AND hour_of_day < 17 THEN 1 ELSE 0 END) as afternoon,
                SUM(CASE WHEN hour_of_day >= 17 AND hour_of_day < 21 THEN 1 ELSE 0 END) as evening,
                SUM(CASE WHEN hour_of_day >= 21 OR hour_of_day < 5 THEN 1 ELSE 0 END) as night
            FROM video_views 
            WHERE video_id IN (${placeholders})`,
            args: videoIds
        });
        
        return {
            morning: Number(rows[0]?.morning || 0),
            afternoon: Number(rows[0]?.afternoon || 0),
            evening: Number(rows[0]?.evening || 0),
            night: Number(rows[0]?.night || 0)
        };
    } catch (error) {
        console.error("Error getting view time distribution:", error);
        return { morning: 0, afternoon: 0, evening: 0, night: 0 };
    }
}
