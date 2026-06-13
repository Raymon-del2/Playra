import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const limit = Number(searchParams.get('limit') || 5);
  const isDropdown = searchParams.get('dropdown') === 'true';

  if (!q || q.length < 1) {
    return NextResponse.json({ videos: [], profiles: [] });
  }

  try {
    const pattern = `%${q}%`;
    let videos: any[] = [];
    let profiles: any[] = [];

    if (!supabase) {
      return NextResponse.json({ videos: [], profiles: [] });
    }

    // Build queries in parallel
    const queries: any[] = [];

    // 1) Videos matching the title
    queries.push(
      isDropdown
        ? supabase
            .from('videos')
            .select('id, title, thumbnail_url, channel_name, channel_avatar, channel_id, views, created_at')
            .or(`title.ilike.${pattern},channel_name.ilike.${pattern}`)
            .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")')
            .order('views', { ascending: false })
            .limit(Math.min(limit, 8))
        : supabase
            .from('videos')
            .select('*')
            .or(`title.ilike.${pattern},description.ilike.${pattern},channel_name.ilike.${pattern}`)
            .not('channel_id', 'in', '("ch_1769262677206_k5xxdmskb")')
            .order('created_at', { ascending: false })
            .limit(limit)
    );

    // 2) Profiles matching the name or handle-like search
    queries.push(
      supabase
        .from('profiles')
        .select('id, name, avatar, description, verified, account_type, created_at')
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(limit)
    );

    const [videosRes, profilesRes] = await Promise.all(queries);

    if (videosRes.error) console.error('Supabase video search error:', videosRes.error);
    if (profilesRes.error) console.error('Supabase profile search error:', profilesRes.error);

    videos = videosRes.data || [];
    profiles = profilesRes.data || [];

    // Collect channel_ids and channel_names from videos to look up creators
    const creatorIds = Array.from(
      new Set(
        videos
          .map((v: any) => v.channel_id)
          .filter((id: any) => typeof id === 'string' && id.length > 0)
      )
    );

    const channelNames = Array.from(
      new Set(
        videos
          .map((v: any) => v.channel_name)
          .filter((n: any) => typeof n === 'string' && n.length > 0)
      )
    );

    // 3) Look up creators by id (parallel with name lookup)
    const creatorPromises: any[] = [];

    if (creatorIds.length > 0) {
      creatorPromises.push(
        supabase
          .from('profiles')
          .select('id, name, avatar, description, verified, account_type, created_at')
          .in('id', creatorIds)
      );
    } else {
      creatorPromises.push(Promise.resolve({ data: [], error: null }));
    }

    // 4) Look up creators by channel_name (covers videos whose channel_id isn't linked to a profile)
    if (channelNames.length > 0) {
      const namePattern = channelNames.map((n) => `"${(n as string).replace(/"/g, '\\"')}"`).join(',');
      creatorPromises.push(
        supabase
          .from('profiles')
          .select('id, name, avatar, description, verified, account_type, created_at')
          .in('name', channelNames)
      );
    } else {
      creatorPromises.push(Promise.resolve({ data: [], error: null }));
    }

    const [creatorsByIdRes, creatorsByNameRes] = await Promise.all(creatorPromises);

    if (creatorsByIdRes.error) console.error('Supabase creators-by-id error:', creatorsByIdRes.error);
    if (creatorsByNameRes.error) console.error('Supabase creators-by-name error:', creatorsByNameRes.error);

    // Merge all profile sources, dedupe by id
    const merged = new Map<string, any>();
    for (const p of profiles || []) merged.set(p.id, p);
    for (const p of creatorsByIdRes.data || []) {
      if (!merged.has(p.id)) merged.set(p.id, p);
    }
    for (const p of creatorsByNameRes.data || []) {
      if (!merged.has(p.id)) merged.set(p.id, p);
    }
    profiles = Array.from(merged.values()).slice(0, Math.max(limit, 6));

    console.log(`Search for "${q}": ${videos.length} videos, ${profiles.length} profiles`);
    return NextResponse.json({ videos, profiles });
  } catch (error) {
    console.error('Search API error', error);
    return NextResponse.json({ error: 'Search failed', videos: [], profiles: [] }, { status: 500 });
  }
}
