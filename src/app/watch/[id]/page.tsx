'use client';

import { useState } from 'react';
import Link from 'next/link';

const relatedVideos = [
  {
    id: '2',
    title: 'Learn React Hooks in 10 Minutes',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
    channel: 'Code Academy',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    views: '89K',
    timestamp: '1 week ago',
    duration: '10:15',
  },
  {
    id: '3',
    title: 'The Future of AI in Web Development',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop',
    channel: 'AI Insights',
    channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    views: '234K',
    timestamp: '3 days ago',
    duration: '22:45',
  },
  {
    id: '4',
    title: 'Mastering CSS Grid and Flexbox',
    thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop',
    channel: 'Design Pro',
    channelAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop',
    views: '156K',
    timestamp: '5 days ago',
    duration: '18:20',
  },
  {
    id: '5',
    title: 'Building Scalable APIs with Node.js',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    channel: 'Backend Guru',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop',
    views: '198K',
    timestamp: '1 day ago',
    duration: '25:10',
  },
  {
    id: '6',
    title: 'Introduction to Machine Learning',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
    channel: 'ML Academy',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop',
    views: '312K',
    timestamp: '4 days ago',
    duration: '30:00',
  },
  {
    id: '7',
    title: 'Web Performance Optimization Tips',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    channel: 'Speed Master',
    channelAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop',
    views: '87K',
    timestamp: '6 days ago',
    duration: '12:45',
  },
];

export default function WatchPage({ params }: { params: { id: string } }) {
  const [likes, setLikes] = useState(12500);
  const [dislikes, setDislikes] = useState(234);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      if (isDisliked) {
        setDislikes(dislikes - 1);
        setIsDisliked(false);
      }
      setLikes(likes + 1);
      setIsLiked(true);
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setDislikes(dislikes - 1);
      setIsDisliked(false);
    } else {
      if (isLiked) {
        setLikes(likes - 1);
        setIsLiked(false);
      }
      setDislikes(dislikes + 1);
      setIsDisliked(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-0 sm:p-6 bg-gray-900 min-h-screen">
      <div className="flex-1">
        <div className="aspect-video bg-black sm:rounded-lg overflow-hidden mb-4">
          <video
            className="w-full h-full"
            controls
            poster="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1280&h=720&fit=crop"
          >
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="flex flex-col gap-4 mb-6 px-4 sm:px-0">
          <div className="flex flex-col gap-2">
            <h1 className="text-[19px] font-black leading-tight tracking-tight">
              Building a Full Stack App with Next.js and TypeScript
            </h1>
            <div className="flex items-center gap-2 text-[13px] text-gray-400 font-bold mb-1">
              <span>125K views</span>
              <span className="opacity-30">•</span>
              <span>2 days ago</span>
              <span className="text-gray-200 ml-1">...more</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/channel/techmaster" className="flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
                    alt="Tech Master"
                    className="w-10 h-10 rounded-full border border-white/5 shadow-md"
                  />
                </Link>
                <div className="flex flex-col">
                  <h3 className="font-black text-[15px] leading-tight flex items-center gap-1">
                    Tech Master
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </h3>
                  <p className="text-[12.5px] text-gray-400 font-bold">1.2M sub</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={`px-5 py-2 rounded-full font-black text-[13.5px] transition-all active:scale-95 shadow-xl ${isSubscribed
                  ? 'bg-white/10 text-white border border-white/5'
                  : 'bg-white text-black'
                  }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            {/* Engagement Pill (Mobile 2026 MD3) */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <div className="flex items-center bg-white/10 backdrop-blur-xl rounded-full border border-white/5 shadow-2xl h-10 px-1">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/5 transition-all active:scale-90 ${isLiked ? 'text-blue-400' : 'text-white'
                    }`}
                >
                  <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.527c-1.325 0-2.4-1.075-2.4-2.4V10.6c0-1.325 1.075-2.4 2.4-2.4h.527c.445 0 .72.498.523.898a4.512 4.512 0 0 0-.27.602" /></svg>
                  <span className="font-bold text-[13.5px]">{likes.toLocaleString()}</span>
                </button>
                <div className="w-px h-6 bg-white/10 mx-0.5" />
                <button
                  onClick={handleDislike}
                  className={`flex items-center px-4 py-1.5 rounded-full hover:bg-white/5 transition-all active:scale-90 ${isDisliked ? 'text-blue-400' : 'text-white'
                    }`}
                >
                  <svg className="w-5 h-5" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 13.5l3 3m0 0l3-3m-3 3v-10m10 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 h-10 px-5 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/15 transition-all active:scale-95 border border-white/5 shadow-xl text-white font-bold text-[13.5px]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 003.933 2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                  <span>Share</span>
                </button>

                <button className="flex items-center gap-2 h-10 px-5 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/15 transition-all active:scale-95 border border-white/5 shadow-xl text-white font-bold text-[13.5px]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <span>Remix</span>
                </button>

                <button className="flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/15 transition-all active:scale-95 border border-white/5 shadow-xl text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <span>125K views</span>
            <span>•</span>
            <span>2 days ago</span>
          </div>
          <p className="text-gray-300">
            In this comprehensive tutorial, we&apos;ll build a full-stack application using Next.js 14, TypeScript, and modern web development best practices.
            Learn how to set up your project, implement authentication, create API routes, and deploy your app to production.
          </p>
        </div>
      </div>

      <div className="lg:w-96 px-4 sm:px-0">
        <h2 className="text-lg font-black mb-4 tracking-tight px-1 sm:px-0">Related Videos</h2>
        <div className="space-y-4">
          {relatedVideos.map((video) => (
            <Link key={video.id} href={`/watch/${video.id}`} className="flex gap-3 group">
              <div className="relative flex-shrink-0">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-40 aspect-video object-cover rounded-xl border border-white/5"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>

              <div className="flex-1 min-w-0 py-0.5">
                <h3 className="font-bold text-[13.5px] leading-snug line-clamp-2 text-white group-hover:text-blue-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-[12px] text-gray-400 font-bold mt-1.5 leading-none">{video.channel}</p>
                <p className="text-[11px] text-gray-500 font-bold mt-1">
                  {video.views} views • {video.timestamp}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
