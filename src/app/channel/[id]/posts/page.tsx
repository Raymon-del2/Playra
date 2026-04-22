'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getActiveProfile } from '@/app/actions/profile';
import { getSubscriberCount } from '@/app/actions/subscription';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

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

type Video = {
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
  is_post: boolean;
};

export default function ChannelPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: channelId } = use(params);
  const router = useRouter();
  const [channel, setChannel] = useState<ChannelRecord | null>(null);
  const [posts, setPosts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getActiveProfile();
        setIsOwner(Boolean(profile?.id === channelId));

        const res = await fetch(`/api/channel/${channelId}`);
        if (res.ok) {
          const json = await res.json();
          setChannel(json.channel);
        } else if (res.status === 404) {
          router.replace('/');
          return;
        }

        try {
          const count = await getSubscriberCount(channelId);
          setSubscriberCount(count);
        } catch (e) {}

        const { data: postsData, error: postsError } = await supabase!
          .from('videos')
          .select('*')
          .eq('channel_id', channelId)
          .eq('is_post', true)
          .order('created_at', { ascending: false });
        if (!postsError) {
          setPosts(postsData || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [channelId, router]);

  const handle = channel?.name ? `@${channel.name.replace(/^@+/, '').replace(/\s+/g, '').toLowerCase()}` : '';

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
      {/* Repair Notice */}
      <div className="bg-zinc-800/50 border-b border-white/5 px-4 py-2 text-center">
        <p className="text-zinc-400 text-sm">
          This page needs many repairs and we will fix it as we can
        </p>
      </div>

      {/* Banner */}
      <div className="relative w-full">
        <div
          className="h-32 sm:h-48 md:h-56 w-full bg-gradient-to-r from-blue-900/60 via-purple-800/50 to-black rounded-b-3xl border-b border-white/5"
          style={channel.banner ? { backgroundImage: `url(${channel.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
      </div>

      {/* Header */}
      <div className="max-w-[1284px] mx-auto px-4 md:px-6 pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
          <div className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/10 shadow-2xl -mt-12 sm:-mt-16 relative z-10">
            {channel.avatar ? (
              <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-500">
                {channel.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
            <h1 className="text-[24px] sm:text-[32px] font-black leading-tight mb-1 flex items-center gap-2">
              {channel.name}
              {channel.verified && (
                <img src="/verified-badge.ico" alt="Verified" className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-2 text-[14px] text-zinc-400 font-medium mb-3">
              <span className="text-white font-bold">{handle}</span>
              <span>·</span>
              <span>{subscriberCount === 1 ? '1 subscriber' : `${subscriberCount} subscribers`}</span>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Link href={`/channel/${channelId}`}>
                <button className="h-9 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-bold transition-colors">
                  Home
                </button>
              </Link>
              {isOwner && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="h-9 px-4 bg-white text-black hover:bg-zinc-200 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6">Community posts</h2>
        
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => {
              let content: any = {};
              try {
                content = post.description ? JSON.parse(post.description) : {};
              } catch (e) {}
              const postType = content._post_type || 'text';
              
              return (
                <div key={post.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                      {post.channel_avatar ? (
                        <img src={post.channel_avatar} alt={post.channel_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-500">
                          {post.channel_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{post.channel_name}</div>
                      <div className="text-zinc-500 text-xs">
                        {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
                      </div>
                    </div>
                  </div>
                  
                  {postType === 'text' && content.text && (
                    <p className="text-white whitespace-pre-wrap mb-3">{content.text}</p>
                  )}
                  
                  {postType === 'poll' && content.question && (
                    <div className="mb-3">
                      <p className="font-bold text-white mb-2">{content.question}</p>
                      <div className="space-y-2">
                        {content.options?.map((opt: any, idx: number) => (
                          <div key={idx} className="bg-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-300">
                            {opt.text || opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {postType === 'quiz' && content.question && (
                    <div className="mb-3">
                      <p className="font-bold text-white mb-2">{content.question}</p>
                      <div className="space-y-2">
                        {content.options?.map((opt: string, idx: number) => (
                          <div key={idx} className={`rounded-lg px-4 py-2 text-sm ${idx === content.correct_index ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-300'}`}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {postType === 'image' && content.images && (
                    <div className="mb-3">
                      {content.text && <p className="text-white whitespace-pre-wrap mb-2">{content.text}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        {content.images.map((img: string, idx: number) => (
                          <img key={idx} src={img} alt="" className="w-full rounded-lg object-cover aspect-square" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                    <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>Like</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Comment</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
              <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="font-medium text-lg mb-2">No posts yet</p>
            <p className="text-zinc-500">Share updates with your community</p>
            {isOwner && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors"
              >
                Create your first post
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal - redirect to create/post for now */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Create a post</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">×</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-zinc-400 text-sm">Choose what type of post you want to create:</p>
              <div className="space-y-2">
                <Link
                  href="/create/post"
                  onClick={() => setShowCreateModal(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Text post</div>
                    <div className="text-zinc-500 text-xs">Share thoughts with your community</div>
                  </div>
                </Link>
                <Link
                  href="/create/post"
                  onClick={() => setShowCreateModal(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Poll</div>
                    <div className="text-zinc-500 text-xs">Ask a question and get votes</div>
                  </div>
                </Link>
                <Link
                  href="/create/post"
                  onClick={() => setShowCreateModal(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Image post</div>
                    <div className="text-zinc-500 text-xs">Share photos with your community</div>
                  </div>
                </Link>
                <Link
                  href="/create/post"
                  onClick={() => setShowCreateModal(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Quiz</div>
                    <div className="text-zinc-500 text-xs">Create an interactive quiz</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
