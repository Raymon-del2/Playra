import { turso } from './turso';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dyhbrdijbxjrhfthknkw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aGJyZGlqYnhqcmhmdGhrbmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjM4MDYsImV4cCI6MjA4NDkzOTgwNn0.RSa6GmEkxO9Zf56JxSI7J9nG8upNY-9XrzAJu2QP5A8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateProfiles() {
  console.log('Migrating profiles from Turso to Supabase...');

  try {
    // Get all channels from Turso (these are the profiles)
    const res = await turso.execute('SELECT * FROM channels');
    const channels = res.rows || [];
    
    console.log(`Found ${channels.length} channels in Turso`);

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
