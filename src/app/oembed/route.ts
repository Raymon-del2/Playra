import { NextRequest, NextResponse } from 'next/server';
import { getVideoById } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  try {
    // Extract video ID from URL patterns:
    // - https://playra.vercel.app/watch/VIDEO_ID
    // - https://playra.vercel.app/embed/VIDEO_ID
    // - https://playra.app/watch/VIDEO_ID
    // - https://playra.app/embed/VIDEO_ID
    const watchMatch = url.match(/watch\/([a-zA-Z0-9-]+)/);
    const embedMatch = url.match(/embed\/([a-zA-Z0-9-]+)/);
    const videoId = watchMatch?.[1] || embedMatch?.[1];

    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid Playra URL' },
        { status: 404 }
      );
    }

    const video = await getVideoById(videoId);

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const embedUrl = `https://playra.vercel.app/embed/${video.id}`;
    const thumbnailUrl = video.thumbnail_url || 'https://playra.vercel.app/logo.png';

    const oembedResponse = {
      type: 'video',
      version: '1.0',
      title: video.title,
      author_name: video.channel_name || 'Playra',
      author_url: `https://playra.vercel.app/channel/${video.channel_id}`,
      provider_name: 'Playra',
      provider_url: 'https://playra.vercel.app',
      thumbnail_url: thumbnailUrl,
      thumbnail_width: 1280,
      thumbnail_height: 720,
      html: `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
      width: 560,
      height: 315,
    };

    return NextResponse.json(oembedResponse, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('oEmbed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
