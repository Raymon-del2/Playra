import { NextRequest, NextResponse } from 'next/server';
import { getVideoById } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await getVideoById(id);
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Return only necessary data for embed
    return NextResponse.json({
      id: video.id,
      title: video.title,
      description: video.description,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      channel_name: video.channel_name,
      channel_id: video.channel_id,
      channel_avatar: video.channel_avatar,
      content_type: video.content_type,
      is_post: video.is_post,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}
