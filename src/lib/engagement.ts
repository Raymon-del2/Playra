import { turso } from './turso';
import { supabase } from './supabase';

// Ensure all needed tables exist
export async function ensureEngagementTables() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS video_views (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      video_id TEXT NOT NULL,
      user_id TEXT,
      watched_seconds INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS video_likes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      video_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(video_id, user_id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      subscriber_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(subscriber_id, channel_id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS video_dislikes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      video_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(video_id, user_id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS watch_later (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, video_id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS playlist_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      playlist_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(playlist_id, video_id)
    );
  `);
}

export async function getBatchVideoEngagement(videoIds: string[], userId?: string) {
  if (!videoIds.length) return {};
  await ensureEngagementTables();

  const idList = videoIds.map(id => `'${id}'`).join(',');
  
  // Batch Fetch Likes Count
  const likesRes = await turso.execute(`
    SELECT video_id, COUNT(*) as count 
    FROM video_likes 
    WHERE video_id IN (${idList}) 
    GROUP BY video_id
  `);
  
  const viewsRes = await turso.execute(`
    SELECT video_id, COUNT(*) as count 
    FROM video_views 
    WHERE video_id IN (${idList}) 
    GROUP BY video_id
  `);

  let userLikes: Set<string> = new Set();
  let userDislikes: Set<string> = new Set();

  if (userId) {
    const userLikesRes = await turso.execute({
      sql: `SELECT video_id FROM video_likes WHERE user_id = ? AND video_id IN (${idList})`,
      args: [userId]
    });
    userLikes = new Set(userLikesRes.rows.map(r => r.video_id as string));

    const userDislikesRes = await turso.execute({
      sql: `SELECT video_id FROM video_dislikes WHERE user_id = ? AND video_id IN (${idList})`,
      args: [userId]
    });
    userDislikes = new Set(userDislikesRes.rows.map(r => r.video_id as string));
  }

  const results: Record<string, any> = {};
  
  // Pre-fill with zeros
  videoIds.forEach(id => {
    results[id] = {
      likes: 0,
      views: 0,
      userLiked: userLikes.has(id),
      userDisliked: userDislikes.has(id)
    };
  });

  likesRes.rows.forEach(r => {
    if (results[r.video_id as string]) {
      results[r.video_id as string].likes = Number(r.count);
    }
  });

  viewsRes.rows.forEach(r => {
    if (results[r.video_id as string]) {
      results[r.video_id as string].views = Number(r.count);
    }
  });

  return results;
}

export async function getVideoEngagement(videoId: string, userId?: string, channelId?: string) {
  await ensureEngagementTables();

  const [likesRes, viewsRes, subsRes, userLikeRes, userDislikeRes, userSubRes] = await Promise.all([
    turso.execute({ sql: `SELECT COUNT(*) as count FROM video_likes WHERE video_id = ?`, args: [videoId] }),
    turso.execute({ sql: `SELECT COUNT(*) as count FROM video_views WHERE video_id = ?`, args: [videoId] }),
    channelId
      ? turso.execute({ sql: `SELECT COUNT(*) as count FROM subscriptions WHERE channel_id = ?`, args: [channelId] })
      : Promise.resolve({ rows: [{ count: 0 }] }),
    userId
      ? turso.execute({
          sql: `SELECT 1 FROM video_likes WHERE video_id = ? AND user_id = ? LIMIT 1`,
          args: [videoId, userId],
        })
      : Promise.resolve({ rows: [] }),
    userId
      ? turso.execute({
          sql: `SELECT 1 FROM video_dislikes WHERE video_id = ? AND user_id = ? LIMIT 1`,
          args: [videoId, userId],
        })
      : Promise.resolve({ rows: [] }),
    userId && channelId
      ? turso.execute({
          sql: `SELECT 1 FROM subscriptions WHERE channel_id = ? AND subscriber_id = ? LIMIT 1`,
          args: [channelId, userId],
        })
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    likes: Number(likesRes.rows?.[0]?.count ?? 0),
    views: Number(viewsRes.rows?.[0]?.count ?? 0),
    subs: Number(subsRes.rows?.[0]?.count ?? 0),
    userLiked: !!userLikeRes.rows?.[0],
    userDisliked: !!userDislikeRes.rows?.[0],
    userSubscribed: !!userSubRes.rows?.[0],
  };
}

export async function addView(videoId: string, userId?: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `INSERT INTO video_views (video_id, user_id) VALUES (?, ?)`,
    args: [videoId, userId ?? null],
  });
  const res = await turso.execute({ sql: `SELECT COUNT(*) as count FROM video_views WHERE video_id = ?`, args: [videoId] });
  return Number(res.rows?.[0]?.count ?? 0);
}

export async function likeVideo(videoId: string, userId: string) {
  await ensureEngagementTables();
  // Remove dislike if exists
  await turso.execute({
    sql: `DELETE FROM video_dislikes WHERE video_id = ? AND user_id = ?`,
    args: [videoId, userId],
  });
  // Add like
  await turso.execute({
    sql: `INSERT OR IGNORE INTO video_likes (video_id, user_id) VALUES (?, ?)`,
    args: [videoId, userId],
  });
  const res = await turso.execute({ sql: `SELECT COUNT(*) as count FROM video_likes WHERE video_id = ?`, args: [videoId] });
  return Number(res.rows?.[0]?.count ?? 0);
}

export async function unlikeVideo(videoId: string, userId: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `DELETE FROM video_likes WHERE video_id = ? AND user_id = ?`,
    args: [videoId, userId],
  });
  const res = await turso.execute({ sql: `SELECT COUNT(*) as count FROM video_likes WHERE video_id = ?`, args: [videoId] });
  return Number(res.rows?.[0]?.count ?? 0);
}

export async function dislikeVideo(videoId: string, userId: string) {
  await ensureEngagementTables();
  // Remove like if exists
  await turso.execute({
    sql: `DELETE FROM video_likes WHERE video_id = ? AND user_id = ?`,
    args: [videoId, userId],
  });
  // Add dislike
  await turso.execute({
    sql: `INSERT OR IGNORE INTO video_dislikes (video_id, user_id) VALUES (?, ?)`,
    args: [videoId, userId],
  });
  const res = await turso.execute({ sql: `SELECT COUNT(*) as count FROM video_likes WHERE video_id = ?`, args: [videoId] });
  return Number(res.rows?.[0]?.count ?? 0);
}

export async function undislikeVideo(videoId: string, userId: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `DELETE FROM video_dislikes WHERE video_id = ? AND user_id = ?`,
    args: [videoId, userId],
  });
  const res = await turso.execute({ sql: `SELECT COUNT(*) as count FROM video_likes WHERE video_id = ?`, args: [videoId] });
  return Number(res.rows?.[0]?.count ?? 0);
}

export async function getLikedVideos(userId: string) {
  await ensureEngagementTables();
  
  // Get liked video IDs from Turso
  const likesRes = await turso.execute({
    sql: `SELECT video_id, created_at as liked_at FROM video_likes WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });
  
  const likedRows = likesRes.rows || [];
  if (likedRows.length === 0) return [];
  
  // Get video IDs
  const videoIds = likedRows.map((row: any) => row.video_id as string);
  
  // Fetch videos from Supabase
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .in('id', videoIds);
  
  if (error) {
    console.error('Error fetching videos from Supabase:', error);
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
  
  // Merge data and maintain order from likes
  return likedRows.map((row: any) => {
    const video = videoMap.get(row.video_id as string);
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
      liked_at: row.liked_at,
    };
  }).filter(Boolean);
}

export async function subscribeChannel(channelId: string, subscriberId: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `INSERT OR IGNORE INTO subscriptions (channel_id, subscriber_id) VALUES (?, ?)`,
    args: [channelId, subscriberId],
  });
  const res = await turso.execute({ sql: `SELECT COUNT(*) as count FROM subscriptions WHERE channel_id = ?`, args: [channelId] });
  return Number(res.rows?.[0]?.count ?? 0);
}

export async function unsubscribeChannel(channelId: string, subscriberId: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `DELETE FROM subscriptions WHERE channel_id = ? AND subscriber_id = ?`,
    args: [channelId, subscriberId],
  });
  const res = await turso.execute({ sql: `SELECT COUNT(*) as count FROM subscriptions WHERE channel_id = ?`, args: [channelId] });
  return Number(res.rows?.[0]?.count ?? 0);
}

export async function addWatchLater(userId: string, videoId: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `INSERT OR IGNORE INTO watch_later (user_id, video_id) VALUES (?, ?)`,
    args: [userId, videoId],
  });
  return { ok: true };
}

export async function removeWatchLater(userId: string, videoId: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `DELETE FROM watch_later WHERE user_id = ? AND video_id = ?`,
    args: [userId, videoId],
  });
  return { ok: true };
}

export async function batchCheckWatchLater(userId: string, videoIds: string[]) {
  if (!videoIds.length) return {};
  await ensureEngagementTables();
  const idList = videoIds.map(id => `'${id}'`).join(',');
  const res = await turso.execute(`
    SELECT video_id FROM watch_later 
    WHERE user_id = ? AND video_id IN (${idList})
  `, [userId]);
  
  const savedIds = new Set(res.rows.map(r => r.video_id as string));
  const results: Record<string, boolean> = {};
  videoIds.forEach(id => {
    results[id] = savedIds.has(id);
  });
  return results;
}

export async function listWatchLater(userId: string) {
  await ensureEngagementTables();
  const res = await turso.execute({
    sql: `SELECT video_id, created_at FROM watch_later WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });
  return res.rows || [];
}

export async function createPlaylist(userId: string, name: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `INSERT INTO playlists (user_id, name) VALUES (?, ?)`,
    args: [userId, name],
  });
  return { ok: true };
}

export async function addPlaylistItem(playlistId: string, videoId: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `INSERT OR IGNORE INTO playlist_items (playlist_id, video_id) VALUES (?, ?)`,
    args: [playlistId, videoId],
  });
  return { ok: true };
}

export async function removePlaylistItem(playlistId: string, videoId: string) {
  await ensureEngagementTables();
  await turso.execute({
    sql: `DELETE FROM playlist_items WHERE playlist_id = ? AND video_id = ?`,
    args: [playlistId, videoId],
  });
  return { ok: true };
}

export async function listPlaylists(userId: string) {
  await ensureEngagementTables();
  const res = await turso.execute({
    sql: `SELECT id, name, created_at FROM playlists WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });
  return res.rows || [];
}

export async function listPlaylistItems(playlistId: string) {
  await ensureEngagementTables();
  const res = await turso.execute({
    sql: `SELECT video_id, created_at FROM playlist_items WHERE playlist_id = ? ORDER BY created_at DESC`,
    args: [playlistId],
  });
  return res.rows || [];
}
