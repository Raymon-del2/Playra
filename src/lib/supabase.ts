import { createClient } from '@supabase/supabase-js';

// Video Supabase (has videos table)
const videosSupabaseUrl = 'https://dyhbrdijbxjrhfthknkw.supabase.co';
const videosSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-9XrzAJu2QP5A8';

// Engagement Supabase (has profiles, comments, likes, etc.)
const engagementSupabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const engagementSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

// Main supabase for videos (default)
export const supabase = createClient(videosSupabaseUrl, videosSupabaseKey);

// Engagement supabase for profiles, comments, likes, etc.
export const engagementSupabase = createClient(engagementSupabaseUrl, engagementSupabaseKey);

function ensureSupabase() {
  if (!engagementSupabase) {
    throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.');
  }
  return engagementSupabase;
}

// Get the correct Supabase client based on table name
function getSupabaseForTable(table: string) {
  // Tables that exist in the videos Supabase
  const videoTables = ['videos', 'video_views', 'watch_history', 'watch_history_pause', 'video_likes', 'video_dislikes'];
  if (videoTables.includes(table)) {
    return supabase;
  }
  // All other tables (profiles, comments, likes, subscriptions, etc.) are in engagement Supabase
  return engagementSupabase;
}

export async function ensurePostsTables() {
  try {
    // 1. Ensure storage bucket exists
    const { error: createError } = await supabase.storage.createBucket('posts', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg'],
      fileSizeLimit: 52428800, // 50MB per file
    });
    
    if (createError && !createError.message?.includes('already exists')) {
      console.error('Error creating posts bucket:', createError);
    }
    
    // 2. Ensure videos table has post-related columns
    const columnsToAdd = [
      { name: 'is_post', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'post_type', type: 'TEXT' },
      { name: 'content_type', type: 'TEXT DEFAULT \'video\'' },
      { name: 'visibility', type: 'TEXT DEFAULT \'public\'' },
    ];
    
    for (const col of columnsToAdd) {
      try {
        await supabase.rpc('add_column_if_not_exists', {
          table_name: 'videos',
          column_name: col.name,
          column_type: col.type
        });
      } catch (e) {
        // RPC might not exist, try direct SQL via query
        try {
          await supabase.from('videos').select(col.name).limit(1);
          // If we get here, column exists
        } catch (colError: any) {
          if (colError.message?.includes(col.name)) {
            console.log(`Column ${col.name} needs to be added via Supabase dashboard`);
          }
        }
      }
    }
    
    console.log('Posts tables verified');
  } catch (error) {
    console.error('Error ensuring posts tables:', error);
  }
}

export async function getWatchHistoryRaw(profileId: string, limit = 1000) {
    const { data, error } = await getSupabaseForTable('watch_history')
        .from('watch_history')
        .select('id, watched_at, video_id')
        .eq('profile_id', profileId)
        .order('watched_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    const rows = (data || []) as { id: string; watched_at: string; video_id: string }[];
    if (rows.length === 0) return [];

    const videoIds = Array.from(new Set(rows.map((r) => r.video_id)));
    const { data: videos, error: videoError } = await getSupabaseForTable('videos')
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
    const { error } = await getSupabaseForTable('watch_history')
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
    content_type?: 'video' | 'style' | 'post' | 'live' | 'music' | 'podcast' | 'promotion' | 'collaboration' | 'playlist';
}

// Types for profiles (channels)
export interface Channel {
    id: string;
    name: string;
    avatar: string;
    subscribers: number;
}

// Video upload function
export async function uploadVideo(videoData: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'views'>) {
    const { data, error } = await getSupabaseForTable('videos')
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
        const { error } = await getSupabaseForTable('videos').storage.from(bucket).remove([path]);
        if (error) {
            console.warn('Failed to delete storage object', bucket, path, error.message);
        }
    } catch (err) {
        console.warn('Could not parse storage URL for deletion', publicUrl);
    }
}

// Delete a video row by id
export async function deleteVideo(id: string) {
    const { data, error } = await getSupabaseForTable('videos')
        .from('videos')
        .delete()
        .eq('id', id)
        .select();

    if (error) throw error;

    // If data is empty but no error, it usually means RLS blocked the delete or the row didn't exist
    if (!data || data.length === 0) {
        throw new Error('Video not found or deletion blocked by permission (RLS). Ensure DELETE policy is enabled in Supabase.');
    }

    return true;
}

// Delete a video and attempt to remove its storage assets and related data
export async function deleteVideoWithAssets(params: { id: string; videoUrl?: string | null; thumbnailUrl?: string | null }) {
    const { id, videoUrl, thumbnailUrl } = params;

    // 1. Storage assets
    await deleteStorageObjectFromPublicUrl(videoUrl);
    await deleteStorageObjectFromPublicUrl(thumbnailUrl);

    // 2. Database cleanup (optional: depends on RLS/Cascade)
    // Try to delete comments and history first to avoid foreign key violations
    try {
        await getSupabaseForTable('videos').from('comments').delete().eq('video_id', id);
        await getSupabaseForTable('videos').from('watch_history').delete().eq('video_id', id);
    } catch (e) {
        console.warn('Failed to delete related data', e);
    }

    return deleteVideo(id);
}

// Get all videos
export async function getVideos(limit = 20, offset = 0, category?: string) {
    // First get videos
    let query = supabase
        .from('videos')
        .select('*')
        .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")') // Blacklist legacy orphaned videos
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category && category !== 'general' && category !== 'All') {
        query = query.eq('category', category);
    }

    const { data: videos, error } = await query;

    if (error) throw error;
    if (!videos || videos.length === 0) {
        console.log('getVideos: No videos found');
        return videos as Video[];
    }

    console.log('getVideos: Fetched', videos.length, 'videos');
    console.log('getVideos: Sample video:', videos[0]);

    return videos as Video[];
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
    const { error } = await getSupabaseForTable('videos')
        .from('watch_history')
        .insert([{ profile_id: profileId, video_id: videoId }]);
    if (error) throw error;
    return true;
}

export async function clearWatchHistory(profileId: string) {
    const { error } = await getSupabaseForTable('videos')
        .from('watch_history')
        .delete()
        .eq('profile_id', profileId);
    if (error) throw error;
    return true;
}

export async function setHistoryPause(profileId: string, paused: boolean) {
    const { error } = await getSupabaseForTable('videos')
        .from('watch_history_pause')
        .upsert({ profile_id: profileId, paused, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
}

export async function isHistoryPaused(profileId: string) {
    const { data, error } = await getSupabaseForTable('videos')
        .from('watch_history_pause')
        .select('paused')
        .eq('profile_id', profileId)
        .maybeSingle();
    if (error) throw error;
    return Boolean(data?.paused);
}

export async function getWatchHistory(profileId: string, limit = 200) {
    const { data, error } = await getSupabaseForTable('videos')
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
    const { data: videos, error: videoError } = await getSupabaseForTable('videos')
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
    // First get videos
    let builder = getSupabaseForTable('videos')
        .from('videos')
        .select('*')
        .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")') // Blacklist legacy orphaned videos
        .order('created_at', { ascending: false })
        .limit(limit);

    if (query && query.trim()) {
        const pattern = `%${query.trim()}%`;
        builder = builder.or(`title.ilike.${pattern},description.ilike.${pattern},channel_name.ilike.${pattern}`);
    }

    const { data: videos, error } = await builder;
    if (error) throw error;
    if (!videos || videos.length === 0) return videos as Video[];

    return videos as Video[];
}

// Get only styles (shorts)
export async function getStyles(limit = 20, offset = 0, category?: string) {
    // First get videos
    let query = getSupabaseForTable('videos')
        .from('videos')
        .select('*')
        .eq('is_short', true)
        .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")') // Blacklist legacy orphaned videos
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category && category !== 'general' && category !== 'All') {
        query = query.eq('category', category);
    }

    const { data: videos, error } = await query;
    if (error) throw error;
    if (!videos || videos.length === 0) return videos as Video[];

    return videos as Video[];
}

// Get video by ID
export async function getVideoById(id: string) {
    // First get video
    const { data: video, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    if (!video) return video as Video;

    // Get profile avatar for this channel; swallow errors to avoid breaking the watch page
    try {
        const { data: profile } = await engagementSupabase
            .from('profiles')
            .select('avatar')
            .eq('id', video.channel_id)
            .maybeSingle();

        if (profile?.avatar) {
            video.channel_avatar = profile.avatar;
        }
    } catch (profileError) {
        console.warn('Profile avatar lookup failed; using stored channel_avatar', profileError);
    }

    return video as Video;
}

// Force-refresh channel avatar for all videos from this channel
export async function updateChannelAvatarInVideos(channelId: string, avatar: string) {
    const { error } = await supabase
        .from('videos')
        .update({ channel_avatar: avatar })
        .eq('channel_id', channelId);
    if (error) throw error;
    return true;
}

// Increment views
export async function incrementViews(id: string) {
    const { data: fetchData, error: fetchError } = await supabase
        .from('videos')
        .select('views')
        .eq('id', id)
        .single();
    if (fetchError) throw fetchError;
    const nextViews = ((fetchData?.views ?? 0) as number) + 1;
    const { data: updated, error: updateError } = await supabase
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
    const { data, error } = await supabase.storage
        .from('videos')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(path);

    return urlData.publicUrl;
}

// Upload thumbnail to Supabase Storage
export async function uploadThumbnail(file: File, path: string) {
    const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(path);

    return urlData.publicUrl;
}

// Delete all videos for a channel
export async function deleteChannelVideos(channelId: string) {
    const { error } = await supabase
        .from('videos')
        .delete()
        .eq('channel_id', channelId);

    if (error) throw error;
    return { success: true };
}

// ============== COMMENTS SYSTEM ==============

export interface Comment {
    id: string;
    video_id: string;
    profile_id: string;
    parent_id: string | null;
    content: string;
    likes: number;
    dislikes: number;
    created_at: string;
    updated_at: string;
    // Joined fields
    profile_name?: string;
    profile_avatar?: string;
    replies?: Comment[];
    user_liked?: boolean;
    user_disliked?: boolean;
}

// Get comments for a video
export async function getVideoComments(videoId: string, profileId?: string) {
    const { data: comments, error } = await engagementSupabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!comments || comments.length === 0) return [];

    // Get profile info for commenters
    const profileIds = Array.from(new Set(comments.map((c: any) => c.profile_id)));
    const { data: profiles } = await engagementSupabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', profileIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Get replies for each comment
    const commentIds = comments.map((c: any) => c.id);
    const { data: replies } = await engagementSupabase
        .from('comments')
        .select('*')
        .in('parent_id', commentIds)
        .order('created_at', { ascending: true });

    // Get reply profile info
    const replyProfileIds = Array.from(new Set((replies || []).map((r: any) => r.profile_id)));
    if (replyProfileIds.length > 0) {
        const { data: replyProfiles } = await engagementSupabase
            .from('profiles')
            .select('id, name, avatar')
            .in('id', replyProfileIds);
        (replyProfiles || []).forEach((p: any) => profileMap.set(p.id, p));
    }

    // Get user engagement if logged in
    let userEngagement = new Map();
    if (profileId) {
        const allCommentIds = commentIds.concat((replies || []).map((r: any) => r.id));
        const { data: engagements } = await engagementSupabase
            .from('comment_engagement')
            .select('comment_id, type')
            .eq('profile_id', profileId)
            .in('comment_id', allCommentIds);
        (engagements || []).forEach((e: any) => userEngagement.set(e.comment_id, e.type));
    }

    // Map replies to parent comments
    const replyMap = new Map<string, Comment[]>();
    (replies || []).forEach((r: any) => {
        const profile = profileMap.get(r.profile_id);
        const reply: Comment = {
            ...r,
            profile_name: profile?.name || 'Unknown',
            profile_avatar: profile?.avatar,
            user_liked: userEngagement.get(r.id) === 'like',
            user_disliked: userEngagement.get(r.id) === 'dislike',
        };
        if (!replyMap.has(r.parent_id)) replyMap.set(r.parent_id, []);
        replyMap.get(r.parent_id)!.push(reply);
    });

    return comments.map((c: any) => {
        const profile = profileMap.get(c.profile_id);
        return {
            ...c,
            profile_name: profile?.name || 'Unknown',
            profile_avatar: profile?.avatar,
            replies: replyMap.get(c.id) || [],
            user_liked: userEngagement.get(c.id) === 'like',
            user_disliked: userEngagement.get(c.id) === 'dislike',
        } as Comment;
    });
}

// Add a comment
export async function addComment(videoId: string, profileId: string, content: string, parentId?: string) {
    // Generate a proper UUID for the comment
    const { data: uuidData } = await engagementSupabase.rpc('gen_random_uuid');
    const commentId = uuidData || crypto.randomUUID();
    
    const { data, error } = await engagementSupabase
        .from('comments')
        .insert([{
            id: commentId,
            video_id: videoId,
            profile_id: profileId,
            content: content.trim(),
            parent_id: parentId || null,
            likes: 0,
            dislikes: 0,
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Like/dislike a comment
export async function engageComment(commentId: string, profileId: string, type: 'like' | 'dislike' | null) {
    const client = engagementSupabase;

    // Check existing engagement
    const { data: existing } = await client
        .from('comment_engagement')
        .select('id, type')
        .eq('comment_id', commentId)
        .eq('profile_id', profileId)
        .maybeSingle();

    // Get current comment stats
    const { data: comment } = await client
        .from('comments')
        .select('likes, dislikes')
        .eq('id', commentId)
        .single();

    let likes = comment?.likes || 0;
    let dislikes = comment?.dislikes || 0;
    const existingType = existing?.type;

    if (existing) {
        // Remove existing engagement effect
        if (existingType === 'like') likes--;
        if (existingType === 'dislike') dislikes--;

        if (type === null || type === existingType) {
            // Just remove
            await client.from('comment_engagement').delete().eq('id', existing.id);
        } else {
            // Update to new type
            await client.from('comment_engagement').update({ type }).eq('id', existing.id);
            if (type === 'like') likes++;
            if (type === 'dislike') dislikes++;
        }
    } else if (type) {
        // Create new engagement with UUID - use upsert to prevent duplicates
        const { data: uuidData } = await client.rpc('gen_random_uuid');
        const engId = uuidData || crypto.randomUUID();
        
        // Use upsert with onConflict to prevent duplicate likes
        await client.from('comment_engagement').upsert([{
            id: engId,
            comment_id: commentId,
            profile_id: profileId,
            type,
        }], { onConflict: 'comment_id,profile_id', ignoreDuplicates: true });
        
        if (type === 'like') likes++;
        if (type === 'dislike') dislikes++;
    }

    // Update comment counts
    await client.from('comments').update({ likes, dislikes }).eq('id', commentId);

    return { likes, dislikes };
}

// Delete a comment
export async function deleteComment(commentId: string, profileId: string) {
    const { error } = await engagementSupabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('profile_id', profileId);

    if (error) throw error;
    return true;
}

// Get comment count for a video
export async function getBatchCommentCounts(videoIds: string[]) {
  if (!videoIds.length) return {};
  const { data, error } = await engagementSupabase
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
}

export async function getCommentCount(videoId: string) {
    const { count, error } = await engagementSupabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

    if (error) throw error;
    return count || 0;
}

// ============== SUBSCRIPTIONS SYSTEM ==============

export interface Subscription {
    id: string;
    subscriber_id: string;
    channel_id: string;
    notifications: boolean;
    created_at: string;
}

// Subscribe to a channel
export async function subscribeToChannel(subscriberId: string, channelId: string) {
    const { data, error } = await getSupabaseForTable('videos')
        .from('subscriptions')
        .insert([{
            subscriber_id: subscriberId,
            channel_id: channelId,
            notifications: true,
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Unsubscribe from a channel
export async function unsubscribeFromChannel(subscriberId: string, channelId: string) {
    const { error } = await getSupabaseForTable('videos')
        .from('subscriptions')
        .delete()
        .eq('subscriber_id', subscriberId)
        .eq('channel_id', channelId);

    if (error) throw error;
    return true;
}

// Check if subscribed
export async function isSubscribed(subscriberId: string, channelId: string) {
    const { data, error } = await getSupabaseForTable('videos')
        .from('subscriptions')
        .select('id, notifications')
        .eq('subscriber_id', subscriberId)
        .eq('channel_id', channelId)
        .maybeSingle();

    if (error) throw error;
    return data ? { subscribed: true, notifications: data.notifications } : { subscribed: false, notifications: false };
}

// Toggle notifications for a subscription
export async function toggleSubscriptionNotifications(subscriberId: string, channelId: string) {
    const { data: existing } = await getSupabaseForTable('videos')
        .from('subscriptions')
        .select('id, notifications')
        .eq('subscriber_id', subscriberId)
        .eq('channel_id', channelId)
        .single();

    if (!existing) throw new Error('Not subscribed');

    const { error } = await getSupabaseForTable('videos')
        .from('subscriptions')
        .update({ notifications: !existing.notifications })
        .eq('id', existing.id);

    if (error) throw error;
    return !existing.notifications;
}

// Get subscriber count for a channel
export async function getSubscriberCount(channelId: string) {
    const { count, error } = await getSupabaseForTable('videos')
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId);

    if (error) throw error;
    return count || 0;
}

// Get user's subscriptions with channel info
export async function getSubscriptions(subscriberId: string) {
    const { data: subs, error } = await getSupabaseForTable('videos')
        .from('subscriptions')
        .select('*')
        .eq('subscriber_id', subscriberId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!subs || subs.length === 0) return [];

    // Get channel profiles
    const channelIds = subs.map((s: any) => s.channel_id);
    const { data: profiles } = await getSupabaseForTable('videos')
        .from('profiles')
        .select('id, name, avatar')
        .in('id', channelIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return subs.map((s: any) => {
        const profile = profileMap.get(s.channel_id);
        return {
            ...s,
            channel_name: profile?.name || 'Unknown Channel',
            channel_avatar: profile?.avatar,
        };
    });
}

// Get videos from subscribed channels
export async function getSubscriptionFeed(subscriberId: string, limit = 50) {
    // Get subscribed channel IDs
    const { data: subs } = await getSupabaseForTable('videos')
        .from('subscriptions')
        .select('channel_id')
        .eq('subscriber_id', subscriberId);

    if (!subs || subs.length === 0) return [];

    const channelIds = subs.map((s: any) => s.channel_id);

    // Get videos from those channels
    const { data: videos, error } = await getSupabaseForTable('videos')
        .from('videos')
        .select('*')
        .in('channel_id', channelIds)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return videos as Video[];
}

// ============== RELATED VIDEOS ==============

// Get related videos based on category, channel, or recent uploads
export async function getRelatedVideos(videoId: string, category?: string, channelId?: string, limit = 20) {
    const client = getSupabaseForTable('videos');

    // Strategy: Get videos from same category or channel, excluding current video
    let query = client
        .from('videos')
        .select('*')
        .neq('id', videoId)
        .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")')
        .order('views', { ascending: false })
        .limit(limit);

    // Prioritize same category
    if (category && category !== 'general') {
        query = query.eq('category', category);
    }

    const { data: videos, error } = await query;
    if (error) throw error;

    // If not enough videos from category, get more from same channel or general
    if ((!videos || videos.length < limit) && channelId) {
        const existing = new Set((videos || []).map((v: any) => v.id));
        const { data: channelVideos } = await client
            .from('videos')
            .select('*')
            .eq('channel_id', channelId)
            .neq('id', videoId)
            .order('created_at', { ascending: false })
            .limit(limit - (videos?.length || 0));

        if (channelVideos) {
            channelVideos.forEach((v: any) => {
                if (!existing.has(v.id)) {
                    videos?.push(v);
                }
            });
        }
    }

    // Fill with trending if still not enough
    if (!videos || videos.length < 5) {
        const existing = new Set((videos || []).map((v: any) => v.id));
        const { data: trendingVideos } = await client
            .from('videos')
            .select('*')
            .neq('id', videoId)
            .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")')
            .order('views', { ascending: false })
            .limit(limit);

        if (trendingVideos) {
            trendingVideos.forEach((v: any) => {
                if (!existing.has(v.id) && (videos?.length || 0) < limit) {
                    videos?.push(v);
                }
            });
        }
    }

    return (videos || []) as Video[];
}

// Get top channels by subscriber count
export async function getTopChannels(limit = 10): Promise<Channel[]> {
    const { data: profiles, error } = await engagementSupabase
        .from('profiles')
        .select('id, name, avatar')
        .limit(limit);

    if (error) {
        console.error('getTopChannels error:', error);
        return [];
    }

    if (!profiles || profiles.length === 0) return [];

    // Try to get subscriber counts from subscriptions table
    const channelIds = profiles.map(p => p.id);
    try {
        const { data: subs } = await engagementSupabase
            .from('subscriptions')
            .select('channel_id')
            .in('channel_id', channelIds);

        const subscriberCounts = new Map<string, number>();
        subs?.forEach(s => {
            subscriberCounts.set(s.channel_id, (subscriberCounts.get(s.channel_id) || 0) + 1);
        });

        return profiles.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            subscribers: subscriberCounts.get(p.id) || 0
        }));
    } catch {
        // If subscriptions table doesn't exist or fails, return profiles with 0 subscribers
        return profiles.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            subscribers: 0
        }));
    }
}

// ============== TRENDING ==============

// Get trending videos (most viewed in last 7 days, or all-time if not enough)
export async function getTrendingVideos(limit = 50) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentVideos, error } = await getSupabaseForTable('videos')
        .from('videos')
        .select('*')
        .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")')
        .gte('created_at', sevenDaysAgo)
        .order('views', { ascending: false })
        .limit(limit);

    if (error) throw error;

    // If not enough recent videos, get all-time trending
    if (!recentVideos || recentVideos.length < 10) {
        const { data: allTimeVideos } = await getSupabaseForTable('videos')
            .from('videos')
            .select('*')
            .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")')
            .order('views', { ascending: false })
            .limit(limit);

        return (allTimeVideos || []) as Video[];
    }

    return recentVideos as Video[];
}
