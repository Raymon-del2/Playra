import { NextResponse } from 'next/server';
import { engagementSupabase } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: channelId } = await params;
  if (!channelId) {
    return NextResponse.json({ error: 'channel id required' }, { status: 400 });
  }

  try {
    // Get channel from profiles table in Supabase
    const { data: profile, error } = await engagementSupabase
      .from('profiles')
      .select('id, name, description, avatar, banner, verified, account_type, created_at')
      .eq('id', channelId)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ channel: profile });
  } catch (error) {
    console.error('Failed to fetch channel', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: channelId } = await params;
  if (!channelId) {
    return NextResponse.json({ error: 'channel id required' }, { status: 400 });
  }

  // Owner check via active profile cookie
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/playra_active_profile=([^;]+)/);
  const activeProfileId = match ? decodeURIComponent(match[1]) : null;
  if (!activeProfileId || activeProfileId !== channelId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const banner = body?.banner as string | null;
  if (!banner) {
    return NextResponse.json({ error: 'banner required' }, { status: 400 });
  }

  try {
    await engagementSupabase
      .from('profiles')
      .update({ banner })
      .eq('id', channelId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update channel banner', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
