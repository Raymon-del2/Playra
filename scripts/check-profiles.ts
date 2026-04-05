import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log('Checking profiles in new Supabase...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log(`Found ${data.length} profiles:`);
  data.forEach((p: any) => {
    console.log(`  - ${p.name}: avatar ${p.avatar ? 'YES (length: ' + p.avatar.length + ')' : 'NO'}`);
  });
}

checkProfiles();
