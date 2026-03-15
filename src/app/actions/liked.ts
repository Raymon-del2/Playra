'use server';

import { getLikedVideos as getLikedVideosFromLib, unlikeVideo as unlikeVideoFromLib } from '@/lib/engagement';

export async function fetchLikedVideos(userId: string) {
  try {
    console.log('[fetchLikedVideos] Fetching likes for userId:', userId);
    const videos = await getLikedVideosFromLib(userId);
    console.log('[fetchLikedVideos] Found', videos.length, 'liked videos');
    return { success: true, videos };
  } catch (error) {
    console.error('[fetchLikedVideos] Error fetching liked videos:', error);
    return { success: false, error: 'Failed to fetch liked videos' };
  }
}

export async function removeLike(videoId: string, userId: string) {
  try {
    const newCount = await unlikeVideoFromLib(videoId, userId);
    return { success: true, newCount };
  } catch (error) {
    console.error('Error removing like:', error);
    return { success: false, error: 'Failed to remove like' };
  }
}
