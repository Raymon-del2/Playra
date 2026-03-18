'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getActiveProfile } from '@/app/actions/profile';
import { supabase, type Video } from '@/lib/supabase';

export default function StudioAnalyticsPage() {
  const contentTabs = ['Videos', 'Styles', 'Posts'] as const;
  const [activeContentTab, setActiveContentTab] = useState<(typeof contentTabs)[number]>('Videos');
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [contentItems, setContentItems] = useState<Video[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // Real stats calculated from actual content
  const totalViews = useMemo(() => contentItems.reduce((sum, item) => sum + (item.views ?? 0), 0), [contentItems]);
  const totalWatchTime = useMemo(() => {
    // Estimate watch time: views * average duration (assuming 60% watch rate)
    return contentItems.reduce((sum, item) => {
      const views = item.views ?? 0;
      const duration = item.duration ?? 0;
      return sum + (views * duration * 0.6 / 3600); // Convert to hours
    }, 0).toFixed(1);
  }, [contentItems]);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getActiveProfile();
        setActiveProfile(profile);

        if (profile && supabase) {
          const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('channel_id', profile.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setContentItems(data || []);
        }
      } catch (err) {
        console.error('Error loading analytics content', err);
      } finally {
        setIsLoadingContent(false);
      }
    };

    load();
  }, []);

  const filteredContent = useMemo(() => {
    if (activeContentTab === 'Videos') return contentItems.filter((v) => !v.is_short && !v.is_post && !v.is_live);
    if (activeContentTab === 'Styles') return contentItems.filter((v) => v.is_short);
    if (activeContentTab === 'Posts') return contentItems.filter((v) => v.is_post);
    return [];
  }, [activeContentTab, contentItems]);

  const emptyCtaLabel =
    activeContentTab === 'Posts' ? 'Create post' : activeContentTab === 'Styles' ? 'Upload style' : 'Upload video';

  return (
    <div className="min-h-screen p-4 sm:p-8 text-white w-full max-w-full overflow-x-hidden pb-24 lg:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Channel analytics</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <div className="rounded-full border border-white/10 px-3 py-1.5">Last 28 days</div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4 sm:p-6">
          <p className="text-xs text-zinc-400 mb-1">Total views</p>
          <p className="text-2xl sm:text-3xl font-bold">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4 sm:p-6">
          <p className="text-xs text-zinc-400 mb-1">Watch time (hours)</p>
          <p className="text-2xl sm:text-3xl font-bold">{totalWatchTime}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4 sm:p-6">
          <p className="text-xs text-zinc-400 mb-1">Total content</p>
          <p className="text-2xl sm:text-3xl font-bold">{contentItems.length}</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-8 bg-[#121212] rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs sm:text-sm text-zinc-400">Your content</p>
            <h2 className="text-lg sm:text-xl font-bold">Videos, Styles, and Posts</h2>
          </div>
          <Link
            href="/studio/content"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs sm:text-sm border border-white/10 transition-colors"
          >
            Go to Content
          </Link>
        </div>

        <div className="flex gap-4 mb-6 text-sm overflow-x-auto">
          {contentTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveContentTab(tab)}
              className={`pb-2 border-b-2 transition-colors whitespace-nowrap ${activeContentTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoadingContent ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : filteredContent.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContent.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-[#1a1a1a] p-3 sm:p-4 flex gap-3 hover:border-white/20 transition-colors"
              >
                <div className="w-20 sm:w-28 aspect-video rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 relative">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-zinc-600 text-xs">No thumbnail</div>
                  )}
                  <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 border border-white/10 uppercase tracking-tight">
                    {item.is_post ? 'Post' : item.is_short ? 'Style' : item.is_live ? 'Live' : 'Video'}
                  </span>
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <p className="text-xs sm:text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-[10px] sm:text-xs text-zinc-400 truncate">{item.description || 'No description yet'}</p>
                  <div className="text-[10px] sm:text-[11px] text-zinc-500 uppercase tracking-tight flex gap-2 sm:gap-3 mt-auto">
                    <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-4-4L6.447 7.724A1 1 0 005 8.618v6.764a1 1 0 001.447.894L11 14" />
                      </svg>
                      {item.views ?? 0} views
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-zinc-400 mb-2">
              No {activeContentTab.toLowerCase()} found for your channel.
            </p>
            <p className="text-xs text-zinc-500 mb-4">Start creating to see your {activeContentTab.toLowerCase()} analytics.</p>
            <Link
              href="/studio/content"
              className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              {emptyCtaLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
