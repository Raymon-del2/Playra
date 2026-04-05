import { NextResponse } from 'next/server';
import {
  ensureEngagementTables,
  listPlaylists,
  listWatchLater,
  addWatchLater,
  removeWatchLater,
  addPlaylistItem,
  removePlaylistItem,
  createPlaylist,
  listPlaylistItems,
} from '@/lib/engagement';
import { getActiveProfile } from '@/app/actions/profile';

async function requireProfile() {
  const profile = await getActiveProfile();
  if (!profile?.id) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return profile.id;
}

export async function GET(req: Request) {
  try {
    const profileId = await requireProfile();
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    await ensureEngagementTables();

    const playlists = await listPlaylists(profileId);
    const playlistIds = playlists.map((p: any) => p.id);

    let playlistMap = new Map<string, boolean>();
    if (playlistIds.length > 0) {
      // Check which playlists contain this video using Supabase
      for (const pid of playlistIds) {
        const items = await listPlaylistItems(pid);
        const hasVideo = (items || []).some((item: any) => item.video_id === videoId);
        playlistMap.set(pid, hasVideo);
      }
    }

    const wl = await listWatchLater(profileId);
    const watchLaterSaved = (wl || []).some((row: any) => row.video_id === videoId);

    return NextResponse.json({
      watchLater: watchLaterSaved,
      playlists: (playlists || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        hasVideo: playlistMap.get(p.id) || false,
        created_at: p.created_at,
      })),
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Save status error', error);
    return NextResponse.json({ error: 'Failed to load save status' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profileId = await requireProfile();
    const body = await req.json();
    const videoId = body?.videoId as string;
    const playlistId = body?.playlistId as string | undefined;
    const newPlaylistName = body?.name as string | undefined;
    const target = body?.target as 'watch_later' | 'playlist';
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    await ensureEngagementTables();

    if (target === 'watch_later') {
      await addWatchLater(profileId, videoId);
      return NextResponse.json({ ok: true });
    }

    if (target === 'playlist') {
      let pid = playlistId;
      if (!pid) {
        if (!newPlaylistName) return NextResponse.json({ error: 'name required for new playlist' }, { status: 400 });
        const result = await createPlaylist(profileId, newPlaylistName.trim());
        pid = result?.id;
      }
      if (!pid) return NextResponse.json({ error: 'playlistId missing' }, { status: 400 });
      await addPlaylistItem(pid, videoId);
      return NextResponse.json({ ok: true, playlistId: pid });
    }

    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Save add error', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const profileId = await requireProfile();
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const target = searchParams.get('target');
    const playlistId = searchParams.get('playlistId') || undefined;

    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });
    await ensureEngagementTables();

    if (target === 'watch_later') {
      await removeWatchLater(profileId, videoId);
      return NextResponse.json({ ok: true });
    }

    if (target === 'playlist') {
      if (!playlistId) return NextResponse.json({ error: 'playlistId required' }, { status: 400 });
      await removePlaylistItem(playlistId, videoId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Save delete error', error);
    return NextResponse.json({ error: 'Failed to delete save' }, { status: 500 });
  }
}
