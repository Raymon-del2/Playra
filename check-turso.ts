import { turso } from './src/lib/turso';

async function checkTables() {
  const res = await turso.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables in Turso:');
  console.log(res.rows.map((r: any) => r.name).join('\n'));
  
  // Check if video_likes exists
  try {
    const likes = await turso.execute('SELECT COUNT(*) as count FROM video_likes');
    console.log('\nvideo_likes count:', likes.rows?.[0]?.count);
  } catch(e) {
    console.log('\nvideo_likes table does not exist');
  }
}

checkTables();
