'use server';

import { createClient } from '@supabase/supabase-js';

const newSupabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const newSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';
const newSupabase = createClient(newSupabaseUrl, newSupabaseAnonKey);

export async function syncUserToDb(userData: {
    id: string;
    email: string;
    username?: string;
    account_type?: string;
}) {
    try {
        const { id, email, username, account_type = 'adult' } = userData;

        // Check if user exists
        const { data: existingUser } = await newSupabase
            .from('users')
            .select('id')
            .eq('id', id)
            .maybeSingle();

        if (!existingUser) {
            // Create new user
            await newSupabase.from('users').insert({
                id,
                email,
                username: username || null,
                account_type,
                join_order: Math.floor(Math.random() * 10000)
            });

            // Create default profile
            const profileId = `ch_${id}`;
            const profileName = username || email.split('@')[0];

            await newSupabase.from('profiles').insert({
                id: profileId,
                user_id: id,
                name: profileName,
                account_type: 'general',
                verified: false
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error syncing user:", error);
        return { success: false, error: "Database synchronization failed" };
    }
}

export async function updateUserProfile(userId: string, data: {
    username: string;
    bio?: string;
}) {
    try {
        const { username, bio } = data;

        // Update user
        await newSupabase.from('users')
            .update({ username })
            .eq('id', userId);

        // Update profile name
        await newSupabase.from('profiles')
            .update({ name: username, description: bio || null })
            .eq('user_id', userId);

        return { success: true };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Profile synchronization failed" };
    }
}
