import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { turso } from '@/lib/turso';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const limit = Number(searchParams.get('limit') || 5);
  const isDropdown = searchParams.get('dropdown') === 'true';

  if (!q || q.length < 2) {
    return NextResponse.json({ videos: [], profiles: [] });
  }

  try {
    // Fetch videos from Supabase
    let videos: any[] = [];
    if (supabase) {
      // For dropdown: use partial matching, titles only, limit to 5-8
      if (isDropdown) {
        const pattern = `%${q}%`;
        const { data, error } = await supabase
          .from('videos')
          .select('id, title, thumbnail_url, channel_name, channel_avatar')
          .ilike('title', pattern)
          .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")')
          .order('views', { ascending: false })
          .limit(Math.min(limit, 8));
        
        if (error) {
          console.error('Supabase dropdown search error:', error);
        } else {
          videos = data || [];
          console.log(`Dropdown search: ${videos.length} videos for "${q}"`);
        }
      } else {
        // Full search: use ILIKE with %pattern%, search title + description + channel_name
        const pattern = `%${q}%`;
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .or(`title.ilike.${pattern},description.ilike.${pattern},channel_name.ilike.${pattern}`)
          .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")')
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) {
          console.error('Supabase search error:', error);
          console.error('Search query:', pattern);
        } else {
          videos = data || [];
          console.log(`Supabase returned ${videos.length} videos for query "${q}"`);
          // Also filter client-side for case-insensitivity as fallback
          const lowerQ = q.toLowerCase();
          videos = videos.filter((v: any) => 
            (v.title && v.title.toLowerCase().includes(lowerQ)) ||
            (v.description && v.description.toLowerCase().includes(lowerQ)) ||
            (v.channel_name && v.channel_name.toLowerCase().includes(lowerQ))
          );
          console.log(`After client-side filter: ${videos.length} videos`);
        }
      }
    }

    // Fetch profiles (channels) from Turso
    let profiles: any[] = [];
    try {
      const pattern = isDropdown ? `${q}%` : `%${q}%`;
      const profilesRes = await turso.execute({
        sql: `
          SELECT id, name, avatar, description, verified, account_type, created_at
          FROM channels
          WHERE name LIKE ?
          ORDER BY created_at DESC
          LIMIT ?
        `,
        args: [pattern.replace(/%/g, '%'), limit],
      });
      profiles = profilesRes?.rows || [];
    } catch (tursoError) {
      console.error('Turso search error:', tursoError);
    }

    console.log(`Search for "${q}": ${videos.length} videos, ${profiles.length} profiles`);
    return NextResponse.json({ videos, profiles });
  } catch (error) {
    console.error('Search API error', error);
    return NextResponse.json({ error: 'Search failed', videos: [], profiles: [] }, { status: 500 });
  }
}
