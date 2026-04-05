import { createClient } from '@supabase/supabase-js';
import { createClient as createTursoClient } from '@libsql/client';

const turso = createTursoClient({
  url: 'libsql://playra-codedwaves01.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk0Mjg2MjYsImlkIjoiODAxYjZlZDMtMTBmOC00NzI2LWE2MzUtYzMwNzU5ODI2NTNmIiwicmlkIjoiZWQ5ZTE5ODctNGQ0MC00ZDE2LWI1OTQtMmQ2NmY1MDIwZjc5In0.KPxsK0l61X6F5Jrjd2VorI5aSWpbXKQsUz2uFUQfV0n0fAqXu4Dy7d6SSnrHGpBndN3WtVZ2Y-vFfGSF9H_6Aw'
});

const supabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateTable(tableName: string, batchSize = 10) {
  console.log(`Migrating ${tableName}...`);
  
  try {
    // Get total count
    const countResult = await turso.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    const total = countResult.rows[0]?.count || 0;
    console.log(`  Total: ${total}`);
    
    if (total === 0) {
      console.log(`  ✓ No data`);
      return;
    }
    
    // Migrate in batches
    let offset = 0;
    let migrated = 0;
    
    while (offset < total) {
      const result = await turso.execute(`SELECT * FROM ${tableName} LIMIT ${batchSize} OFFSET ${offset}`);
      
      if (result.rows.length === 0) break;
      
      const { error } = await supabase.from(tableName).upsert(result.rows, { onConflict: 'id' });
      
      if (error) {
        console.error(`  Error at offset ${offset}:`, error.message);
      } else {
        migrated += result.rows.length;
        console.log(`  ✓ Migrated ${migrated}/${total}`);
      }
      
      offset += batchSize;
    }
    
    console.log(`  ✅ Done: ${migrated} rows`);
  } catch (e: any) {
    console.error(`  ❌ Error:`, e.message);
  }
}

async function main() {
  console.log('Starting batch migration...\n');
  
  await migrateTable('users');
  await migrateTable('channels');
  await migrateTable('quizzes');
  await migrateTable('quiz_votes');
  await migrateTable('donations');
  await migrateTable('platform_fees');
  await migrateTable('video_views');
  await migrateTable('subscriptions');
  await migrateTable('comments');
  await migrateTable('comment_engagement');
  await migrateTable('join_order_counter');
  
  console.log('\n✅ Migration complete!');
}

main().catch(console.error);
