import { supabase, engagementSupabase } from './supabase';

export async function ensureEngagementTables() {
  // Tables should exist in Supabase - this is a no-op for client-side
  // The tables are: video_likes, video_dislikes, watch_later, playlists, playlist_items
}

export async function getBatchVideoEngagement(videoIds: string[], userId?: string) {
  if (!videoIds.length) return {};

  const { data: likesData } = await supabase
    .from('video_likes')
    .select('video_id')
    .in('video_id', videoIds);

  const { data: dislikesData } = await supabase
    .from('video_dislikes')
    .select('video_id')
    .in('video_id', videoIds);

  let userLikes: Set<string> = new Set();
  let userDislikes: Set<string> = new Set();

  if (userId) {
    const { data: userLikesData } = await supabase
      .from('video_likes')
      .select('video_id')
      .eq('user_id', userId)
      .in('video_id', videoIds);
    
    if (userLikesData) {
      userLikes = new Set(userLikesData.map(r => r.video_id));
    }

    const { data: userDislikesData } = await supabase
      .from('video_dislikes')
      .select('video_id')
      .eq('user_id', userId)
      .in('video_id', videoIds);
    
    if (userDislikesData) {
      userDislikes = new Set(userDislikesData.map(r => r.video_id));
    }
  }

  const likesCount: Record<string, number> = {};
  const dislikesCount: Record<string, number> = {};
  
  likesData?.forEach(r => {
    likesCount[r.video_id] = (likesCount[r.video_id] || 0) + 1;
  });
  
  dislikesData?.forEach(r => {
    dislikesCount[r.video_id] = (dislikesCount[r.video_id] || 0) + 1;
  });

  const results: Record<string, any> = {};
  
  videoIds.forEach(id => {
    results[id] = {
      likes: likesCount[id] || 0,
      views: 0,
      userLiked: userLikes.has(id),
      userDisliked: userDislikes.has(id)
    };
  });

  return results;
}

export async function getVideoEngagement(videoId: string, userId?: string, channelId?: string) {
  const { count: likesCount } = await supabase
    .from('video_likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  const { count: dislikesCount } = await supabase
    .from('video_dislikes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  let subsCount = 0;
  if (channelId) {
    const { count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelId);
    subsCount = count || 0;
  }

  let userLiked = false;
  let userDisliked = false;
  let userSubscribed = false;

  if (userId) {
    const { data: likeData } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .limit(1);
    userLiked = !!likeData?.length;

    const { data: dislikeData } = await supabase
      .from('video_dislikes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .limit(1);
    userDisliked = !!dislikeData?.length;

    if (channelId) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('channel_id', channelId)
        .eq('subscriber_id', userId)
        .limit(1);
      userSubscribed = !!subData?.length;
    }
  }

  return {
    likes: likesCount || 0,
    views: (likesCount || 0) + (dislikesCount || 0),
    subs: subsCount,
    userLiked,
    userDisliked,
    userSubscribed,
  };
}

export async function addView(videoId: string, userId?: string) {
  return 0;
}

export async function likeVideo(videoId: string, userId: string) {
  await supabase
    .from('video_dislikes')
    .delete()
    .eq('video_id', videoId)
    .eq('user_id', userId);
  
  await supabase
    .from('video_likes')
    .upsert({
      video_id: videoId,
      user_id: userId,
    }, { onConflict: 'video_id,user_id' });

  const { count } = await supabase
    .from('video_likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  return count || 0;
}

export async function unlikeVideo(videoId: string, userId: string) {
  await supabase
    .from('video_likes')
    .delete()
    .eq('video_id', videoId)
    .eq('user_id', userId);

  const { count } = await supabase
    .from('video_likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  return count || 0;
}

export async function dislikeVideo(videoId: string, userId: string) {
  await supabase
    .from('video_likes')
    .delete()
    .eq('video_id', videoId)
    .eq('user_id', userId);
  
  await supabase
    .from('video_dislikes')
    .upsert({
      video_id: videoId,
      user_id: userId,
    }, { onConflict: 'video_id,user_id' });

  const { count } = await supabase
    .from('video_dislikes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  return count || 0;
}

export async function undislikeVideo(videoId: string, userId: string) {
  await supabase
    .from('video_dislikes')
    .delete()
    .eq('video_id', videoId)
    .eq('user_id', userId);

  const { count } = await supabase
    .from('video_dislikes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  return count || 0;
}

export async function getLikedVideos(userId: string) {
  const { data: likesData, error } = await supabase
    .from('video_likes')
    .select('video_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error || !likesData?.length) return [];
  
  const videoIds = likesData.map(row => row.video_id);
  
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*')
    .in('id', videoIds);
  
  if (videosError || !videos) return [];
  
  const videoMap = new Map(videos.map(v => [v.id, v]));
  
  const channelIds = Array.from(new Set(videos.map(v => v.channel_id).filter(Boolean)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar')
    .in('id', channelIds);
  
  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  
  return likesData.map(row => {
    const video = videoMap.get(row.video_id);
    if (!video) return null;
    
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
      liked_at: row.created_at,
    };
  }).filter(Boolean);
}

export async function subscribeChannel(channelId: string, subscriberId: string) {
  await supabase
    .from('subscriptions')
    .upsert({
      channel_id: channelId,
      subscriber_id: subscriberId,
    }, { onConflict: 'channel_id,subscriber_id' });

  const { count } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId);

  return count || 0;
}

export async function unsubscribeChannel(channelId: string, subscriberId: string) {
  await supabase
    .from('subscriptions')
    .delete()
    .eq('channel_id', channelId)
    .eq('subscriber_id', subscriberId);

  const { count } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId);

  return count || 0;
}

export async function addWatchLater(userId: string, videoId: string) {
  await supabase
    .from('watch_later')
    .upsert({
      user_id: userId,
      video_id: videoId,
    }, { onConflict: 'user_id,video_id' });
  return { ok: true };
}

export async function removeWatchLater(userId: string, videoId: string) {
  await supabase
    .from('watch_later')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);
  return { ok: true };
}

export async function batchCheckWatchLater(userId: string, videoIds: string[]) {
  if (!videoIds.length) return {};
  
  const { data } = await supabase
    .from('watch_later')
    .select('video_id')
    .eq('user_id', userId)
    .in('video_id', videoIds);
  
  const savedIds = new Set(data?.map(r => r.video_id) || []);
  const results: Record<string, boolean> = {};
  videoIds.forEach(id => {
    results[id] = savedIds.has(id);
  });
  return results;
}

export async function listWatchLater(userId: string) {
  const { data, error } = await supabase
    .from('watch_later')
    .select('video_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return data || [];
}

export async function createPlaylist(userId: string, name: string, isPrivate = true) {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: userId,
      name: name,
      is_private: isPrivate,
    })
    .select()
    .single();
  
  return data || { id: null, ok: !error };
}

export async function addPlaylistItem(playlistId: string, videoId: string) {
  await supabase
    .from('playlist_items')
    .upsert({
      playlist_id: playlistId,
      video_id: videoId,
    }, { onConflict: 'playlist_id,video_id' });
  return { ok: true };
}

export async function removePlaylistItem(playlistId: string, videoId: string) {
  await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId);
  return { ok: true };
}

export async function listPlaylists(userId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('id, name, created_at, is_private')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return data || [];
}

export async function listPlaylistItems(playlistId: string) {
  const { data, error } = await supabase
    .from('playlist_items')
    .select('video_id, created_at')
    .eq('playlist_id', playlistId)
    .order('created_at', { ascending: false });
  
  return data || [];
}
