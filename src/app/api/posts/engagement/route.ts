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
        created_at TEXT DEFAULT (datetime('now')),
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
        created_at TEXT DEFAULT (datetime('now'))
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
      profile_name: null,
      profile_avatar: null,
    }));

    // Fetch real profile names from Turso channels table
    const profileIds = comments.map((c: any) => c.profile_id).filter(Boolean);
    if (profileIds.length > 0) {
      try {
        const placeholders = profileIds.map(() => '?').join(',');
        const channelResult = await turso.execute({
          sql: `SELECT id, name, avatar FROM channels WHERE id IN (${placeholders})`,
          args: profileIds
        });
        
        const channelMap = new Map((channelResult.rows || []).map((c: any) => [c.id, c]));
        comments.forEach((c: any) => {
          const channel = channelMap.get(c.profile_id);
          if (channel) {
            c.profile_name = channel.name || 'User';
            c.profile_avatar = channel.avatar;
          } else {
            c.profile_name = 'User';
          }
        });
      } catch (e) {
        console.warn('Failed to fetch channel names:', e);
        comments.forEach((c: any) => {
          c.profile_name = 'User';
        });
      }
    }

    // Check if user voted on quiz
    let userVotedIndex: number | null = null;
    if (profileId) {
      try {
        const quizVoteRes = await turso.execute({
          sql: `SELECT selected_index FROM quiz_votes WHERE quiz_id = ? AND profile_id = ?`,
          args: [postId, profileId],
        });
        if (quizVoteRes.rows?.[0]) {
          userVotedIndex = Number(quizVoteRes.rows[0].selected_index);
        }
      } catch (e) { /* ignore */ }
    }

    return NextResponse.json({ 
      likes: likesCount, 
      userLiked, 
      comments,
      currentUserId: profileId,
      userVotedIndex
    });
  } catch (error: any) {
    console.error('Post engagement error', error);
    return NextResponse.json({ likes: 0, userLiked: false, comments: [] });
  }
}

export async function POST(req: Request) {
  try {
    console.log('POST /api/posts/engagement called');
    
    await ensureTables();
    console.log('ensureTables done');
    
    const body = await req.json();
    const postId = body?.postId as string;
    const action = body?.action as string;
    console.log('body parsed:', { postId, action });

    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

    // Get profile directly
    console.log('calling getActiveProfile');
    const profile = await getActiveProfile();
    console.log('getActiveProfile result:', profile);
    
    if (!profile?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const profileId = profile.id;

    console.log('POST engagement - action:', action, 'postId:', postId, 'profileId:', profileId);

    if (action === 'like') {
      console.log('Like action - postId:', postId, 'profileId:', profileId);
      // Check if already liked
      const existing = await turso.execute({
        sql: `SELECT 1 FROM post_likes WHERE post_id = ? AND profile_id = ?`,
        args: [postId, profileId],
      });
      console.log('Existing likes:', existing.rows);

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
          sql: `INSERT INTO post_likes (post_id, profile_id, created_at) VALUES (?, ?, datetime('now'))`,
          args: [postId, profileId],
        });
        console.log('Like inserted for postId:', postId, 'profileId:', profileId);
        return NextResponse.json({ liked: true });
      }
    }

    if (action === 'comment') {
      const content = body?.content as string;
      if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

      const result = await turso.execute({
        sql: `INSERT INTO post_comments (post_id, profile_id, content, created_at) VALUES (?, ?, ?, datetime('now'))`,
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
