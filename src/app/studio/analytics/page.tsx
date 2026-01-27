'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { getActiveProfile } from '@/app/actions/profile';
import { supabase, type Video } from '@/lib/supabase';

export default function StudioAnalyticsPage() {
  const tabs = ['Overview', 'Content', 'Audience', 'Trends'];
  const contentTabs = ['Videos', 'Styles', 'Posts'] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const [activeContentTab, setActiveContentTab] = useState<(typeof contentTabs)[number]>('Videos');
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [contentItems, setContentItems] = useState<Video[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [liveViews, setLiveViews] = useState(0);
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const audienceRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const trendsRef = useRef<HTMLDivElement | null>(null);

  const sectionRefs: Record<(typeof tabs)[number], MutableRefObject<HTMLDivElement | null>> = {
    Overview: overviewRef,
    Content: contentRef,
    Audience: audienceRef,
    Trends: trendsRef
  };

  const popularSearches = [
    'Playra shorts',
    'Kids cartoons',
    'DIY crafts',
    'Travel vlogs',
    'Music mashups',
    'Fitness routines',
    'Cooking hacks',
    'Live sessions'
  ];

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

  useEffect(() => {
    setLiveViews(contentItems.reduce((sum, item) => sum + (item.views ?? 0), 0));
  }, [contentItems]);

  useEffect(() => {
    if (!activeProfile || !supabase) return;

    const channel = supabase
      .channel('analytics-videos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'videos', filter: `channel_id=eq.${activeProfile.id}` },
        (payload) => {
          setContentItems((prev) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new as Video, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((item) => (item.id === (payload.new as Video).id ? (payload.new as Video) : item));
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((item) => item.id !== (payload.old as Video)?.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeProfile]);

  const filteredContent = useMemo(() => {
    if (activeContentTab === 'Videos') return contentItems.filter((v) => !v.is_short && !v.is_post && !v.is_live);
    if (activeContentTab === 'Styles') return contentItems.filter((v) => v.is_short);
    if (activeContentTab === 'Posts') return contentItems.filter((v) => v.is_post);
    return [];
  }, [activeContentTab, contentItems]);

  const emptyCtaLabel =
    activeContentTab === 'Posts' ? 'Create post' : activeContentTab === 'Styles' ? 'Upload style' : 'Upload video';

  const scrollToSection = (tab: (typeof tabs)[number]) => {
    setActiveTab(tab);
    const targetRef = sectionRefs[tab];
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <div ref={overviewRef} className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Channel analytics</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <div className="rounded-full border border-white/10 px-3 py-1.5">Last 28 days</div>
          <button className="rounded-full border border-white/10 px-3 py-1.5 hover:bg-white/5 transition-colors">
            Advanced mode
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 border-b border-white/10 mb-6 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => scrollToSection(tab)}
            className={`pb-3 transition-colors ${
              activeTab === tab ? 'text-white border-b-2 border-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div ref={audienceRef} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
          <p className="text-sm text-zinc-400 mb-3">Your channel got 0 views in the last 28 days</p>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {[
              { label: 'Views', value: '0' },
              { label: 'Watch time (hours)', value: '0.0' },
              { label: 'Subscribers', value: '—' }
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-[#121212] px-4 py-3">
                <p className="text-xs text-zinc-400 mb-1">{stat.label}</p>
                <p className="text-xl font-semibold">{stat.value}</p>
                <p className="text-[11px] text-zinc-500 mt-1">About the same as previous 28 days</p>
              </div>
            ))}
          </div>

          <div className="h-64 rounded-lg border border-white/10 bg-[#121212] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,rgba(255,255,255,0.05)_1px),linear-gradient(90deg,transparent_1px,rgba(255,255,255,0.05)_1px)] bg-[size:32px_32px]" />
            <div className="absolute inset-x-6 bottom-6 h-px bg-white/10" />
          </div>

          <button className="mt-6 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors">
            See more
          </button>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold">Realtime</p>
              <p className="text-xs text-zinc-400">Updating live</p>
            </div>
            <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors">
              See live count
            </button>
          </div>
          <div className="border border-white/10 rounded-lg bg-[#121212] p-4 mb-4">
            <p className="text-xs text-zinc-400">Live views (channel)</p>
            <p className="text-2xl font-semibold">{liveViews}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Updates instantly when someone watches</p>
          </div>
          <div className="border border-white/10 rounded-lg bg-[#121212] p-4">
            <p className="text-xs text-zinc-400 mb-2">Views · Last 48 hours</p>
            <div className="h-28 rounded-md border border-white/10 bg-[#0f0f0f]" />
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
              <span>-48h</span>
              <span>Now</span>
            </div>
          </div>
          <button className="mt-6 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors">
            See more
          </button>
        </div>
      </div>

      <div ref={contentRef} className="mt-10 bg-[#121212] rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-sm text-zinc-400">Your content</p>
            <h2 className="text-xl font-bold">Videos, Styles, and Posts</h2>
          </div>
          <Link
            href="/studio/content"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm border border-white/10 transition-colors"
          >
            Go to Content
          </Link>
        </div>

        <div className="flex gap-4 mb-6 text-sm">
          {contentTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveContentTab(tab)}
              className={`pb-2 border-b-2 transition-colors ${
                activeContentTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'
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
                className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4 flex gap-3 hover:border-white/20 transition-colors"
              >
                <div className="w-28 aspect-video rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 relative">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-zinc-600 text-xs">No thumbnail</div>
                  )}
                  <span className="absolute top-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black/60 border border-white/10 uppercase tracking-tight">
                    {item.is_post ? 'Post' : item.is_short ? 'Style' : item.is_live ? 'Live' : 'Video'}
                  </span>
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{item.description || 'No description yet'}</p>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-tight flex gap-3 mt-auto">
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

      <div ref={trendsRef} className="mt-10 bg-[#121212] rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <p className="text-sm text-zinc-400">Trends</p>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 uppercase tracking-wide">
              Playra most popular searches
            </span>
          </div>
          <div className="relative w-full max-w-xs">
            <input
              type="text"
              placeholder="Search across trends"
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-white/30 transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {popularSearches.map((term) => (
            <span
              key={term}
              className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm hover:bg-white/10 transition-colors"
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
