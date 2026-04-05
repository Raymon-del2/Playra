import { createClient } from '@supabase/supabase-js';
import { createClient as createTursoClient } from '@libsql/client';

const turso = createTursoClient({
  url: 'libsql://playra-codedwaves01.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk0Mjg2MjYsImlkIjoiODAxYjZlZDMtMTBmOC00NzI2LWE2MzUtYzMwNzU5ODI2NTNmIiwicmlkIjoiZWQ5ZTE5ODctNGQ0MC00ZDE2LWI1OTQtMmQ2NmY1MDIwZjc5In0.KPxsK0l61X6F5Jrjd2VorI5aSWpbXKQsUz2uFUQfV0n0fAqXu4Dy7d6SSnrHGpBndN3WtVZ2Y-vFfGSF9H_6Aw'
});

const supabaseUrl = 'https://cbfybannksdcajiiwjfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnliYW5ua3NkY2FqaWl3amZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzkwNDAsImV4cCI6MjA5MDgxNTA0MH0.qN6dqfAR5qIOh1T4ctRacBv0J12TdXHc4-NiGe2nLe4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  console.log('Starting migration from Turso to Supabase...\n');

  // 1. Migrate users
  console.log('1. Migrating users...');
  const users = await turso.execute('SELECT * FROM users');
  if (users.rows.length > 0) {
    const { error } = await supabase.from('users').upsert(users.rows, { onConflict: 'id' });
    if (error) console.error('  Users error:', error.message);
    else console.log(`  ✓ Migrated ${users.rows.length} users`);
  } else {
    console.log('  ✓ No users to migrate');
  }

  // 2. Migrate channels (profiles)
  console.log('2. Migrating channels...');
  const channels = await turso.execute('SELECT * FROM channels');
  if (channels.rows.length > 0) {
    const { error } = await supabase.from('channels').upsert(channels.rows, { onConflict: 'id' });
    if (error) console.error('  Channels error:', error.message);
    else console.log(`  ✓ Migrated ${channels.rows.length} channels`);
  } else {
    console.log('  ✓ No channels to migrate');
  }

  // 3. Migrate quizzes
  console.log('3. Migrating quizzes...');
  const quizzes = await turso.execute('SELECT * FROM quizzes');
  if (quizzes.rows.length > 0) {
    const { error } = await supabase.from('quizzes').upsert(quizzes.rows, { onConflict: 'id' });
    if (error) console.error('  Quizzes error:', error.message);
    else console.log(`  ✓ Migrated ${quizzes.rows.length} quizzes`);
  } else {
    console.log('  ✓ No quizzes to migrate');
  }

  // 4. Migrate quiz_votes
  console.log('4. Migrating quiz_votes...');
  const quizVotes = await turso.execute('SELECT * FROM quiz_votes');
  if (quizVotes.rows.length > 0) {
    const { error } = await supabase.from('quiz_votes').upsert(quizVotes.rows, { onConflict: 'id' });
    if (error) console.error('  Quiz votes error:', error.message);
    else console.log(`  ✓ Migrated ${quizVotes.rows.length} quiz votes`);
  } else {
    console.log('  ✓ No quiz votes to migrate');
  }

  // 5. Migrate donations
  console.log('5. Migrating donations...');
  const donations = await turso.execute('SELECT * FROM donations');
  if (donations.rows.length > 0) {
    const { error } = await supabase.from('donations').upsert(donations.rows, { onConflict: 'id' });
    if (error) console.error('  Donations error:', error.message);
    else console.log(`  ✓ Migrated ${donations.rows.length} donations`);
  } else {
    console.log('  ✓ No donations to migrate');
  }

  // 6. Migrate platform_fees
  console.log('6. Migrating platform_fees...');
  const platformFees = await turso.execute('SELECT * FROM platform_fees');
  if (platformFees.rows.length > 0) {
    const { error } = await supabase.from('platform_fees').upsert(platformFees.rows, { onConflict: 'id' });
    if (error) console.error('  Platform fees error:', error.message);
    else console.log(`  ✓ Migrated ${platformFees.rows.length} platform fees`);
  } else {
    console.log('  ✓ No platform fees to migrate');
  }

  // 7. Migrate video_views
  console.log('7. Migrating video_views...');
  const videoViews = await turso.execute('SELECT * FROM video_views');
  if (videoViews.rows.length > 0) {
    const { error } = await supabase.from('video_views').upsert(videoViews.rows, { onConflict: 'id' });
    if (error) console.error('  Video views error:', error.message);
    else console.log(`  ✓ Migrated ${videoViews.rows.length} video views`);
  } else {
    console.log('  ✓ No video views to migrate');
  }

  // 8. Migrate subscriptions
  console.log('8. Migrating subscriptions...');
  const subscriptions = await turso.execute('SELECT * FROM subscriptions');
  if (subscriptions.rows.length > 0) {
    const { error } = await supabase.from('subscriptions').upsert(subscriptions.rows, { onConflict: 'id' });
    if (error) console.error('  Subscriptions error:', error.message);
    else console.log(`  ✓ Migrated ${subscriptions.rows.length} subscriptions`);
  } else {
    console.log('  ✓ No subscriptions to migrate');
  }

  // 9. Migrate comments
  console.log('9. Migrating comments...');
  const comments = await turso.execute('SELECT * FROM comments');
  if (comments.rows.length > 0) {
    const { error } = await supabase.from('comments').upsert(comments.rows, { onConflict: 'id' });
    if (error) console.error('  Comments error:', error.message);
    else console.log(`  ✓ Migrated ${comments.rows.length} comments`);
  } else {
    console.log('  ✓ No comments to migrate');
  }

  // 10. Migrate comment_engagement
  console.log('10. Migrating comment_engagement...');
  const commentEngagement = await turso.execute('SELECT * FROM comment_engagement');
  if (commentEngagement.rows.length > 0) {
    const { error } = await supabase.from('comment_engagement').upsert(commentEngagement.rows, { onConflict: 'id' });
    if (error) console.error('  Comment engagement error:', error.message);
    else console.log(`  ✓ Migrated ${commentEngagement.rows.length} comment engagements`);
  } else {
    console.log('  ✓ No comment engagements to migrate');
  }

  // 11. Migrate videos (if exists in Turso)
  console.log('11. Migrating videos...');
  const videos = await turso.execute('SELECT * FROM videos');
  if (videos.rows.length > 0) {
    const { error } = await supabase.from('videos').upsert(videos.rows, { onConflict: 'id' });
    if (error) console.error('  Videos error:', error.message);
    else console.log(`  ✓ Migrated ${videos.rows.length} videos`);
  } else {
    console.log('  ✓ No videos to migrate');
  }

  console.log('\n✅ Migration complete!');
}

migrate().catch(console.error);
