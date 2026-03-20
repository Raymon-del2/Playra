-- This SQL adds the missing columns needed for posts functionality
-- Run this in your Supabase SQL Editor

-- Add post-related columns to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS is_post BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_type TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'video',
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';

-- Create index for faster post queries
CREATE INDEX IF NOT EXISTS idx_videos_is_post ON videos(is_post);
CREATE INDEX IF NOT EXISTS idx_videos_post_type ON videos(post_type);
CREATE INDEX IF NOT EXISTS idx_videos_visibility ON videos(visibility);

-- Enable RLS for posts bucket if not already enabled
-- Note: You'll need to set up storage policies manually in Supabase dashboard
