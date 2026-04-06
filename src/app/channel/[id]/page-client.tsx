'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getActiveProfile } from '@/app/actions/profile';
import { fetchUserPlaylists } from '@/app/actions/playlists';
import { getSubscriberCount } from '@/app/actions/subscription';
import { supabase, Video } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

type PlaylistVideo = {
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
};

type Playlist = {
  id: string;
  name: string;
  created_at: string;
  videos: PlaylistVideo[];
  videoCount: number;
};

type ChannelRecord = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  banner?: string | null;
  verified?: boolean;
  account_type?: string;
  created_at?: string;
};

export default function ChannelView({ params }: { params: Promise<{ id: string }> }) {
  const { id: channelId } = use(params);
  const router = useRouter();
  const [channel, setChannel] = useState<ChannelRecord | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<'Home' | 'Playlists' | 'Posts'>('Home');
  const [channelSearch, setChannelSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);



  const handle = useMemo(() => {
    if (!channel?.name) return '';
    return `@${channel.name.replace(/^@+/, '').replace(/\s+/g, '').toLowerCase()}`;
  }, [channel?.name]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const profile = await getActiveProfile();
        setIsOwner(Boolean(profile?.id === channelId));

        // Fetch channel record
        const res = await fetch(`/api/channel/${channelId}`);
        if (res.ok) {
          const json = await res.json();
          setChannel(json.channel);
        } else if (res.status === 404) {
          router.replace('/');
          return;
        }

        // Fetch channel videos
        const { data, error } = await supabase!
          .from('videos')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Error fetching channel videos', error);
        } else {
          setVideos(data || []);
        }

        // Fetch subscriber count
        try {
          const count = await getSubscriberCount(channelId);
          console.log('Channel subscriber count:', count);
          setSubscriberCount(count);
        } catch (err) {
          console.error('Error fetching subscriber count:', err);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [channelId, router]);

  // Load playlists when Playlists tab is selected
  useEffect(() => {
    if (activeTab === 'Playlists' && channelId) {
      const loadPlaylists = async () => {
        setLoadingPlaylists(true);
        try {
          const result = await fetchUserPlaylists(channelId);
          if (result.success) {
            setPlaylists(result.playlists as Playlist[]);
          }
        } catch (err) {
          console.error('Error loading playlists:', err);
        } finally {
          setLoadingPlaylists(false);
        }
      };
      loadPlaylists();
    }
  }, [activeTab, channelId]);

  const filteredVideos = channelSearch.trim()
    ? videos.filter(v => v.title.toLowerCase().includes(channelSearch.toLowerCase()))
    : videos;

  const filteredPlaylists = channelSearch.trim()
    ? playlists.filter(p => p.name.toLowerCase().includes(channelSearch.toLowerCase()))
    : playlists;

  const onBannerFile = async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBannerPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const saveBanner = async () => {
    if (!bannerPreview || !channelId) return;
    setSavingBanner(true);
    try {
      const res = await fetch(`/api/channel/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner: bannerPreview }),
      });
      if (res.ok) {
        setChannel((prev) => (prev ? { ...prev, banner: bannerPreview } : prev));
        setShowCustomize(false);
      } else {
        console.error('Failed to save banner', await res.text());
      }
    } catch (err) {
      console.error('Save banner error', err);
    } finally {
      setSavingBanner(false);
    }
  };

  const bannerUrl = bannerPreview || channel?.banner || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-black text-white">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-black text-white">
        <h1 className="text-2xl font-bold">Channel not found</h1>
        <button
          className="px-6 py-2 bg-white text-black rounded-full font-bold"
          onClick={() => router.replace('/')}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Banner */}
      <div className="relative w-full">
        <div
          className="h-48 sm:h-60 md:h-72 w-full bg-gradient-to-r from-blue-900/60 via-purple-800/50 to-black rounded-b-3xl border-b border-white/5"
          style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
        {isOwner && (
          <button
            onClick={() => setShowCustomize(true)}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white text-black rounded-full font-bold text-sm shadow-lg hover:bg-zinc-200 active:scale-95 transition-all"
          >
            Customize channel
          </button>
        )}
      </div>

      {/* Header */}
      <div className="max-w-[1284px] mx-auto px-4 md:px-6 pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
          <div className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/10 shadow-2xl -mt-16 sm:-mt-20 relative z-10">
            {channel.avatar ? (
              <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-500">
                {channel.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
            <h1 className="text-[24px] sm:text-[36px] font-black leading-tight mb-1 flex items-center gap-2">
              {channel.name}
              <img src="/verified-badge.ico" alt="Verified" className="w-5 h-5 sm:w-6 sm:h-6" />
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-2 text-[14px] text-zinc-400 font-medium mb-3">
              <span className="text-white font-bold">{handle}</span>
              <span>•</span>
              <span>{subscriberCount === 1 ? '1 subscriber' : `${subscriberCount} subscribers`}</span>
              <span>•</span>
              <span>{videos.length} videos</span>
            </div>
            <div className="text-[14px] text-zinc-400 mb-6 max-w-2xl group cursor-default">
              {channel.description || 'No channel description yet.'}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Link href="/studio/content">
                <button className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-bold transition-colors">
                  Manage videos
                </button>
              </Link>
              {isOwner && (
                <button
                  onClick={() => setShowCustomize(true)}
                  className="h-9 px-4 bg-white text-black hover:bg-zinc-200 rounded-full text-sm font-bold transition-colors"
                >
                  Customize channel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-white/10">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-full px-4 py-2 max-w-md">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                placeholder="Search channel"
                className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 outline-none"
              />
              {channelSearch && (
                <button onClick={() => setChannelSearch('')} className="text-zinc-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
            {['Home', 'Playlists', 'Posts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm sm:text-[15px] font-bold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="py-8">
          {activeTab === 'Home' && (
            filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {filteredVideos.map((video) => (
                  <Link key={video.id} href={video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`} className="flex flex-col gap-2 group">
                    <div className={`relative bg-zinc-800 rounded-xl overflow-hidden ${video.is_short ? 'aspect-[9/16]' : 'aspect-video'} shadow-lg border border-white/5`}>
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      {video.duration && !video.is_short && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {video.duration}
                        </div>
                      )}
                      {video.is_short && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
                          <img src="/styles-icon.svg?v=white" className="w-4 h-4 drop-shadow-md" alt="" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-white font-bold text-[14px] leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {video.title}
                      </h3>
                      <div className="text-zinc-400 text-[12px] font-medium flex items-center gap-1">
                        <span>{video.views} views</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-20">
                <div className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                  <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Upload a video to get started</h3>
                <p className="text-zinc-400 mb-8 max-w-sm leading-relaxed text-sm">
                  Start sharing your story and connecting with viewers. Videos you upload will show up here.
                </p>
                <Link href="/studio/content">
                  <button className="bg-white hover:bg-zinc-200 text-black px-8 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg">
                    Create Video
                  </button>
                </Link>
              </div>
            )
          )}

          {activeTab === 'Playlists' && (
            loadingPlaylists ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : filteredPlaylists.length > 0 ? (
              <div className="space-y-8">
                {filteredPlaylists.map((playlist) => (
                  <div key={playlist.id} className="space-y-3">
                    {/* Playlist Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">{playlist.name}</h3>
                        <span className="text-sm text-zinc-500">{playlist.videoCount} videos</span>
                      </div>
                      <Link
                        href={`/playlist/${playlist.id}`}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View all
                      </Link>
                    </div>

                    {/* Playlist Videos - Horizontal Scroll */}
                    {playlist.videos.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                        {playlist.videos.map((video) => (
                          <Link
                            key={video.id}
                            href={`/watch/${video.id}`}
                            className="group flex-shrink-0 w-64"
                          >
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 mb-2">
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {video.duration && video.duration !== '0:00' && video.duration !== '00:00' && (
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                  {video.duration}
                                </div>
                              )}
                              {video.is_live && (
                                <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                  Live
                                </div>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                              {video.title}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-1">
                              {video.views} views • {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm">No videos in this playlist</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-20">
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
                  <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No playlists yet</h3>
                <p className="text-zinc-400 max-w-sm">
                  Create playlists while watching videos to organize your content.
                </p>
              </div>
            )
          )}

          {activeTab === 'Posts' && (
            <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
                <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <p className="font-medium text-lg mb-2">Posts coming soon</p>
              <p className="text-zinc-500">Share updates with your community</p>
            </div>
          )}
        </div>
      </div>

      {/* Customize Banner Modal */}
      {showCustomize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Customize channel banner</h3>
              <button onClick={() => setShowCustomize(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 aspect-[16/5] flex items-center justify-center">
                {bannerPreview || channel?.banner ? (
                  <img src={bannerPreview || channel?.banner || ''} className="w-full h-full object-cover" alt="Banner preview" />
                ) : (
                  <div className="text-zinc-500 text-sm">Add a background image like YouTube channel art</div>
                )}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-sm cursor-pointer hover:bg-zinc-200 active:scale-95 transition">
                Upload banner
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onBannerFile(e.target.files?.[0])}
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-white/5 flex justify-end gap-2">
              <button
                onClick={() => setShowCustomize(false)}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveBanner}
                disabled={savingBanner || !bannerPreview}
                className="px-4 py-2 rounded-full text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {savingBanner ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
