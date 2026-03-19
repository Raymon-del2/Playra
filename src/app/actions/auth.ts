'use server';

import { turso } from "@/lib/turso";
import { initDatabase } from "@/lib/db-setup";

export async function syncUserToDb(userData: {
    id: string;
    email: string;
    username?: string;
    account_type?: string;
}) {
    try {
        // Ensure tables exist (one-time check essentially)
        await initDatabase();

        const { id, email, username, account_type = 'adult' } = userData;

        // Get and increment join_order atomically
        const counterResult = await turso.execute({
            sql: `UPDATE join_order_counter SET last_order = last_order + 1 WHERE id = 1 RETURNING last_order`,
            args: []
        });
        
        const joinOrder = counterResult.rows[0]?.last_order as number || 0;

        // Use an UPSERT pattern to create or update user
        await turso.execute({
            sql: `
                INSERT INTO users (id, email, username, account_type, join_order)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    email = excluded.email,
                    username = COALESCE(excluded.username, users.username),
                    account_type = COALESCE(excluded.account_type, users.account_type)
            `,
            args: [id, email, username || null, account_type, joinOrder]
        });

        // Only create a default channel if the user doesn't have any profiles
        const existingChannels = await turso.execute({
            sql: "SELECT COUNT(*) as count FROM channels WHERE user_id = ?",
            args: [id]
        });
        
        const hasProfiles = (existingChannels.rows[0]?.count as number || 0) > 0;
        
        if (!hasProfiles) {
            // User has no profiles, create a default one
            const channelId = `ch_${id}`;
            const channelName = username || email.split('@')[0];

            await turso.execute({
                sql: `
                    INSERT INTO channels (id, user_id, name, account_type)
                    VALUES (?, ?, ?, 'general')
                `,
                args: [channelId, id, channelName]
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error syncing user to Turso:", error);
        return { success: false, error: "Database synchronization failed" };
    }
}

export async function updateUserProfile(userId: string, data: {
    username: string;
    bio?: string;
}) {
    try {
        const { username, bio } = data;

        // Update user in Turso
        await turso.execute({
            sql: `
                UPDATE users 
                SET username = ?
                WHERE id = ?
            `,
            args: [username, userId]
        });

        // Update channel name in Turso
        await turso.execute({
            sql: `
                UPDATE channels
                SET name = ?, description = ?
                WHERE user_id = ?
            `,
            args: [username, bio || null, userId]
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating profile in Turso:", error);
        return { success: false, error: "Profile synchronization failed" };
    }
}
