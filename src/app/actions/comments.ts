'use server';

import { engagementSupabase as supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type Comment = {
    id: string;
    video_id: string;
    profile_id: string;
    parent_id: string | null;
    content: string;
    likes: number;
    dislikes: number;
    created_at: string;
    profile_name?: string;
    profile_avatar?: string;
    profile_join_order?: number | null;
    replies?: Comment[];
    user_liked?: boolean;
    user_disliked?: boolean;
};

export async function getVideoComments(videoId: string, profileId?: string) {
    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select('*')
            .eq('video_id', videoId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!comments || comments.length === 0) return [];

        const commentObjs: Comment[] = comments.map(row => ({
            id: row.id,
            video_id: row.video_id,
            profile_id: row.profile_id,
            parent_id: row.parent_id,
            content: row.content,
            likes: row.likes || 0,
            dislikes: row.dislikes || 0,
            created_at: row.created_at,
            profile_name: 'Unknown User',
            profile_avatar: undefined,
            profile_join_order: null,
            replies: [],
            user_liked: false,
            user_disliked: false,
        }));

        // Fetch profiles
        const profileIds = Array.from(new Set(commentObjs.map(c => c.profile_id)));
        if (profileIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, avatar')
                .in('id', profileIds);

            const profileMap = new Map((profiles || []).map(p => [p.id, p]));
            commentObjs.forEach(c => {
                const p = profileMap.get(c.profile_id);
                if (p) {
                    c.profile_name = p.name;
                    c.profile_avatar = p.avatar;
                }
            });
        }

        // Build hierarchy
        const rootComments: Comment[] = [];
        const commentMap = new Map<string, Comment>();

        commentObjs.forEach(c => {
            c.replies = [];
            commentMap.set(c.id, c);
        });

        commentObjs.forEach(c => {
            if (c.parent_id) {
                const parent = commentMap.get(c.parent_id);
                if (parent) {
                    parent.replies?.push(c);
                }
            } else {
                rootComments.push(c);
            }
        });

        return rootComments;
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
}

export async function addComment(videoId: string, profileId: string, content: string, parentId?: string) {
    try {
        // Generate proper UUID for Supabase
        const id = crypto.randomUUID();
        
        const { error } = await supabase.from('comments').insert({
            id,
            video_id: videoId,
            profile_id: profileId,
            content,
            parent_id: parentId || null,
            likes: 0,
            dislikes: 0
        });

        if (error) throw error;

        revalidatePath(`/watch/${videoId}`);
        return { success: true, id };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { success: false, error: "Failed to add comment" };
    }
}

export async function deleteComment(commentId: string, profileId: string) {
    try {
        await supabase.from('comments').delete()
            .eq('id', commentId)
            .eq('profile_id', profileId);

        return { success: true };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return { success: false };
    }
}

export async function engageComment(commentId: string, profileId: string, type: 'like' | 'dislike' | null) {
    try {
        const client = supabase;

        // Check existing engagement
        const { data: existing } = await client
            .from('comment_engagement')
            .select('*')
            .eq('comment_id', commentId)
            .eq('profile_id', profileId)
            .maybeSingle();

        const wasLike = existing?.type === 'like';
        const wasDislike = existing?.type === 'dislike';

        if (existing) {
            // Remove old engagement
            await client.from('comment_engagement').delete()
                .eq('id', existing.id);
        }

        if (type) {
            // Add new engagement with UUID
            const engId = crypto.randomUUID();
            await client.from('comment_engagement').insert({
                id: engId,
                comment_id: commentId,
                profile_id: profileId,
                type
            });

            // Update comment likes/dislikes count
            const { data: comment } = await client
                .from('comments')
                .select('likes, dislikes')
                .eq('id', commentId)
                .single();
            
            const currentLikes = comment?.likes || 0;
            const currentDislikes = comment?.dislikes || 0;
            
            let newLikes = currentLikes;
            let newDislikes = currentDislikes;
            
            if (type === 'like') {
                newLikes = currentLikes + 1;
                if (wasDislike) newDislikes = Math.max(0, currentDislikes - 1);
            } else if (type === 'dislike') {
                newDislikes = currentDislikes + 1;
                if (wasLike) newLikes = Math.max(0, currentLikes - 1);
            }
            
            await client.from('comments').update({
                likes: newLikes,
                dislikes: newDislikes
            }).eq('id', commentId);
        } else if (existing) {
            // User removed their engagement - update counts
            const { data: comment } = await client
                .from('comments')
                .select('likes, dislikes')
                .eq('id', commentId)
                .single();
            
            const currentLikes = comment?.likes || 0;
            const currentDislikes = comment?.dislikes || 0;
            
            await client.from('comments').update({
                likes: wasLike ? Math.max(0, currentLikes - 1) : currentLikes,
                dislikes: wasDislike ? Math.max(0, currentDislikes - 1) : currentDislikes
            }).eq('id', commentId);
        }

        return { success: true };
    } catch (error) {
        console.error("Error engaging comment:", error);
        return { success: false };
    }
}

export async function getBatchCommentCounts(videoIds: string[]) {
    if (!videoIds.length) return {};
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('video_id')
            .in('video_id', videoIds);

        if (error) throw error;

        const counts: Record<string, number> = {};
        videoIds.forEach(id => counts[id] = 0);
        (data || []).forEach((c: any) => {
            counts[c.video_id] = (counts[c.video_id] || 0) + 1;
        });
        return counts;
    } catch (error) {
        console.error("Error fetching batch comment counts:", error);
        return {};
    }
}

export async function getCommentCount(videoId: string) {
    try {
        const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', videoId);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        return 0;
    }
}
