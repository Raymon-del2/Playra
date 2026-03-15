'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchUserPlaylists, removeVideoFromPlaylist } from '@/app/actions/playlists';
import { getActiveProfile } from '@/app/actions/profile';
import { formatDistanceToNow } from 'date-fns';

interface PlaylistVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: string;
  views: number;
  created_at: string;
  category: string;
  is_live: boolean;
  channel_id: string;
  channel_name: string;
  channel_avatar: string;
  added_at: string;
}

interface Playlist {
  id: string;
  name: string;
  created_at: string;
  videos: PlaylistVideo[];
  videoCount: number;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getActiveProfile();
        if (profile) {
          setProfileId(profile.id);
          await loadPlaylists(profile.id);
        } else {
          router.push('/select-profile');
        }
      } else {
        router.push('/signin');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadPlaylists = async (uid: string) => {
    try {
      setIsLoading(true);
      const result = await fetchUserPlaylists(uid);
      if (result.success) {
        setPlaylists(result.playlists as Playlist[]);
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVideo = async (playlistId: string, videoId: string) => {
    try {
      const result = await removeVideoFromPlaylist(playlistId, videoId);
      if (result.success) {
        setPlaylists(prev => prev.map(playlist => {
          if (playlist.id === playlistId) {
            return {
              ...playlist,
              videos: playlist.videos.filter(v => v.id !== videoId),
              videoCount: playlist.videoCount - 1,
            };
          }
          return playlist;
        }));
      }
    } catch (error) {
      console.error('Failed to remove video from playlist:', error);
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return `${views}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pb-20">
        <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-white/10">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h12" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Playlists</h1>
                <p className="text-sm text-zinc-500">Loading...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 py-6">
          <div className="animate-pulse space-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-zinc-800 rounded w-48" />
                <div className="flex gap-4 overflow-x-auto">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex-shrink-0 w-64">
                      <div className="aspect-video bg-zinc-800 rounded-xl mb-2" />
                      <div className="h-4 bg-zinc-800 rounded w-3/4 mb-1" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h12" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Playlists</h1>
                <p className="text-sm text-zinc-500">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-6">
        {playlists.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No playlists yet</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-6">
              Create playlists while watching videos to organize your favorite content.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Browse Videos
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {playlists.map((playlist) => (
              <section key={playlist.id} className="space-y-4">
                {/* Playlist Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h12" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{playlist.name}</h2>
                      <p className="text-sm text-zinc-500">{playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {playlist.videoCount > 4 && (
                    <Link
                      href={`/playlist/${playlist.id}`}
                      className="text-sm text-green-400 hover:text-green-300 transition-colors"
                    >
                      View all
                    </Link>
                  )}
                </div>

                {/* Videos Grid - Horizontal Scroll */}
                {playlist.videos.length === 0 ? (
                  <div className="bg-zinc-800/50 rounded-xl p-6 text-center">
                    <p className="text-zinc-500 text-sm">No videos in this playlist yet.</p>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                    {playlist.videos.map((video) => (
                      <div key={video.id} className="group flex-shrink-0 w-64">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 mb-2">
                          <Link href={`/watch/${video.id}`}>
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>
                          {video.duration && video.duration !== '0:00' && video.duration !== '00:00' && video.duration !== '0' && (
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                              {video.duration}
                            </div>
                          )}
                          {video.is_live && (
                            <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              Live
                            </div>
                          )}

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveVideo(playlist.id, video.id)}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            title="Remove from playlist"
                          >
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <Link href={`/watch/${video.id}`}>
                          <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-green-400 transition-colors leading-snug mb-1">
                            {video.title}
                          </h3>
                        </Link>
                        <Link href={`/channel/${video.channel_id}`}>
                          <p className="text-xs text-zinc-400 hover:text-white transition-colors">
                            {video.channel_name}
                          </p>
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                          <span>{formatViews(video.views)} views</span>
                          <span>•</span>
                          <span>Added {formatDistanceToNow(new Date(video.added_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
