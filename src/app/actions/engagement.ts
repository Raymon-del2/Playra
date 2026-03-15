'use server';

import { likeVideo, unlikeVideo, dislikeVideo, undislikeVideo, getVideoEngagement, getBatchVideoEngagement } from '@/lib/engagement';

// ... (existing functions)

export async function fetchBatchVideoEngagement(videoIds: string[], userId?: string) {
  try {
    const data = await getBatchVideoEngagement(videoIds, userId);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching batch engagement:', error);
    return { success: false, error: 'Failed' };
  }
}

export async function toggleLikeVideo(videoId: string, userId: string, isCurrentlyLiked: boolean) {
  try {
    if (isCurrentlyLiked) {
      const newCount = await unlikeVideo(videoId, userId);
      return { success: true, liked: false, likes: newCount };
    } else {
      const newCount = await likeVideo(videoId, userId);
      return { success: true, liked: true, likes: newCount };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, error: 'Failed to update like' };
  }
}

export async function toggleDislikeVideo(videoId: string, userId: string, isCurrentlyDisliked: boolean) {
  try {
    if (isCurrentlyDisliked) {
      const newCount = await undislikeVideo(videoId, userId);
      return { success: true, disliked: false, likes: newCount };
    } else {
      const newCount = await dislikeVideo(videoId, userId);
      return { success: true, disliked: true, likes: newCount };
    }
  } catch (error) {
    console.error('Error toggling dislike:', error);
    return { success: false, error: 'Failed to update dislike' };
  }
}

export async function fetchVideoEngagement(videoId: string, userId?: string, channelId?: string) {
  try {
    const engagement = await getVideoEngagement(videoId, userId, channelId);
    return { success: true, ...engagement };
  } catch (error) {
    console.error('Error fetching engagement:', error);
    return { success: false, error: 'Failed to fetch engagement' };
  }
}
