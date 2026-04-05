'use server';

import { engagementSupabase as supabase } from "@/lib/supabase";

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
        // Get all comments from the user using Supabase
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('id, content, created_at, likes, dislikes, video_id')
            .eq('profile_id', profileId)
            .is('parent_id', null)
            .order('created_at', { ascending: false });

        if (commentsError) {
            console.error("Error fetching comments:", commentsError);
        }

        if (!comments || comments.length === 0) return [];

        // Get video details from Supabase
        const videoIds = comments.map((c: any) => c.video_id);
        const { data: videos, error } = await supabase
            .from('videos')
            .select('id, title, thumbnail_url, channel_id, is_short, channels(name)')
            .in('id', videoIds);

        if (error) {
            console.error("Error fetching video details:", error);
        }

        // Create a map of video details
        const videoMap = new Map();
        videos?.forEach((v: any) => {
            videoMap.set(v.id, {
                title: v.title,
                thumbnail: v.thumbnail_url,
                channel_name: v.channels?.[0]?.name || 'Unknown',
                is_short: v.is_short || false
            });
        });

        // Combine comment data with video details
        return comments.map((c: any) => {
            const video = videoMap.get(c.video_id) || {};
            return {
                comment_id: c.id,
                content: c.content,
                created_at: c.created_at,
                likes: c.likes || 0,
                dislikes: c.dislikes || 0,
                video_id: c.video_id,
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
        const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profileId);
        
        return count || 0;
    } catch (error) {
        console.error("Error getting user comment count:", error);
        return 0;
    }
}
