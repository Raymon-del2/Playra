import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('community_messages')
      .select('id, type, message, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Community GET error', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = body?.type === 'feature' ? 'feature' : 'problem';
    const message = (body?.message || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await supabase.from('community_messages').insert({
      id: uuidv4(),
      type,
      message
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Community POST error', error);
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await supabase.from('community_messages').delete().eq('id', id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Community DELETE error', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
