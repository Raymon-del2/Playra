import { turso } from './turso';

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

export async function getVideoEngagement(videoId: string, userId?: string, channelId?: string) {
  await ensureEngagementTables();

  const [likesRes, viewsRes, subsRes, userLikeRes, userSubRes] = await Promise.all([
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
