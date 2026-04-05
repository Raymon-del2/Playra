import { createClient } from '@supabase/supabase-js';
import { createClient as createTursoClient } from '@libsql/client';

const turso = createTursoClient({
  url: 'libsql://playra-codedwaves01.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk0Mjg2MjYsImlkIjoiODAxYjZlZDMtMTBmOC00NzI2LWE2MzUtYzMwNzU5ODI2NTNmIiwicmlkIjoiZWQ5ZTE5ODctNGQ0MC00ZDE2LWI1OTQtMmQ2NmY1MDIwZjc5In0.KPxsK0l61X6F5Jrjd2VorI5aSWpbXKQsUz2uFUQfV0n0fAqXu4Dy7d6SSnrHGpBndN3WtVZ2Y-vFfGSF9H_6Aw'
});

const supabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateWithoutAvatars() {
  console.log('Migrating channels WITHOUT avatars (faster)...');
  
  try {
    const result = await turso.execute('SELECT id, user_id, name, description, verified, account_type, join_order, created_at FROM channels');
    console.log(`Found ${result.rows.length} channels`);
    
    const channels = result.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      avatar: null, // Skip avatar for now
      banner: row.banner,
      verified: Boolean(row.verified),
      account_type: row.account_type || 'general',
      join_order: row.join_order,
      created_at: row.created_at
    }));
    
    const { error } = await supabase.from('channels').upsert(channels, { onConflict: 'id' });
    
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log(`✅ Migrated ${channels.length} channels (without avatars)`);
    }
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

async function migrateOtherTables() {
  const tables = ['users', 'quizzes', 'quiz_votes', 'donations', 'platform_fees', 'video_views', 'subscriptions', 'comments', 'comment_engagement', 'join_order_counter'];
  
  for (const table of tables) {
    try {
      const result = await turso.execute(`SELECT * FROM ${table}`);
      if (result.rows.length > 0) {
        const { error } = await supabase.from(table).upsert(result.rows, { onConflict: 'id' });
        console.log(`${table}: ${error ? error.message : `✅ ${result.rows.length} rows`}`);
      } else {
        console.log(`${table}: No data`);
      }
    } catch (e: any) {
      console.log(`${table}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('=== Fast Migration ===\n');
  await migrateWithoutAvatars();
  console.log('\n=== Other Tables ===');
  await migrateOtherTables();
  console.log('\n✅ Done!');
}

main().catch(console.error);
