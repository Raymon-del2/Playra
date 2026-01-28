'use server';

import { turso } from "@/lib/turso";
import { initDatabase } from "@/lib/db-setup";
import { revalidatePath } from "next/cache";

export async function getUserProfiles(userId: string) {
    try {
        const result = await turso.execute({
            sql: "SELECT * FROM channels WHERE user_id = ?",
            args: [userId]
        });
        return result.rows.map(row => ({
            id: row.id as string,
            user_id: row.user_id as string,
            name: row.name as string,
            description: row.description as string | null,
            avatar: row.avatar as string | null,
            verified: Boolean(row.verified),
            account_type: row.account_type as string || 'general',
            created_at: String(row.created_at)
        }));
    } catch (error) {
        console.error("Error fetching profiles:", error);
        return [];
    }
}

export async function createProfile(userId: string, name: string, avatarBase64: string, accountType: 'adult' | 'kids' | 'family') {
    try {
        // Check profile count limit (4) via fast count query
        const countResult = await turso.execute({
            sql: "SELECT COUNT(*) as count FROM channels WHERE user_id = ?",
            args: [userId]
        });

        const count = countResult.rows[0]?.count as number || 0;

        if (count >= 4) {
            return { success: false, error: "Maximum of 4 profiles allowed." };
        }

        const channelId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await turso.execute({
            sql: `
                INSERT INTO channels (id, user_id, name, avatar, account_type)
                VALUES (?, ?, ?, ?, ?)
            `,
            args: [channelId, userId, name, avatarBase64, accountType]
        });

        revalidatePath('/select-profile');
        return { success: true };
    } catch (error) {
        console.error("Error creating profile:", error);
        return { success: false, error: "Failed to create profile" };
    }
}

export async function updateProfileAvatar(profileId: string, avatarBase64: string) {
    try {
        await turso.execute({
            sql: `
                UPDATE channels 
                SET avatar = ?
                WHERE id = ?
            `,
            args: [avatarBase64, profileId]
        });

        // Propagate avatar change to Supabase videos so all viewers see the updated profile photo
        try {
            await updateChannelAvatarInVideos(profileId, avatarBase64);
        } catch (supabaseError) {
            console.warn("Failed to sync avatar to videos table in Supabase; falling back to existing channel_avatar", supabaseError);
        }

        revalidatePath('/select-profile');
        return { success: true };
    } catch (error) {
        console.error("Error updating profile avatar:", error);
        return { success: false, error: "Failed to update avatar" };
    }
}

import { cookies } from 'next/headers';

export async function selectActiveProfile(profileId: string, userId: string) {
    try {
        // Security check: Ensure profile belongs to user
        const result = await turso.execute({
            sql: "SELECT id FROM channels WHERE id = ? AND user_id = ?",
            args: [profileId, userId]
        });

        if (result.rows.length === 0) {
            return { success: false, error: "Unauthorized profile selection" };
        }

        // Set secure cookie
        const cookieStore = await cookies();
        cookieStore.set('playra_active_profile', profileId, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });


        revalidatePath('/', 'layout');

        return { success: true };
    } catch (error) {
        console.error("Error selecting profile:", error);
        return { success: false, error: "Failed to select profile" };
    }
}

export async function getActiveProfile() {
    const cookieStore = await cookies();
    const profileId = cookieStore.get('playra_active_profile')?.value;

    if (!profileId) return null;

    try {
        const result = await turso.execute({
            sql: "SELECT * FROM channels WHERE id = ?",
            args: [profileId]
        });

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        const profile = {
            id: row.id as string,
            user_id: row.user_id as string,
            name: row.name as string,
            description: row.description as string | null,
            avatar: row.avatar as string | null,
            verified: Boolean(row.verified),
            account_type: row.account_type as string || 'general',
            created_at: String(row.created_at)
        };

        // Best-effort: push latest avatar to Supabase videos so cards show the updated profile photo
        try {
            if (profile.avatar) {
                await updateChannelAvatarInVideos(profile.id, profile.avatar);
            }
        } catch (err) {
            console.warn('Avatar sync to videos skipped', err);
        }

        return profile;
    } catch (error) {
        console.error("Error fetching active profile:", error);
        return null;
    }
}

import { deleteChannelVideos, supabase, updateChannelAvatarInVideos } from "@/lib/supabase";

export async function getProfileVideoCount(profileId: string) {
    try {
        if (!supabase) return 0;
        const { count, error } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', profileId);

        if (error) throw error;
        return count || 0;
    } catch (e) {
        console.error("Error getting video count:", e);
        return 0;
    }
}

export async function deleteProfile(profileId: string, userId: string) {
    try {
        // 1. Delete videos from Supabase first
        await deleteChannelVideos(profileId);

        // 2. Delete channel from Turso
        await turso.execute({
            sql: "DELETE FROM channels WHERE id = ? AND user_id = ?",
            args: [profileId, userId]
        });

        revalidatePath('/select-profile');
        return { success: true };
    } catch (error) {
        console.error("Error deleting profile:", error);
        return { success: false, error: "Failed to delete profile" };
    }
}

export async function checkProfileName(name: string) {
    if (!name.startsWith('@')) return { available: false, error: "Must start with @" };
    if (name.length < 3) return { available: false, error: "Too short" };

    try {
        const result = await turso.execute({
            sql: "SELECT id FROM channels WHERE LOWER(name) = LOWER(?)",
            args: [name]
        });

        if (result.rows.length === 0) {
            return { available: true };
        }

        // Generate suggestions
        const base = name.replace(/[@]/g, '');
        const suggestions = [
            `@${base}${Math.floor(Math.random() * 99)}`,
            `@${base}Official`,
            `@TheReal${base}`,
            `@iAm${base}`
        ];

        return { available: false, error: "Name taken", suggestions };
    } catch (e) {
        console.error("Check name error", e);
        return { available: false, error: "Error checking name" };
    }
}

