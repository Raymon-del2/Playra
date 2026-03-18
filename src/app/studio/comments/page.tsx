'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getActiveProfile } from '@/app/actions/profile';
import { getUserComments, getUserCommentCount, type UserCommentWithVideo } from '@/app/actions/user-comments';

export default function StudioCommentsPage() {
  const [comments, setComments] = useState<UserCommentWithVideo[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getActiveProfile();
        setActiveProfile(profile);

        if (profile) {
          const [userComments, count] = await Promise.all([
            getUserComments(profile.id),
            getUserCommentCount(profile.id)
          ]);
          setComments(userComments);
          setCommentCount(count);
        }
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-8 text-white w-full max-w-full overflow-x-hidden pb-24 lg:pb-8">
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 text-white w-full max-w-full overflow-x-hidden pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Your Comments</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'} across all videos
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm border border-white/10 transition-colors"
        >
          Browse videos
        </Link>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.comment_id}
              className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-colors"
            >
              {/* Video Info */}
              <Link
                href={comment.is_short ? `/styles/${comment.video_id}` : `/watch/${comment.video_id}`}
                className="flex gap-3 mb-4 pb-4 border-b border-white/5"
              >
                <div className="w-24 aspect-video bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                  {comment.video_thumbnail ? (
                    <img
                      src={comment.video_thumbnail}
                      alt={comment.video_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white line-clamp-2">{comment.video_title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">by {comment.video_channel_name}</p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 uppercase tracking-wide">
                    {comment.is_short ? 'Style' : 'Video'}
                  </span>
                </div>
              </Link>

              {/* Comment Content */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {activeProfile?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{activeProfile?.name || 'You'}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.content}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.043.493-.065.972-.358 1.373-.228.313-.536.546-.894.707l-2.09.896c-.326.14-.634.317-.92.527-.586.434-1.264.734-1.993.891l-.108.022c-.688.14-1.402.107-2.07-.098l-.168-.052a2.25 2.25 0 01-1.52-1.76l-.078-.328a2.25 2.25 0 00-1.826-1.776l-.158-.024a6.5 6.5 0 01-3.697-2.366A9.966 9.966 0 006.633 10.5z" />
                      </svg>
                      {comment.likes}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a2.501 2.501 0 011.358-1.373l2.09-.896c.326-.14.634-.317.92-.527a6.501 6.501 0 011.993-.89l.108-.022c.688-.14 1.402-.107 2.07.098l.168.052a2.25 2.25 0 011.52 1.76l.078.328a2.25 2.25 0 001.826 1.776l.158.024a6.5 6.5 0 013.697 2.366 9.966 9.966 0 00.637 1.957c.14.355.186.735.14 1.097-.047.37-.187.722-.416 1.02-.23.297-.54.528-.896.675l-1.172.503c-.326.14-.633.318-.92.527-.585.434-1.263.735-1.992.891l-.107.022c-.688.14-1.402.107-2.07-.098l-.168-.052a2.25 2.25 0 01-1.52-1.76l-.078-.328a2.25 2.25 0 00-1.826-1.776l-.158-.024a6.501 6.501 0 01-3.697-2.366A9.966 9.966 0 017.498 15.25z" />
                      </svg>
                      {comment.dislikes}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <p className="text-zinc-400 text-lg mb-2">No comments yet</p>
          <p className="text-zinc-500 text-sm mb-6 max-w-md">
            Start engaging with videos you watch by leaving comments. Your comments will appear here.
          </p>
          <Link
            href="/"
            className="px-6 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            Browse videos
          </Link>
        </div>
      )}
    </div>
  );
}
