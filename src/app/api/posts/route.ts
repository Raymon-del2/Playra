import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Auto-migrate on first request
let migrated = false;

async function ensureMigrated() {
  if (migrated) return;
  try {
    await fetch('http://localhost:3000/api/migrate');
    migrated = true;
  } catch (e) {
    console.log('Migration check skipped');
  }
}

export async function POST(request: Request) {
  // Ensure columns exist
  await ensureMigrated();
  
  // 1. Auth Check: Ensure only logged-in users can post
  // Note: This will be handled by RLS policies in Supabase
  // const { data: { session } } = await supabase.auth.getSession();
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

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

    // 4. Insert into Supabase
    const { data, error } = await supabase
      .from('videos')
      .insert({
        channel_id: profile.id,
        channel_name: profile.name,
        channel_avatar: profile.avatar || '',
        post_type,
        visibility: visibility || 'public',
        is_post: true,
        content_type: 'post',
        title: content.text?.substring(0, 100) || 'Community Post',
        description: JSON.stringify(finalContent),
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
    let query = supabase
      .from('videos')
      .select('*')
      .eq('is_post', true)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (authorId) {
      query = query.eq('channel_id', authorId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ posts: data }, { status: 200 });
  } catch (err) {
    console.error('Fetch posts error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
