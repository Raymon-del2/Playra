import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: channelId } = await params;
  if (!channelId) {
    return NextResponse.json({ error: 'channel_id required' }, { status: 400 });
  }

  try {
    // Get avatar from profiles table in Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('avatar')
      .eq('id', channelId)
      .maybeSingle();

    const avatar = profile?.avatar || null;

    // Sync into Supabase videos so subsequent fetches use the fresh avatar
    if (avatar) {
      await supabase
        .from('videos')
        .update({ channel_avatar: avatar })
        .eq('channel_id', channelId);
    }

    return NextResponse.json({ avatar });
  } catch (error) {
    console.error('Failed to fetch channel avatar', error);
    return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 });
  }
}
