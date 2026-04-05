import { createClient } from '@supabase/supabase-js';
import { createClient as createTursoClient } from '@libsql/client';

const turso = createTursoClient({
  url: 'libsql://playra-codedwaves01.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk0Mjg2MjYsImlkIjoiODAxYjZlZDMtMTBmOC00NzI2LWE2MzUtYzMwNzU5ODI2NTNmIiwicmlkIjoiZWQ5ZTE5ODctNGQ0MC00ZDE2LWI1OTQtMmQ2NmY1MDIwZjc5In0.KPxsK0l61X6F5Jrjd2VorI5aSWpbXKQsUz2uFUQfV0n0fAqXu4Dy7d6SSnrHGpBndN3WtVZ2Y-vFfGSF9H_6Aw'
});

const supabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSubscriptions() {
  console.log('Debugging subscriptions...');
  
  const result = await turso.execute('SELECT * FROM subscriptions LIMIT 3');
  console.log('Raw Turso result:', JSON.stringify(result, null, 2));
}

debugSubscriptions();
