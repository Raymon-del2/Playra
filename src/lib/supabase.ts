import { createClient } from '@supabase/supabase-js';

// Prioritize the new credentials specifically provided in the latest update
const supabaseUrl = 'https://dyhbrdijbxjrhfthknkw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-9XrzAJu2QP5A8';

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function ensureSupabase() {
    if (!supabase) {
        throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.');
    }
    return supabase;
}

export async function getWatchHistoryRaw(profileId: string, limit = 1000) {
    const { data, error } = await ensureSupabase()
        .from('watch_history')
        .select('id, watched_at, video_id')
        .eq('profile_id', profileId)
        .order('watched_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    const rows = (data || []) as { id: string; watched_at: string; video_id: string }[];
    if (rows.length === 0) return [];

    const videoIds = Array.from(new Set(rows.map((r) => r.video_id)));
    const { data: videos, error: videoError } = await ensureSupabase()
        .from('videos')
        .select('id, title, thumbnail_url, channel_name, duration, views, is_short, category')
        .in('id', videoIds);
    if (videoError) throw videoError;

    const videoMap = new Map<string, any>();
    (videos || []).forEach((v: any) => videoMap.set(v.id, v));

    return rows.map((row) => {
        const v = videoMap.get(row.video_id);
        return {
            id: row.id,
            watched_at: row.watched_at,
            video: v
                ? {
                    id: v.id,
                    title: v.title,
                    thumbnail_url: v.thumbnail_url,
                    channel_name: v.channel_name,
                    duration: v.duration,
                    views: v.views,
                    is_short: v.is_short,
                    category: v.category,
                }
                : null,
        } as WatchHistoryRow;
    });
}

export async function deleteWatchHistoryEntry(id: string, profileId: string) {
    const { error } = await ensureSupabase()
        .from('watch_history')
        .delete()
        .eq('id', id)
        .eq('profile_id', profileId);
    if (error) throw error;
    return supabase;
}

// Types for videos table
export interface Video {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url: string;
    channel_id: string;
    channel_name: string;
    channel_avatar: string;
    views: number;
    duration: string;
    created_at: string;
    updated_at: string;
    is_live: boolean;
    is_short: boolean;
    is_post?: boolean;
    category?: 'adults' | 'family' | 'kids' | 'advert' | 'general' | 'music';
}

// Video upload function
export async function uploadVideo(videoData: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'views'>) {
    const { data, error } = await ensureSupabase()
        .from('videos')
        .insert([{
            ...videoData,
            is_post: videoData.is_post || false,
            category: videoData.category || 'general',
            views: 0,
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Helper: delete a storage object using its public URL
async function deleteStorageObjectFromPublicUrl(publicUrl?: string | null) {
    if (!publicUrl) return;
    try {
        const url = new URL(publicUrl);
        // Expect path like /storage/v1/object/public/{bucket}/{path...}
        const parts = url.pathname.split('/').filter(Boolean); // remove empties
        const objectIndex = parts.indexOf('object');
        if (objectIndex === -1 || parts.length < objectIndex + 3) return; // not a storage public URL
        const bucket = parts[objectIndex + 2]; // after "object" and "public"
        const pathParts = parts.slice(objectIndex + 3);
        const path = pathParts.join('/');
        if (!bucket || !path) return;
        const { error } = await ensureSupabase().storage.from(bucket).remove([path]);
        if (error) {
            console.warn('Failed to delete storage object', bucket, path, error.message);
        }
    } catch (err) {
        console.warn('Could not parse storage URL for deletion', publicUrl);
    }
}

// Delete a video row by id
export async function deleteVideo(id: string) {
    const { error } = await ensureSupabase()
        .from('videos')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

// Delete a video and attempt to remove its storage assets
export async function deleteVideoWithAssets(params: { id: string; videoUrl?: string | null; thumbnailUrl?: string | null }) {
    const { id, videoUrl, thumbnailUrl } = params;
    await deleteStorageObjectFromPublicUrl(videoUrl);
    await deleteStorageObjectFromPublicUrl(thumbnailUrl);
    return deleteVideo(id);
}

// Get all videos
export async function getVideos(limit = 20, offset = 0, category?: string) {
    let query = ensureSupabase()
        .from('videos')
        .select('*')
        .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")') // Blacklist legacy orphaned videos
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category && category !== 'general' && category !== 'All') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Video[];
}

// --- Watch history helpers ---

type WatchHistoryRow = {
    id: string;
    watched_at: string;
    video: {
        id: string;
        title: string;
        thumbnail_url: string;
        channel_name: string;
        duration: string | null;
        views: number | null;
        is_short: boolean;
        category?: string | null;
    } | null;
};

export async function recordWatch(profileId: string, videoId: string) {
    const { error } = await ensureSupabase()
        .from('watch_history')
        .insert([{ profile_id: profileId, video_id: videoId }]);
    if (error) throw error;
    return true;
}

export async function clearWatchHistory(profileId: string) {
    const { error } = await ensureSupabase()
        .from('watch_history')
        .delete()
        .eq('profile_id', profileId);
    if (error) throw error;
    return true;
}

export async function setHistoryPause(profileId: string, paused: boolean) {
    const { error } = await ensureSupabase()
        .from('watch_history_pause')
        .upsert({ profile_id: profileId, paused, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
}

export async function isHistoryPaused(profileId: string) {
    const { data, error } = await ensureSupabase()
        .from('watch_history_pause')
        .select('paused')
        .eq('profile_id', profileId)
        .maybeSingle();
    if (error) throw error;
    return Boolean(data?.paused);
}

export async function getWatchHistory(profileId: string, limit = 200) {
    const { data, error } = await ensureSupabase()
        .from('watch_history')
        .select('id, watched_at, video_id')
        .eq('profile_id', profileId)
        .order('watched_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    const rows = (data || []) as { id: string; watched_at: string; video_id: string }[];
    if (rows.length === 0) return [];

    // Deduplicate by video_id, keeping the most recent (already ordered desc)
    const seen = new Set<string>();
    const deduped = rows.filter((r) => {
        if (seen.has(r.video_id)) return false;
        seen.add(r.video_id);
        return true;
    });

    const videoIds = deduped.map((r) => r.video_id);
    const { data: videos, error: videoError } = await ensureSupabase()
        .from('videos')
        .select('id, title, thumbnail_url, channel_name, duration, views, is_short, category')
        .in('id', videoIds);
    if (videoError) throw videoError;

    const videoMap = new Map<string, any>();
    (videos || []).forEach((v: any) => videoMap.set(v.id, v));

    return deduped.map((row) => {
        const v = videoMap.get(row.video_id);
        return {
            id: row.id,
            watched_at: row.watched_at,
            video: v
                ? {
                    id: v.id,
                    title: v.title,
                    thumbnail_url: v.thumbnail_url,
                    channel_name: v.channel_name,
                    duration: v.duration,
                    views: v.views,
                    is_short: v.is_short,
                }
                : null,
        } as WatchHistoryRow;
    });
}

// Search videos by title, description, or channel name
export async function searchVideos(query: string | null, limit = 50) {
    let builder = ensureSupabase()
        .from('videos')
        .select('*')
        .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")') // Blacklist legacy orphaned videos
        .order('created_at', { ascending: false })
        .limit(limit);

    if (query && query.trim()) {
        const pattern = `%${query.trim()}%`;
        builder = builder.or(`title.ilike.${pattern},description.ilike.${pattern},channel_name.ilike.${pattern}`);
    }

    const { data, error } = await builder;
    if (error) throw error;
    return data as Video[];
}

// Get only styles (shorts)
export async function getStyles(limit = 20, offset = 0, category?: string) {
    let query = ensureSupabase()
        .from('videos')
        .select('*')
        .eq('is_short', true)
        .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")') // Blacklist legacy orphaned videos
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category && category !== 'general' && category !== 'All') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Video[];
}

// Get video by ID
export async function getVideoById(id: string) {
    const { data, error } = await ensureSupabase()
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Video;
}

// Increment views
export async function incrementViews(id: string) {
    const client = ensureSupabase();
    const { data: fetchData, error: fetchError } = await client
        .from('videos')
        .select('views')
        .eq('id', id)
        .single();
    if (fetchError) throw fetchError;
    const nextViews = ((fetchData?.views ?? 0) as number) + 1;
    const { data: updated, error: updateError } = await client
        .from('videos')
        .update({ views: nextViews })
        .eq('id', id)
        .select('views')
        .maybeSingle();
    if (updateError) throw updateError;
    return updated?.views ?? nextViews;
}

// Upload file to Supabase Storage
export async function uploadVideoFile(file: File, path: string) {
    const { data, error } = await ensureSupabase().storage
        .from('videos')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = ensureSupabase().storage
        .from('videos')
        .getPublicUrl(path);

    return urlData.publicUrl;
}

// Upload thumbnail to Supabase Storage
export async function uploadThumbnail(file: File, path: string) {
    const { data, error } = await ensureSupabase().storage
        .from('thumbnails')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = ensureSupabase().storage
        .from('thumbnails')
        .getPublicUrl(path);

    return urlData.publicUrl;
}

// Delete all videos for a channel
export async function deleteChannelVideos(channelId: string) {
    const { error } = await ensureSupabase()
        .from('videos')
        .delete()
        .eq('channel_id', channelId);

    if (error) throw error;
    return { success: true };
}
