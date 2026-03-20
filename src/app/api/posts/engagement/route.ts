'use strict';
import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { getActiveProfile } from '@/app/actions/profile';

async function getProfile() {
  const profile = await getActiveProfile();
  if (!profile?.id) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return profile.id;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

    // Get likes count and if current user liked
    const profileId = await getProfile().catch(() => null);
    
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
      sql: `SELECT c.id, c.content, c.created_at, p.name as profile_name, p.avatar_url 
            FROM post_comments c 
            LEFT JOIN profiles p ON c.profile_id = p.id 
            WHERE c.post_id = ? 
            ORDER BY c.created_at DESC 
            LIMIT 50`,
      args: [postId],
    });

    const comments = (commentsRes.rows || []).map((r: any) => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      profile_name: r.profile_name,
      profile_avatar: r.avatar_url,
    }));

    return NextResponse.json({ 
      likes: likesCount, 
      userLiked, 
      comments 
    });
  } catch (error: any) {
    console.error('Post engagement error', error);
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to load engagement' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
          sql: `INSERT INTO post_likes (post_id, profile_id, created_at) VALUES (?, ?, datetime('now'))`,
          args: [postId, profileId],
        });
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

      return NextResponse.json({ ok: true, commentId: result.lastInsertedRowid });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Post engagement error', error);
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
