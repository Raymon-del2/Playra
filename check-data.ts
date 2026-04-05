import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dyhbrdijbxjrhfthknkw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-2XrzAJu2QP5A8'
);

async function checkData() {
  // Check profiles
  const { data: profiles } = await supabase.from('profiles').select('id, name').limit(5);
  console.log('Profiles:', profiles);
  
  // Check comments
  const { data: comments } = await supabase.from('comments').select('id, profile_id, profile_name').limit(5);
  console.log('Comments:', comments);
}

checkData();
