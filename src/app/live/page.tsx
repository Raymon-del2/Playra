'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { LiveStream } from '@/types/live';

export default function LivePage() {
  const router = useRouter();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [scheduledStreams, setScheduledStreams] = useState<LiveStream[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (user) {
        const { data: profile } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profile) setActiveProfile(profile);
      }
    };
    getProfile();
  }, []);

  useEffect(() => {
    const fetchStreams = async () => {
      setIsLoading(true);
      
      // Fetch live streams
      const { data: liveData } = await supabase!
        .from('live_streams')
        .select('*, creator:profiles(id, name, avatar)')
        .eq('status', 'live')
        .order('started_at', { ascending: false })
        .limit(20);

      // Fetch scheduled streams
      const { data: scheduledData } = await supabase!
        .from('live_streams')
        .select('*, creator:profiles(id, name, avatar)')
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(20);

      if (liveData) setLiveStreams(liveData);
      if (scheduledData) setScheduledStreams(scheduledData);
      
      setIsLoading(false);
    };

    fetchStreams();

    // Subscribe to new live streams
    const channel = supabase!
      .channel('live-streams')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_streams',
        filter: 'status=eq.live'
      }, async (payload) => {
        const { data: streamWithCreator } = await supabase!
          .from('live_streams')
          .select('*, creator:profiles(id, name, avatar)')
          .eq('id', payload.new.id)
          .single();
        
        if (streamWithCreator) {
          setLiveStreams(prev => [streamWithCreator, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, []);

  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `In ${diffMins} min`;
    if (diffHours < 24) return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const StreamCard = ({ stream }: { stream: LiveStream }) => (
    <Link href={`/live/${stream.room_id}`} className="block group">
      <div className="bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800 transition-colors">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-zinc-800">
          {stream.thumbnail_url ? (
            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
                {stream.creator?.avatar ? (
                  <img src={stream.creator.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-2xl font-bold">{stream.creator?.name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Live badge */}
          {stream.status === 'live' && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
          )}
          
          {/* Viewer count */}
          {stream.status === 'live' && stream.peak_viewers > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
              👀 {stream.peak_viewers}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-bold text-white truncate">{stream.title}</h3>
          <p className="text-zinc-400 text-sm truncate">{stream.creator?.name}</p>
          {stream.category && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
              {stream.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );

  const ScheduledCard = ({ stream }: { stream: LiveStream }) => (
    <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-4">
      {/* Avatar */}
      <div className="w-14 h-14 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
        {stream.creator?.avatar ? (
          <img src={stream.creator.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl font-bold">
            {stream.creator?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-orange-400 text-sm font-bold mb-1">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          {formatScheduledTime(stream.scheduled_at!)}
        </div>
        <h3 className="font-bold text-white truncate">{stream.title}</h3>
        <p className="text-zinc-400 text-sm truncate">{stream.creator?.name}</p>
      </div>

      {/* Notify button */}
      <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition-colors">
        🔔 Notify Me
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-20">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Live Streams</h1>
            <p className="text-zinc-400">Watch creators stream live</p>
          </div>
          
          {activeProfile && (
            <Link
              href="/live/go"
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-full font-bold transition-colors"
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Go Live
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('live')}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'live' ? 'text-white' : 'text-zinc-400'
            }`}
          >
            🔴 Live Now
            {liveStreams.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 rounded-full text-xs">{liveStreams.length}</span>
            )}
            {activeTab === 'live' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'upcoming' ? 'text-white' : 'text-zinc-400'
            }`}
          >
            ⏰ Upcoming
            {scheduledStreams.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-zinc-700 rounded-full text-xs">{scheduledStreams.length}</span>
            )}
            {activeTab === 'upcoming' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'live' ? (
          liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {liveStreams.map((stream) => (
                <StreamCard key={stream.id} stream={stream} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-4xl">📺</span>
              </div>
              <h2 className="text-xl font-bold mb-2">No live streams right now</h2>
              <p className="text-zinc-400 mb-6">Check back later or go live yourself!</p>
              {activeProfile && (
                <Link
                  href="/live/go"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-full font-bold transition-colors"
                >
                  Start Streaming
                </Link>
              )}
            </div>
          )
        ) : (
          scheduledStreams.length > 0 ? (
            <div className="space-y-3">
              {scheduledStreams.map((stream) => (
                <ScheduledCard key={stream.id} stream={stream} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-4xl">📅</span>
              </div>
              <h2 className="text-xl font-bold mb-2">No upcoming streams</h2>
              <p className="text-zinc-400">Schedule a stream to notify your followers</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
