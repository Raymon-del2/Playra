import { turso } from './turso';
import { createClient } from '@supabase/supabase-js';

// Use engagement Supabase (cbfybannksdcajiiwjfl) for profiles
const engagementSupabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const engagementSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const supabase = createClient(engagementSupabaseUrl, engagementSupabaseKey);

async function migrateProfiles() {
  console.log('Migrating profiles from Turso to Supabase...');

  let channels: any[] = [];

  try {
    // Get all channels from Turso (these are the profiles)
    const res = await turso.execute('SELECT * FROM channels');
    channels = res.rows || [];
  } catch (tursoError: any) {
    // Turso returns 404 if table doesn't exist
    if (tursoError.message?.includes('404')) {
      console.log('Turso channels table not found (404). Trying alternative approach...');
      
      // Try to get profiles directly from engagement Supabase
      const { data: existingProfiles } = await supabase.from('profiles').select('id, name');
      console.log(`Found ${existingProfiles?.length || 0} profiles already in engagement Supabase`);
      
      // Check videos Supabase for additional channel data
      const { createClient } = await import('@supabase/supabase-js');
      const videosSupabaseUrl = 'https://dyhbrdijbxjrhfthknkw.supabase.co';
      const videosSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-9XrzAJu2QP5A8';
      const videosSupabase = createClient(videosSupabaseUrl, videosSupabaseKey);
      
      // Get distinct channel info from videos
      const { data: videos } = await videosSupabase.from('videos').select('channel_id, channel_name, channel_avatar').limit(1000);
      
      if (videos && videos.length > 0) {
        const channelMap = new Map();
        const existingIds = new Set(existingProfiles?.map(p => p.id) || []);
        
        videos.forEach((v: any) => {
          if (v.channel_id && !existingIds.has(v.channel_id) && !channelMap.has(v.channel_id)) {
            channelMap.set(v.channel_id, {
              id: v.channel_id,
              name: v.channel_name,
              avatar: v.channel_avatar
            });
          }
        });
        
        if (channelMap.size > 0) {
          channels = Array.from(channelMap.values());
          console.log(`Found ${channels.length} new channels from videos to add`);
        } else {
          console.log('All video channels already exist in profiles');
        }
      }
    } else {
      throw tursoError;
    }
  }
  
  try {
    console.log(`Found ${channels.length} channels to migrate`);

    if (channels.length === 0) {
      console.log('No channels to migrate');
      return;
    }

    // Insert into Supabase profiles
    for (const channel of channels) {
      const { error } = await supabase.from('profiles').upsert({
        id: channel.id,
        user_id: channel.user_id,
        name: channel.name,
        description: channel.description,
        avatar: channel.avatar,
        banner: channel.banner,
        verified: channel.verified || false,
        account_type: channel.account_type || 'general',
        created_at: channel.created_at || new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        console.log(`Error migrating ${channel.id}:`, error.message);
      }
    }

    console.log('Migration complete!');

    // Verify
    const { data: profiles } = await supabase.from('profiles').select('id, name');
    console.log(`Supabase now has ${profiles?.length || 0} profiles`);
  } catch (error) {
    console.error('Migration error:', error);
  }
}

migrateProfiles();
