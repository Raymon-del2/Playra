-- Migration: Create engagement tables in Supabase
-- Run this in Supabase SQL Editor

-- Profiles table (for user/channel data)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  banner TEXT,
  verified BOOLEAN DEFAULT false,
  account_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Likes table
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Video Dislikes table
CREATE TABLE IF NOT EXISTS video_dislikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Watch Later table
CREATE TABLE IF NOT EXISTS watch_later (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist Items table
CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, video_id)
);

-- DISABLE Row Level Security for these tables (since we're using anon key)
ALTER TABLE video_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_dislikes DISABLE ROW LEVEL SECURITY;
ALTER TABLE watch_later DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_engagement DISABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_dislikes_video_id ON video_dislikes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_dislikes_user_id ON video_dislikes(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_later_user_id ON watch_later(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_later_video_id ON watch_later(video_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_video_id ON playlist_items(video_id);
