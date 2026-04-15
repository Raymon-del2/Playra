'use strict';
import { NextResponse } from 'next/server';
import { getActiveProfile } from '@/app/actions/profile';
import { supabase } from '@/lib/supabase';

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

    // Try to get profile, but don't fail if not logged in
    let profileId: string | null = null;
    try {
      const profile = await getActiveProfile();
      profileId = profile?.id || null;
    } catch (e) { profileId = null; }
    
    // Get likes count from Supabase
    const { count: likesCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    let userLiked = false;
    if (profileId) {
      const { data: userLikeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('profile_id', profileId)
        .limit(1);
      userLiked = !!userLikeData?.length;
    }

    // Get comments from Supabase
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('id, content, created_at, profile_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(50);

    const comments = (commentsData || []).map((r: any) => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      profile_id: r.profile_id,
      profile_name: null,
      profile_avatar: null,
    }));

    // Fetch real profile names from Supabase channels table
    const profileIds = comments.map((c: any) => c.profile_id).filter(Boolean);
    if (profileIds.length > 0) {
      try {
        const { data: channelData } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .in('id', profileIds);
        
        const channelMap = new Map((channelData || []).map((c: any) => [c.id, c]));
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

    // Check if user voted on poll or quiz
    let userVotedIndex: number | null = null;
    let userQuizAnswer: number | null = null;
    if (profileId) {
      try {
        const { data: quizVoteData } = await supabase
          .from('quiz_votes')
          .select('selected_index')
          .eq('quiz_id', postId)
          .eq('profile_id', profileId)
          .limit(1);
        if (quizVoteData?.[0]) {
          userQuizAnswer = Number(quizVoteData[0].selected_index);
        }
      } catch (e) { /* ignore */ }
      
      // Also check poll_votes table
      try {
        const { data: pollVoteData } = await supabase
          .from('poll_votes')
          .select('selected_index')
          .eq('post_id', postId)
          .eq('profile_id', profileId)
          .limit(1);
        if (pollVoteData?.[0]) {
          userVotedIndex = Number(pollVoteData[0].selected_index);
        }
      } catch (e) { /* table might not exist */ }
    }

    return NextResponse.json({ 
      likes: likesCount, 
      userLiked, 
      comments,
      currentUserId: profileId,
      userVotedIndex,
      userQuizAnswer
    });
  } catch (error: any) {
    console.error('Post engagement error', error);
    return NextResponse.json({ likes: 0, userLiked: false, comments: [] });
  }
}

export async function POST(req: Request) {
  try {
    console.log('POST /api/posts/engagement called');
    
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
      const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('profile_id', profileId)
        .limit(1);
      console.log('Existing likes:', existing);

      if (existing && existing.length > 0) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('profile_id', profileId);
        return NextResponse.json({ liked: false });
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, profile_id: profileId });
        console.log('Like inserted for postId:', postId, 'profileId:', profileId);
        return NextResponse.json({ liked: true });
      }
    }

    if (action === 'comment') {
      const content = body?.content as string;
      if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

      const { data: result, error: insertError } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, profile_id: profileId, content: content.trim() })
        .select()
        .single();

      if (insertError) {
        console.error('Comment insert error:', insertError);
        return NextResponse.json({ error: 'Failed to insert comment' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, commentId: result?.id });
    }

    if (action === 'deleteComment') {
      const commentId = body?.commentId as string;
      if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 });

      // Only allow deleting own comments
      await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('profile_id', profileId);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Post engagement error', error);
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
