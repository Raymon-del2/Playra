'use server';

import { supabase } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";

// Engagement Supabase for profiles
const newSupabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const newSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';
const newSupabase = createClient(newSupabaseUrl, newSupabaseAnonKey);

export async function getBatchProfiles(profileIds: string[]) {
    if (!profileIds.length) return [];
    try {
        const { data } = await newSupabase
            .from('profiles')
            .select('id, name, avatar')
            .in('id', profileIds);
        return data || [];
    } catch (error) {
        console.error("Error fetching batch profiles:", error);
        return [];
    }
}

export async function getUserProfiles(userId: string) {
    try {
        const { data, error } = await newSupabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching profiles:", error);
        return [];
    }
}

export async function createProfile(userId: string, name: string, avatarBase64: string, accountType: 'adult' | 'kids' | 'family') {
    try {
        // Check profile count limit (4)
        const { count } = await newSupabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if ((count || 0) >= 4) {
            return { success: false, error: "Maximum of 4 profiles allowed." };
        }

        const profileId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { error } = await newSupabase
            .from('profiles')
            .insert({
                id: profileId,
                user_id: userId,
                name,
                avatar: avatarBase64,
                account_type: accountType,
                verified: false,
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        revalidatePath('/select-profile');
        return { success: true };
    } catch (error) {
        console.error("Error creating profile:", error);
        return { success: false, error: "Failed to create profile" };
    }
}

export async function updateProfileAvatar(profileId: string, avatarBase64: string) {
    try {
        const { error } = await newSupabase
            .from('profiles')
            .update({ avatar: avatarBase64 })
            .eq('id', profileId);

        if (error) throw error;

        // Propagate avatar change to Supabase videos
        try {
            await updateChannelAvatarInVideos(profileId, avatarBase64);
        } catch (supabaseError) {
            console.warn("Failed to sync avatar to videos:", supabaseError);
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
        const { data } = await newSupabase
            .from('profiles')
            .select('id')
            .eq('id', profileId)
            .eq('user_id', userId)
            .maybeSingle();

        if (!data) {
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

export async function selectActiveProfileByName(handle: string) {
    try {
        const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
        
        const { data } = await newSupabase
            .from('profiles')
            .select('id')
            .ilike('name', cleanHandle)
            .maybeSingle();

        if (!data) {
            return { success: false, error: "Profile not found" };
        }

        const profileId = data.id;
        
        // Set secure cookie
        const cookieStore = await cookies();
        cookieStore.set('playra_active_profile', profileId, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });

        revalidatePath('/', 'layout');
        return { success: true, profileId };
    } catch (error) {
        console.error("Error selecting profile by name:", error);
        return { success: false, error: "Failed to select profile" };
    }
}

export async function getActiveProfile() {
    const cookieStore = await cookies();
    const profileId = cookieStore.get('playra_active_profile')?.value;

    if (!profileId) return null;

    try {
        const { data, error } = await newSupabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            user_id: data.user_id,
            name: data.name,
            description: data.description,
            avatar: data.avatar,
            verified: data.verified,
            account_type: data.account_type || 'general',
            created_at: data.created_at
        };
    } catch (error) {
        console.error("Error fetching active profile:", error);
        return null;
    }
}

import { deleteChannelVideos, updateChannelAvatarInVideos } from "@/lib/supabase";

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

export async function updateProfileName(profileId: string, newName: string) {
    try {
        const { error } = await newSupabase
            .from('profiles')
            .update({ name: newName })
            .eq('id', profileId);

        if (error) throw error;

        revalidatePath('/select-profile');
        return { success: true };
    } catch (error) {
        console.error("Error updating profile name:", error);
        return { success: false, error: "Failed to update name" };
    }
}

export async function deleteProfile(profileId: string, userId: string) {
    try {
        // 1. Delete videos from Supabase first
        await deleteChannelVideos(profileId);

        // 2. Delete from newSupabase
        const { error } = await newSupabase
            .from('profiles')
            .delete()
            .eq('id', profileId)
            .eq('user_id', userId);

        if (error) throw error;

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
        const { data } = await newSupabase
            .from('profiles')
            .select('id')
            .ilike('name', name)
            .maybeSingle();

        if (!data) {
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

