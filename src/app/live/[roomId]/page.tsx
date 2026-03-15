'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useWebRTC } from '@/hooks/useWebRTC';
import { LiveChat } from '@/components/live/LiveChat';
import { GiftPanel } from '@/components/live/GiftPanel';
import { GIFT_CONFIG, type GiftType, type LiveStream } from '@/types/live';

interface LivePageProps {
  params: Promise<{ roomId: string }>;
}

export default function LivePage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId;
  
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [streamData, setStreamData] = useState<LiveStream | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftAnimations, setGiftAnimations] = useState<{id: string; type: GiftType; sender: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const { localStream, remoteStream, isConnected, startStream, stopStream, joinStream } = useWebRTC(false);

  // Load profile
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
  }, [supabase]);

  // Fetch stream data
  useEffect(() => {
    const fetchStream = async () => {
      const { data, error: fetchError } = await supabase!
        .from('live_streams')
        .select('*, creator:profiles(id, name, avatar)')
        .eq('room_id', roomId)
        .single();

      if (fetchError || !data) {
        setError('Stream not found or has ended');
        return;
      }

      setStreamData(data);
      setLikesCount(data.likes_count || 0);
    };

    fetchStream();

    // Subscribe to stream updates
    const channel = supabase!
      .channel(`stream:${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_streams',
        filter: `room_id=eq.${roomId}`
      }, (payload: any) => {
        if (payload.new.status === 'ended') {
          setError('This live stream has ended');
        }
      })
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [roomId, supabase]);

  // Join stream as viewer
  useEffect(() => {
    if (streamData?.status === 'live' && activeProfile) {
      joinStream(roomId);
      
      // Add viewer to database
      const addViewer = async () => {
        await supabase!
          .from('stream_viewers')
          .upsert({
            stream_id: streamData.id,
            viewer_id: activeProfile.id,
            joined_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
          }, { onConflict: 'stream_id,viewer_id' });
      };
      addViewer();

      // Update view count
      (async () => {
        try {
          await supabase!.rpc('increment_stream_views', { 
            stream_id: streamData?.id 
          });
        } catch { /* ignore */ }
      })();
    }
  }, [streamData, activeProfile, roomId, joinStream, supabase]);

  // Subscribe to viewer count
  useEffect(() => {
    const channel = supabase!
      .channel(`viewers:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stream_viewers',
        filter: `stream_id=eq.${streamData?.id}`
      }, () => {
        setViewerCount(prev => prev + 1);
      })
      .subscribe();

    // Get initial viewer count
    if (streamData?.id) {
      supabase!
        .from('stream_viewers')
        .select('viewer_id', { count: 'exact', head: true })
        .eq('stream_id', streamData.id)
        .then(({ count }: any) => setViewerCount(count || 0));
    }

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [streamData?.id, roomId, supabase]);

  // Subscribe to donations for animations
  useEffect(() => {
    const channel = supabase!
      .channel(`donations:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `stream_id=eq.${streamData?.id}`
      }, (payload: any) => {
        const donation = payload.new;
        setGiftAnimations(prev => [...prev, {
          id: donation.id,
          type: donation.gift_type,
          sender: 'Someone'
        }]);
        
        // Remove animation after 3 seconds
        setTimeout(() => {
          setGiftAnimations(prev => prev.filter(a => a.id !== donation.id));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [streamData?.id, roomId, supabase]);

  // Attach remote stream to video
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle like
  const handleLike = async () => {
    if (!activeProfile) return;
    
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    if (!isLiked) {
      try {
        await supabase!.rpc('increment_live_likes', { 
          stream_id: streamData?.id 
        });
      } catch { /* ignore */ }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Stream Not Available</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/live')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-medium transition-colors"
          >
            Browse Live Streams
          </button>
        </div>
      </div>
    );
  }

  if (!streamData) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="flex flex-col lg:flex-row">
        {/* Main Video Area */}
        <div className="flex-1">
          {/* Video Player */}
          <div className="relative aspect-video bg-black">
            {remoteStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  </div>
                  <p className="text-zinc-400">Connecting to stream...</p>
                </div>
              </div>
            )}

            {/* Live badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-bold">LIVE</span>
            </div>

            {/* Gift Animations */}
            {giftAnimations.map((anim) => (
              <div
                key={anim.id}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none animate-float-up"
              >
                <div className="flex flex-col items-center">
                  <span className="text-6xl">{GIFT_CONFIG[anim.type].emoji}</span>
                  <span className="text-white text-sm font-bold mt-2 bg-black/50 px-3 py-1 rounded-full">
                    {anim.sender} sent a {anim.type}!
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Stream Info Bar */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Creator avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800">
                  {streamData.creator?.avatar ? (
                    <img src={streamData.creator.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                      {streamData.creator?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                
                {/* Stream info */}
                <div>
                  <h1 className="text-lg font-bold">{streamData.title}</h1>
                  <p className="text-zinc-400 text-sm">{streamData.creator?.name}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    isLiked ? 'bg-red-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{likesCount}</span>
                </button>

                <button
                  onClick={() => setShowGiftPanel(!showGiftPanel)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <span>🎁</span>
                  <span>Send Gift</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Viewer count */}
            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {viewerCount} watching
              </span>
              {streamData.category && (
                <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">
                  {streamData.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Chat & Gifts */}
        <div className="w-full lg:w-96 border-l border-white/10 flex flex-col" style={{ height: 'calc(100vh - 56px)', marginTop: '56px' }}>
          {/* Gift Panel */}
          {showGiftPanel && streamData.allow_donations && (
            <GiftPanel
              streamId={streamData.id}
              creatorId={streamData.creator_id}
              activeProfile={activeProfile}
            />
          )}

          {/* Live Chat */}
          <LiveChat
            streamId={streamData.id}
            activeProfile={activeProfile}
            isCreator={false}
          />
        </div>
      </div>
    </div>
  );
}
