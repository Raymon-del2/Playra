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
          options: content.options,
          poll_type: content.poll_type || 'text',
          votes: new Array(content.options.length).fill(0),
        };
        break;
      case 'quiz':
        finalContent = {
          question: content.question,
          options: content.options,
          correct_index: content.correct_index,
          votes: new Array(content.options.length).fill(0),
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

    // 5. If it's a quiz, also insert into Turso
    if (post_type === 'quiz') {
      try {
        const { turso } = await import('@/lib/turso');
        const { v4: uuidv4 } = await import('uuid');
        await turso.execute({
          sql: 'INSERT INTO quizzes (id, post_id, profile_id, question, options, correct_index) VALUES (?, ?, ?, ?, ?, ?)',
          args: [
            uuidv4(),
            data.id,
            profile.id,
            content.question,
            JSON.stringify(content.options),
            content.correct_index
          ]
        });
      } catch (tursoError) {
        console.error('Failed to sync quiz to Turso:', tursoError);
        // We continue since the Supabase part succeeded
      }
    }

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
    // Fetch only posts - filter by description containing _is_post
    let query = supabase
      .from('videos')
      .select('id, channel_id, channel_name, channel_avatar, title, description, thumbnail_url, created_at')
      .eq('video_url', '')
      .ilike('description', '%"_is_post":true%')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (authorId) {
      query = query.eq('channel_id', authorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    const posts = data || [];

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
