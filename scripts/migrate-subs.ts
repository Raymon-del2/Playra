import { createClient } from '@supabase/supabase-js';
import { createClient as createTursoClient } from '@libsql/client';

const turso = createTursoClient({
  url: 'libsql://playra-codedwaves01.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk0Mjg2MjYsImlkIjoiODAxYjZlZDMtMTBmOC00NzI2LWE2MzUtYzMwNzU5ODI2NTNmIiwicmlkIjoiZWQ5ZTE5ODctNGQ0MC00ZDE2LWI1OTQtMmQ2NmY1MDIwZjc5In0.KPxsK0l61X6F5Jrjd2VorI5aSWpbXKQsUz2uFUQfV0n0fAqXu4Dy7d6SSnrHGpBndN3WtVZ2Y-vFfGSF9H_6Aw'
});

const supabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateSubscriptions() {
  console.log('Migrating subscriptions...');
  
  const result = await turso.execute('SELECT * FROM subscriptions');
  console.log(`Found ${result.rows.length} subscriptions`);
  
  // Turso returns rows as arrays, map to objects
  const columns = result.columns;
  const subs = result.rows.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj;
  });
  
  console.log('Sample:', JSON.stringify(subs[0], null, 2));
  
  let migrated = 0;
  for (const sub of subs) {
    try {
      const { error } = await supabase.from('subscriptions').upsert({
        id: sub.id,
        subscriber_id: sub.subscriber_id,
        channel_id: sub.channel_id,
        notifications: sub.notifications === 1,
        created_at: sub.created_at
      }, { onConflict: 'id' });
      
      if (error) {
        console.log(`Error: ${error.message}`);
      } else {
        migrated++;
      }
    } catch (e: any) {
      console.log(`Error: ${e.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} subscriptions`);
}

migrateSubscriptions();
