import { createClient } from '@supabase/supabase-js';

const oldSupabaseUrl = 'https://dyhbrdijbxjrhfthknkw.supabase.co';
const oldSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-9XrzAJu2QP5A8';

const newSupabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const newSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const oldSupabase = createClient(oldSupabaseUrl, oldSupabaseKey);
const newSupabase = createClient(newSupabaseUrl, newSupabaseKey);

async function migrate() {
  console.log('Fetching profiles from old Supabase...');
  
  const { data: profiles, error } = await oldSupabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log(`Found ${profiles.length} profiles`);
  
  // Copy to new Supabase
  const { error: insertError } = await newSupabase
    .from('profiles')
    .upsert(profiles, { onConflict: 'id' });
  
  if (insertError) {
    console.error('Insert error:', insertError.message);
  } else {
    console.log(`✅ Migrated ${profiles.length} profiles`);
  }
}

migrate();
