import { createClient } from '@supabase/supabase-js';
import { createClient as createTursoClient } from '@libsql/client';

const turso = createTursoClient({
  url: 'libsql://playra-codedwaves01.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk0Mjg2MjYsImlkIjoiODAxYjZlZDMtMTBmOC00NzI2LWE2MzUtYzMwNzU5ODI2NTNmIiwicmlkIjoiZWQ5ZTE5ODctNGQ0MC00ZDE2LWI1OTQtMmQ2NmY1MDIwZjc5In0.KPxsK0l61X6F5Jrjd2VorI5aSWpbXKQsUz2uFUQfV0n0fAqXu4Dy7d6SSnrHGpBndN3WtVZ2Y-vFfGSF9H_6Aw'
});

const supabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateAvatars() {
  console.log('Migrating channel avatars...');
  
  try {
    const result = await turso.execute('SELECT id, avatar FROM channels WHERE avatar IS NOT NULL AND avatar != ""');
    console.log(`Found ${result.rows.length} channels with avatars`);
    
    let migrated = 0;
    for (const row of result.rows) {
      const { error } = await supabase
        .from('channels')
        .update({ avatar: row.avatar })
        .eq('id', row.id);
      
      if (error) {
        console.error(`Error for ${row.id}:`, error.message);
      } else {
        migrated++;
        if (migrated % 3 === 0) console.log(`  ✓ ${migrated}/${result.rows.length}`);
      }
    }
    
    console.log(`✅ Migrated ${migrated} avatars`);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

async function fixSubscriptions() {
  console.log('\nFixing subscriptions table...');
  
  try {
    // Get subscriptions from Turso
    const result = await turso.execute('SELECT * FROM subscriptions');
    console.log(`Found ${result.rows.length} subscriptions in Turso`);
    
    // Add notifications column if missing
    try {
      await supabase.rpc('exec_sql', { query: 'ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS notifications BOOLEAN DEFAULT false' });
    } catch (e) {
      // Column might already exist
    }
    
    // Migrate subscriptions
    let migrated = 0;
    for (const row of result.rows) {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          id: row.id,
          subscriber_id: row.subscriber_id,
          channel_id: row.channel_id,
          notifications: row.notifications || false,
          created_at: row.created_at
        }, { onConflict: 'id' });
      
      if (!error) migrated++;
    }
    
    console.log(`✅ Migrated ${migrated} subscriptions`);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

async function main() {
  await migrateAvatars();
  await fixSubscriptions();
  console.log('\n✅ Done!');
}

main().catch(console.error);
