'use server';

import { listWatchLater, removeWatchLater, batchCheckWatchLater } from '@/lib/engagement';
import { engagementSupabase as supabase } from '@/lib/supabase';

export async function fetchBatchWatchLaterStatus(userId: string, videoIds: string[]) {
  try {
    const data = await batchCheckWatchLater(userId, videoIds);
    return { success: true, data };
  } catch (error) {
    console.error('Error batch checking watch later:', error);
    return { success: false, error: 'Failed' };
  }
}

export async function fetchWatchLaterVideos(userId: string) {
  try {
    console.log('[fetchWatchLaterVideos] Fetching for userId:', userId);

    // Get watch later video IDs from Turso
    const watchLaterRows = await listWatchLater(userId);
    console.log('[fetchWatchLaterVideos] Found', watchLaterRows.length, 'watch later items');

    if (watchLaterRows.length === 0) {
      return { success: true, videos: [] };
    }

    // Get video IDs
    const videoIds = watchLaterRows.map((row: any) => row.video_id as string);

    // Fetch videos from Supabase
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .in('id', videoIds);

    if (error) {
      console.error('[fetchWatchLaterVideos] Error fetching videos:', error);
      throw error;
    }

    console.log('[fetchWatchLaterVideos] Fetched', videos?.length || 0, 'videos from Supabase');

    // Create a map for quick lookup
    const videoMap = new Map((videos || []).map((v: any) => [v.id, v]));

    // Get unique channel IDs to fetch profile info
    const channelIds = Array.from(new Set((videos || []).map((v: any) => v.channel_id).filter(Boolean)));

    // Fetch channel profiles from Supabase
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', channelIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Merge data and maintain order from watch later (most recent first)
    const result = watchLaterRows.map((row: any) => {
      const video = videoMap.get(row.video_id as string);
      if (!video) {
        console.log('[fetchWatchLaterVideos] Video not found in Supabase:', row.video_id);
        return null;
      }

      const profile = profileMap.get(video.channel_id);

      return {
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        views: video.views,
        created_at: video.created_at,
        category: video.category,
        is_live: video.is_live,
        is_short: video.is_short,
        channel_id: video.channel_id,
        channel_name: video.channel_name || profile?.name || 'Unknown',
        channel_avatar: profile?.avatar || video.channel_avatar,
        saved_at: row.created_at,
      };
    }).filter(Boolean);

    return { success: true, videos: result };
  } catch (error) {
    console.error('[fetchWatchLaterVideos] Error:', error);
    return { success: false, error: 'Failed to fetch watch later videos' };
  }
}

export async function removeFromWatchLater(videoId: string, userId: string) {
  try {
    await removeWatchLater(userId, videoId);
    return { success: true };
  } catch (error) {
    console.error('[removeFromWatchLater] Error:', error);
    return { success: false, error: 'Failed to remove from watch later' };
  }
}
