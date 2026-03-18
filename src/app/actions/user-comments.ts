'use server';

import { turso } from "@/lib/turso";
import { supabase } from "@/lib/supabase";

export type UserCommentWithVideo = {
    comment_id: string;
    content: string;
    created_at: string;
    likes: number;
    dislikes: number;
    video_id: string;
    video_title: string;
    video_thumbnail: string | null;
    video_channel_name: string;
    is_short: boolean;
};

// Get all comments by a user with video details
export async function getUserComments(profileId: string): Promise<UserCommentWithVideo[]> {
    try {
        // Get all comments from the user
        const { rows: comments } = await turso.execute({
            sql: `SELECT 
                c.id as comment_id,
                c.content,
                c.created_at,
                c.likes,
                c.dislikes,
                c.video_id
            FROM comments c
            WHERE c.profile_id = ? AND c.parent_id IS NULL
            ORDER BY c.created_at DESC`,
            args: [profileId]
        });

        if (comments.length === 0) return [];

        // Get video details from Supabase
        const videoIds = comments.map(c => c.video_id as string);
        const { data: videos, error } = await supabase
            .from('videos')
            .select('id, title, thumbnail_url, channel_id, is_short, channels(name)')
            .in('id', videoIds);

        if (error) {
            console.error("Error fetching video details:", error);
        }

        // Create a map of video details
        const videoMap = new Map();
        videos?.forEach(v => {
            videoMap.set(v.id, {
                title: v.title,
                thumbnail: v.thumbnail_url,
                channel_name: v.channels?.name || 'Unknown',
                is_short: v.is_short || false
            });
        });

        // Combine comment data with video details
        return comments.map(c => {
            const video = videoMap.get(c.video_id) || {};
            return {
                comment_id: c.comment_id as string,
                content: c.content as string,
                created_at: c.created_at as string,
                likes: Number(c.likes),
                dislikes: Number(c.dislikes),
                video_id: c.video_id as string,
                video_title: video.title || 'Unknown Video',
                video_thumbnail: video.thumbnail || null,
                video_channel_name: video.channel_name || 'Unknown',
                is_short: video.is_short || false
            };
        });
    } catch (error) {
        console.error("Error fetching user comments:", error);
        return [];
    }
}

// Get comment count for a user
export async function getUserCommentCount(profileId: string): Promise<number> {
    try {
        const { rows } = await turso.execute({
            sql: "SELECT COUNT(*) as count FROM comments WHERE profile_id = ?",
            args: [profileId]
        });
        return Number(rows[0]?.count || 0);
    } catch (error) {
        console.error("Error getting user comment count:", error);
        return 0;
    }
}
