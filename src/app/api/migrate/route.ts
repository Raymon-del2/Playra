import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Migration check for Supabase tables
export async function GET() {
  const results: string[] = [];
  
  try {
    // Check if required tables exist in Supabase
    const tables = ['videos', 'profiles', 'post_likes', 'post_comments', 'quizzes', 'quiz_votes', 'quiz_analytics_logs', 'community_messages'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code === '42P01') {
          results.push(`Table missing: ${table}`);
        } else {
          results.push(`Table exists: ${table}`);
        }
      } catch (e: any) {
        results.push(`Error checking ${table}: ${e.message}`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase migration check completed',
      results 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
