import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyhbrdijbxjrhfthknkw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-9XrzAJu2QP5A8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('Testing insert into video_likes...');
  
  // Try to insert a test like
  const { data, error } = await supabase
    .from('video_likes')
    .upsert({
      video_id: 'test-video-123',
      user_id: 'test-user-123',
    }, { onConflict: 'video_id,user_id' })
    .select();
  
  if (error) {
    console.log('Error:', error.message);
    console.log('Details:', error);
  } else {
    console.log('Success! Data:', data);
  }
  
  // Check if data exists now
  const { data: checkData } = await supabase
    .from('video_likes')
    .select('*');
  console.log('All likes:', checkData);
}

testInsert();
