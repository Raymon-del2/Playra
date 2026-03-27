import { turso } from '@/lib/turso';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, quizId, optionIndex, profileId, isCorrect } = body;

    console.log('Received Quiz Vote Request:', { postId, quizId, optionIndex, profileId, isCorrect });

    if (!postId || optionIndex === undefined || !profileId) {
      console.warn('Missing required fields for quiz vote');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 0. Auto-create tables if missing
    try {
        await turso.batch([
            `CREATE TABLE IF NOT EXISTS quizzes (
                id TEXT PRIMARY KEY,
                post_id TEXT,
                profile_id TEXT,
                question TEXT,
                options TEXT,
                correct_index INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS quiz_votes (
                id TEXT PRIMARY KEY,
                quiz_id TEXT,
                profile_id TEXT,
                selected_index INTEGER,
                is_correct INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(quiz_id, profile_id)
            )`,
            `CREATE TABLE IF NOT EXISTS quiz_analytics_logs (
                id TEXT PRIMARY KEY,
                quiz_id TEXT,
                log_content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ], "write");
    } catch (dbError) {
        console.warn('Database initialization warning (likely tables exist):', dbError);
    }

    // 1. Check if already voted in Turso
    const existingVote = await turso.execute({
      sql: 'SELECT id FROM quiz_votes WHERE quiz_id = ? AND profile_id = ?',
      args: [quizId || postId, profileId]
    });

    if (existingVote.rows.length > 0) {
      return NextResponse.json({ error: 'Already voted' }, { status: 400 });
    }

    // 2. Insert vote into Turso
    await turso.execute({
      sql: 'INSERT INTO quiz_votes (id, quiz_id, profile_id, selected_index, is_correct) VALUES (?, ?, ?, ?, ?)',
      args: [uuidv4(), quizId || postId, profileId, optionIndex, isCorrect ? 1 : 0]
    });

    // 3. Update Supabase JSON counts
    // First, get the current post
    const { data: post, error: fetchError } = await supabase
      .from('videos')
      .select('description, id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      console.error('Supabase fetch error for post:', fetchError);
      throw fetchError || new Error('Post not found');
    }

    console.log('Fetched Post for vote update:', post.id);

    let description: any = {};
    try {
        description = JSON.parse(post.description || '{}');
    } catch (e) {
        console.error('Failed to parse post description:', e);
        throw new Error('Malformed post data');
    }

    if (!description.votes) {
      description.votes = new Array(description.options?.length || 4).fill(0);
    }
    
    // Ensure the index is within bounds
    if (optionIndex < description.votes.length) {
        description.votes[optionIndex] = (description.votes[optionIndex] || 0) + 1;
    }

    const { error: updateError } = await supabase
      .from('videos')
      .update({ description: JSON.stringify(description) })
      .eq('id', postId);

    if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
    }

    // 4. Record as the specific string format requested in a log table
    const logString = `qz[${postId}] a.[${description.votes[0] || 0}] b.[${description.votes[1] || 0}] c.[${description.votes[2] || 0}] d.[${description.votes[3] || 0}]`;
    
    try {
        await turso.execute({
            sql: 'INSERT INTO quiz_analytics_logs (id, quiz_id, log_content) VALUES (?, ?, ?)',
            args: [uuidv4(), postId, logString]
        });
    } catch (logError) {
        console.warn('Failed to log analytics string, but vote was recorded:', logError);
    }

    return NextResponse.json({ success: true, votes: description.votes, log: logString });

  } catch (error: any) {
    console.error('Quiz vote error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
