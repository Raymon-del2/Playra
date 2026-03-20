import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { post_type, visibility, content, profile_id, profile_name, profile_avatar } = body;

    // 2. Basic Validation
    if (!post_type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Mode-Specific Formatting (Ensuring data integrity)
    let finalContent = {};

    switch (post_type) {
      case 'text':
        finalContent = { text: content.text };
        break;
      case 'poll':
        finalContent = {
          question: content.question,
          options: content.options, // Array of strings
          votes: new Array(content.options.length).fill(0),
        };
        break;
      case 'quiz':
        finalContent = {
          question: content.question,
          options: content.options,
          correct_index: content.correct_index,
        };
        break;
      case 'image':
        finalContent = {
          text: content.text,
          images: content.images, // Array of URLs from Supabase Storage
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid post type' }, { status: 400 });
    }

    // Get user profile info from request or use defaults
    const profile = { 
      id: profile_id || 'anonymous', 
      name: profile_name || 'Anonymous', 
      avatar: profile_avatar || null 
    };

    // 4. Insert into Supabase - only use existing columns
    const postData = {
      ...finalContent,
      _post_type: post_type,
      _visibility: visibility || 'public',
      _is_post: true,
    };

    const { data, error } = await supabase
      .from('videos')
      .insert({
        channel_id: profile.id,
        channel_name: profile.name,
        channel_avatar: profile.avatar || '',
        title: content.text?.substring(0, 100) || 'Community Post',
        description: JSON.stringify(postData),
        video_url: '',
        thumbnail_url: content.images?.[0] || '',
        is_live: false,
        is_short: false,
        duration: '',
        category: 'general',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });

  } catch (err) {
    console.error('Post creation error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET endpoint to fetch posts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get('authorId');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Fetch all and filter in memory since we store post data in description
    let query = supabase
      .from('videos')
      .select('*')
      .is('video_url', '') // Posts have empty video_url
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (authorId) {
      query = query.eq('channel_id', authorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Filter to only include posts (those with _is_post in description)
    const posts = (data || []).filter((item: any) => {
      try {
        const desc = JSON.parse(item.description || '{}');
        return desc._is_post === true;
      } catch {
        return false;
      }
    });

    // Get channel IDs and fetch join_order from channels table
    const channelIds = [...new Set(posts.map((p: any) => p.channel_id).filter(Boolean))];
    let channelJoinOrders: Record<string, number> = {};
    
    if (channelIds.length > 0) {
      // Fetch join_order from Turso channels table
      const { turso } = await import('@/lib/turso');
      try {
        const placeholders = channelIds.map(() => '?').join(',');
        const channelResult = await turso.execute({
          sql: `SELECT id, join_order FROM channels WHERE id IN (${placeholders})`,
          args: channelIds
        });
        (channelResult.rows || []).forEach((row: any) => {
          if (row.join_order) {
            channelJoinOrders[row.id] = row.join_order;
          }
        });
      } catch (e) {
        console.warn('Failed to fetch join_order from channels:', e);
      }
    }

    // Add join_order to each post
    const postsWithJoinOrder = posts.map((post: any) => ({
      ...post,
      join_order: channelJoinOrders[post.channel_id] || null
    }));

    return NextResponse.json({ posts: postsWithJoinOrder }, { status: 200 });
  } catch (err) {
    console.error('Fetch posts error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
