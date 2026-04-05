import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyhbrdijbxjrhfthknkw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-9XrzAJu2QP5A8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Checking Supabase tables...\n');
  
  // Check video_likes
  const { count: likesCount } = await supabase.from('video_likes').select('*', { count: 'exact', head: true });
  console.log('video_likes:', likesCount);
  
  // Check video_dislikes
  const { count: dislikesCount } = await supabase.from('video_dislikes').select('*', { count: 'exact', head: true });
  console.log('video_dislikes:', dislikesCount);
  
  // Check watch_later
  const { count: watchLaterCount } = await supabase.from('watch_later').select('*', { count: 'exact', head: true });
  console.log('watch_later:', watchLaterCount);
  
  // Check playlists
  const { count: playlistsCount } = await supabase.from('playlists').select('*', { count: 'exact', head: true });
  console.log('playlists:', playlistsCount);
  
  // Check subscriptions (existing table)
  const { count: subsCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true });
  console.log('subscriptions:', subsCount);
  
  // Check comments (existing table)
  const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true });
  console.log('comments:', commentsCount);
}

checkData();
