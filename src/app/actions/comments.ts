'use server';

import { turso } from "@/lib/turso";
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
    replies?: Comment[];
    user_liked?: boolean;
    user_disliked?: boolean;
};

export async function getVideoComments(videoId: string, profileId?: string) {
    try {
        // Fetch all comments for the video
        const result = await turso.execute({
            sql: "SELECT * FROM comments WHERE video_id = ? ORDER BY created_at DESC",
            args: [videoId]
        });

        const comments: Comment[] = result.rows.map(row => ({
            id: row.id as string,
            video_id: row.video_id as string,
            profile_id: row.profile_id as string,
            parent_id: row.parent_id as string | null,
            content: row.content as string,
            likes: Number(row.likes),
            dislikes: Number(row.dislikes),
            created_at: row.created_at as string,
        }));

        if (comments.length === 0) return [];

        // Fetch profiles for comments
        const profileIds = Array.from(new Set(comments.map(c => c.profile_id)));
        if (profileIds.length > 0) {
            const placeholders = profileIds.map(() => '?').join(',');
            const profileRes = await turso.execute({
                sql: `SELECT id, name, avatar FROM channels WHERE id IN (${placeholders})`,
                args: profileIds
            });

            const profileMap = new Map();
            profileRes.rows.forEach(r => {
                profileMap.set(r.id, r);
            });

            comments.forEach(c => {
                const p = profileMap.get(c.profile_id);
                if (p) {
                    c.profile_name = p.name;
                    c.profile_avatar = p.avatar;
                }
            });
        }

        // Fetch engagement if logged in
        let engagementMap = new Map(); // commentId -> 'like' | 'dislike'
        if (profileId) {
            const commentIds = comments.map(c => c.id);
            if (commentIds.length > 0) {
                const placeholders = commentIds.map(() => '?').join(',');
                const engRes = await turso.execute({
                    sql: `SELECT comment_id, type FROM comment_engagement WHERE profile_id = ? AND comment_id IN (${placeholders})`,
                    args: [profileId, ...commentIds]
                });
                engRes.rows.forEach(r => {
                    engagementMap.set(r.comment_id, r.type);
                });
            }
        }

        // Apply engagement to comments
        comments.forEach(c => {
            const type = engagementMap.get(c.id);
            c.user_liked = type === 'like';
            c.user_disliked = type === 'dislike';
        });

        // Build hierarchy
        const rootComments: Comment[] = [];
        const commentMap = new Map<string, Comment>();

        comments.forEach(c => {
            c.replies = [];
            commentMap.set(c.id, c);
        });

        comments.forEach(c => {
            if (c.parent_id) {
                const parent = commentMap.get(c.parent_id);
                if (parent) {
                    parent.replies?.push(c);
                    // Sort replies old to new
                    parent.replies?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
        const id = `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        await turso.execute({
            sql: `INSERT INTO comments (id, video_id, profile_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [id, videoId, profileId, content, parentId || null, now]
        });

        revalidatePath(`/watch/${videoId}`);
        return { success: true, id };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { success: false, error: "Failed to add comment" };
    }
}

export async function deleteComment(commentId: string, profileId: string) {
    try {
        await turso.execute({
            sql: "DELETE FROM comments WHERE id = ? AND profile_id = ?",
            args: [commentId, profileId]
        });

        // Also delete replies if any? Cascading usually handles this in SQL but Turso SQLite needs implicit support or manual.
        // For now, let's assume we just delete the row. Orphans might exist if no ON DELETE CASCADE.

        return { success: true };
    } catch (error) {
        console.error("Error deleting comment:", error);
        return { success: false };
    }
}

export async function engageComment(commentId: string, profileId: string, type: 'like' | 'dislike' | null) {
    try {
        // Check existing
        const existingRes = await turso.execute({
            sql: "SELECT id, type FROM comment_engagement WHERE comment_id = ? AND profile_id = ?",
            args: [commentId, profileId]
        });
        const existing = existingRes.rows[0];

        // Begin transaction logic (simulated)
        if (existing) {
            // Remove old effect
            const oldType = existing.type;
            if (oldType === 'like') {
                await turso.execute({ sql: "UPDATE comments SET likes = likes - 1 WHERE id = ?", args: [commentId] });
            } else if (oldType === 'dislike') {
                await turso.execute({ sql: "UPDATE comments SET dislikes = dislikes - 1 WHERE id = ?", args: [commentId] });
            }

            await turso.execute({ sql: "DELETE FROM comment_engagement WHERE id = ?", args: [existing.id] });
        }

        if (type) {
            // Add new effect
            const engId = `eng_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await turso.execute({
                sql: "INSERT INTO comment_engagement (id, comment_id, profile_id, type) VALUES (?, ?, ?, ?)",
                args: [engId, commentId, profileId, type]
            });

            if (type === 'like') {
                await turso.execute({ sql: "UPDATE comments SET likes = likes + 1 WHERE id = ?", args: [commentId] });
            } else if (type === 'dislike') {
                await turso.execute({ sql: "UPDATE comments SET dislikes = dislikes + 1 WHERE id = ?", args: [commentId] });
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error engaging comment:", error);
        return { success: false };
    }
}

export async function getCommentCount(videoId: string) {
    try {
        const result = await turso.execute({
            sql: "SELECT COUNT(*) as count FROM comments WHERE video_id = ?",
            args: [videoId]
        });
        return Number(result.rows[0].count);
    } catch (error) {
        return 0;
    }
}
