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
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      <div className="flex-1">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <video
            className="w-full h-full"
            controls
            poster="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1280&h=720&fit=crop"
          >
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <h1 className="text-xl font-semibold mb-2">
          Building a Full Stack App with Next.js and TypeScript
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop"
              alt="Tech Master"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium">Tech Master</h3>
              <p className="text-sm text-gray-400">1.2M subscribers</p>
            </div>
            <button
              onClick={() => setIsSubscribed(!isSubscribed)}
              className={`px-4 py-2 rounded-full font-medium ${
                isSubscribed
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-800 rounded-full">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-l-full hover:bg-gray-700 ${
                  isLiked ? 'text-blue-400' : ''
                }`}
              >
                <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>{likes.toLocaleString()}</span>
              </button>
              <div className="w-px h-6 bg-gray-600"></div>
              <button
                onClick={handleDislike}
                className={`flex items-center gap-2 px-4 py-2 rounded-r-full hover:bg-gray-700 ${
                  isDisliked ? 'text-blue-400' : ''
                }`}
              >
                <svg className="w-5 h-5" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Save</span>
            </button>
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

      <div className="lg:w-96">
        <h2 className="text-lg font-semibold mb-4">Related Videos</h2>
        <div className="space-y-3">
          {relatedVideos.map((video) => (
            <Link key={video.id} href={`/watch/${video.id}`} className="flex gap-3 group">
              <div className="relative flex-shrink-0">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-40 aspect-video object-cover rounded-lg"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{video.channel}</p>
                <p className="text-xs text-gray-400">
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
