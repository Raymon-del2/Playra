'use strict';
import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { getActiveProfile } from '@/app/actions/profile';
import { supabase } from '@/lib/supabase';

async function ensureTables() {
  // Create post_likes table if not exists (PostgreSQL syntax)
  try {
    await turso.execute({
      sql: `CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(post_id, profile_id)
      )`,
      args: []
    });
  } catch (e) { /* ignore */ }
  
  // Create post_comments table if not exists
  try {
    await turso.execute({
      sql: `CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      args: []
    });
  } catch (e) { /* ignore */ }
}

async function getProfile() {
  const profile = await getActiveProfile();
  if (!profile?.id) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return profile.id;
}

export async function GET(req: Request) {
  try {
    await ensureTables();
    
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

    // Try to get profile, but don't fail if not logged in
    let profileId: string | null = null;
    try {
      const profile = await getActiveProfile();
      profileId = profile?.id || null;
    } catch (e) { profileId = null; }
    
    const likesRes = await turso.execute({
      sql: `SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?`,
      args: [postId],
    });
    const likesCount = Number(likesRes.rows?.[0]?.count || 0);

    let userLiked = false;
    if (profileId) {
      const userLikeRes = await turso.execute({
        sql: `SELECT 1 FROM post_likes WHERE post_id = ? AND profile_id = ?`,
        args: [postId, profileId],
      });
      userLiked = (userLikeRes.rows?.length || 0) > 0;
    }

    // Get comments
    const commentsRes = await turso.execute({
      sql: `SELECT id, content, created_at, profile_id 
            FROM post_comments 
            WHERE post_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50`,
      args: [postId],
    });

    const comments = (commentsRes.rows || []).map((r: any) => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      profile_id: r.profile_id,
      profile_name: 'User',
      profile_avatar: null,
    }));

    // Fetch real profile names from Supabase
    const profileIds = comments.map((c: any) => c.profile_id).filter(Boolean);
    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', profileIds);
      
      if (profiles) {
        const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
        comments.forEach((c: any) => {
          const profile = profileMap.get(c.profile_id);
          if (profile) {
            c.profile_name = profile.name || 'User';
            c.profile_avatar = profile.avatar;
          }
        });
      }
    }

    return NextResponse.json({ 
      likes: likesCount, 
      userLiked, 
      comments,
      currentUserId: profileId 
    });
  } catch (error: any) {
    console.error('Post engagement error', error);
    return NextResponse.json({ likes: 0, userLiked: false, comments: [] });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTables();
    const profileId = await getProfile();
    const body = await req.json();
    const postId = body?.postId as string;
    const action = body?.action as string;

    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

    if (action === 'like') {
      // Check if already liked
      const existing = await turso.execute({
        sql: `SELECT 1 FROM post_likes WHERE post_id = ? AND profile_id = ?`,
        args: [postId, profileId],
      });

      if (existing.rows?.length > 0) {
        // Unlike
        await turso.execute({
          sql: `DELETE FROM post_likes WHERE post_id = ? AND profile_id = ?`,
          args: [postId, profileId],
        });
        return NextResponse.json({ liked: false });
      } else {
        // Like
        await turso.execute({
          sql: `INSERT INTO post_likes (post_id, profile_id, created_at) VALUES (?, ?, NOW())`,
          args: [postId, profileId],
        });
        return NextResponse.json({ liked: true });
      }
    }

    if (action === 'comment') {
      const content = body?.content as string;
      if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

      const result = await turso.execute({
        sql: `INSERT INTO post_comments (post_id, profile_id, content, created_at) VALUES (?, ?, ?, NOW())`,
        args: [postId, profileId, content.trim()],
      });

      return NextResponse.json({ ok: true, commentId: result.lastInsertRowid });
    }

    if (action === 'deleteComment') {
      const commentId = body?.commentId as number;
      if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 });

      // Only allow deleting own comments
      await turso.execute({
        sql: `DELETE FROM post_comments WHERE id = ? AND profile_id = ?`,
        args: [commentId, profileId],
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Post engagement error', error);
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
