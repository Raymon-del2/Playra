'use server';

import { getStyles } from "@/lib/supabase";
import { fetchBatchVideoEngagement } from "./engagement";
import { fetchBatchWatchLaterStatus } from "./watch-later";
import { getBatchCommentCounts } from "./comments";

export async function getStylesFeed(profileId?: string, limit = 10, offset = 0) {
    try {
        const clips = await getStyles(limit, offset);
        if (!clips || clips.length === 0) return { success: true, videos: [], engagement: {}, watchLater: {}, commentCounts: {} };

        const videoIds = clips.map(c => c.id);
        
        const [engagement, watchLater, commentCounts] = await Promise.all([
            fetchBatchVideoEngagement(videoIds, profileId),
            profileId ? fetchBatchWatchLaterStatus(profileId, videoIds) : Promise.resolve({ success: true, data: {} }),
            getBatchCommentCounts(videoIds)
        ]);

        return {
            success: true,
            videos: clips,
            engagement: engagement.data || {},
            watchLater: watchLater.data || {},
            commentCounts: commentCounts || {}
        };
    } catch (error) {
        console.error("Error fetching Styles feed:", error);
        return { success: false, error: "Failed to load feed" };
    }
}
