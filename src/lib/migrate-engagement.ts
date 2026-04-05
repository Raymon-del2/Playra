import { turso } from './turso';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyhbrdijbxjrhfthknkw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-9XrzAJu2QP5A8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateData() {
  console.log('Starting migration from Turso to Supabase...');

  // Helper to safely query Turso table
  async function safeQuery(table: string) {
    try {
      const res = await turso.execute(`SELECT * FROM ${table}`);
      return res.rows || [];
    } catch (e: any) {
      if (e.message?.includes('404') || e.message?.includes('no such table')) {
        console.log(`Table ${table} does not exist in Turso, skipping...`);
        return [];
      }
      throw e;
    }
  }

  // Migrate video_likes
  console.log('Migrating video_likes...');
  const likesRes = await safeQuery('video_likes');
  if (likesRes.length) {
    const likesData = likesRes.map((r: any) => ({
      video_id: r.video_id,
      user_id: r.user_id,
      created_at: r.created_at || new Date().toISOString()
    }));
    for (const like of likesData) {
      await supabase.from('video_likes').upsert(like, { onConflict: 'video_id,user_id' });
    }
    console.log(`Migrated ${likesData.length} video_likes`);
  } else {
    console.log('No video_likes to migrate');
  }

  // Migrate video_dislikes
  console.log('Migrating video_dislikes...');
  const dislikesRes = await safeQuery('video_dislikes');
  if (dislikesRes.length) {
    const dislikesData = dislikesRes.map((r: any) => ({
      video_id: r.video_id,
      user_id: r.user_id,
      created_at: r.created_at || new Date().toISOString()
    }));
    for (const dislike of dislikesData) {
      await supabase.from('video_dislikes').upsert(dislike, { onConflict: 'video_id,user_id' });
    }
    console.log(`Migrated ${dislikesData.length} video_dislikes`);
  } else {
    console.log('No video_dislikes to migrate');
  }

  // Migrate watch_later
  console.log('Migrating watch_later...');
  const watchLaterRes = await safeQuery('watch_later');
  if (watchLaterRes.length) {
    const watchLaterData = watchLaterRes.map((r: any) => ({
      user_id: r.user_id,
      video_id: r.video_id,
      created_at: r.created_at || new Date().toISOString()
    }));
    for (const item of watchLaterData) {
      await supabase.from('watch_later').upsert(item, { onConflict: 'user_id,video_id' });
    }
    console.log(`Migrated ${watchLaterData.length} watch_later entries`);
  } else {
    console.log('No watch_later to migrate');
  }

  // Migrate playlists
  console.log('Migrating playlists...');
  const playlistsRes = await safeQuery('playlists');
  if (playlistsRes.length) {
    const playlistsData = playlistsRes.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      name: r.name,
      is_private: true,
      created_at: r.created_at || new Date().toISOString()
    }));
    for (const playlist of playlistsData) {
      await supabase.from('playlists').upsert(playlist);
    }
    console.log(`Migrated ${playlistsData.length} playlists`);
  } else {
    console.log('No playlists to migrate');
  }

  // Migrate playlist_items
  console.log('Migrating playlist_items...');
  const playlistItemsRes = await safeQuery('playlist_items');
  if (playlistItemsRes.length) {
    const playlistItemsData = playlistItemsRes.map((r: any) => ({
      playlist_id: r.playlist_id,
      video_id: r.video_id,
      created_at: r.created_at || new Date().toISOString()
    }));
    for (const item of playlistItemsData) {
      await supabase.from('playlist_items').upsert(item, { onConflict: 'playlist_id,video_id' });
    }
    console.log(`Migrated ${playlistItemsData.length} playlist_items`);
  } else {
    console.log('No playlist_items to migrate');
  }

  console.log('Migration complete!');
}

migrateData().catch(console.error);
