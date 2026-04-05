import { createClient } from '@supabase/supabase-js';

const newSupabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const newSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const newSupabase = createClient(newSupabaseUrl, newSupabaseKey);

async function copyToProfiles() {
  console.log('Fetching channels from new Supabase (migrated from Turso)...');
  
  const { data: channels, error } = await newSupabase
    .from('channels')
    .select('*');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log(`Found ${channels.length} channels`);
  
  // Convert channels to profiles format
  const profiles = channels.map((ch: any) => ({
    id: ch.id,
    user_id: ch.user_id,
    name: ch.name,
    description: ch.description,
    avatar: ch.avatar,
    banner: ch.banner,
    verified: ch.verified,
    account_type: ch.account_type,
    join_order: ch.join_order,
    created_at: ch.created_at
  }));
  
  // Copy to profiles table
  const { error: insertError } = await newSupabase
    .from('profiles')
    .upsert(profiles, { onConflict: 'id' });
  
  if (insertError) {
    console.error('Insert error:', insertError.message);
  } else {
    console.log(`✅ Copied ${profiles.length} profiles`);
  }
}

copyToProfiles();
