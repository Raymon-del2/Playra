'use server';

import { listPlaylists, listPlaylistItems, removePlaylistItem } from '@/lib/engagement';
import { engagementSupabase as supabase } from '@/lib/supabase';

export async function fetchUserPlaylists(userId: string) {
  try {
    console.log('[fetchUserPlaylists] Fetching for userId:', userId);

    // Get playlists from Turso
    const playlists = await listPlaylists(userId);
    console.log('[fetchUserPlaylists] Found', playlists.length, 'playlists');

    if (playlists.length === 0) {
      return { success: true, playlists: [] };
    }

    // For each playlist, get its videos
    const playlistsWithVideos = await Promise.all(
      playlists.map(async (playlist: any) => {
        const playlistId = playlist.id as string;
        
        // Get video IDs from playlist
        const items = await listPlaylistItems(playlistId);
        console.log('[fetchUserPlaylists] Playlist', playlist.name, 'has', items.length, 'items');
        
        if (items.length === 0) {
          return {
            id: playlistId,
            name: playlist.name,
            created_at: playlist.created_at,
            videos: [],
            videoCount: 0,
          };
        }

        // Get video IDs
        const videoIds = items.map((item: any) => item.video_id as string);

        // Fetch videos from Supabase
        if (!supabase) {
          throw new Error('Supabase not configured');
        }

        const { data: videos, error } = await supabase
          .from('videos')
          .select('*')
          .in('id', videoIds);

        if (error) {
          console.error('[fetchUserPlaylists] Error fetching videos:', error);
          throw error;
        }

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

        // Merge data and maintain order from playlist items
        const playlistVideos = items.map((item: any) => {
          const video = videoMap.get(item.video_id as string);
          if (!video) {
            console.log('[fetchUserPlaylists] Video not found in Supabase:', item.video_id);
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
            channel_id: video.channel_id,
            channel_name: video.channel_name || profile?.name || 'Unknown',
            channel_avatar: profile?.avatar || video.channel_avatar,
            added_at: item.created_at,
          };
        }).filter(Boolean);

        return {
          id: playlistId,
          name: playlist.name,
          created_at: playlist.created_at,
          videos: playlistVideos,
          videoCount: playlistVideos.length,
        };
      })
    );

    return { success: true, playlists: playlistsWithVideos };
  } catch (error) {
    console.error('[fetchUserPlaylists] Error:', error);
    return { success: false, error: 'Failed to fetch playlists' };
  }
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string) {
  try {
    await removePlaylistItem(playlistId, videoId);
    return { success: true };
  } catch (error) {
    console.error('[removeVideoFromPlaylist] Error:', error);
    return { success: false, error: 'Failed to remove video from playlist' };
  }
}
