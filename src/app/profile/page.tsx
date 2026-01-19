'use client';

import { useState } from 'react';
import Link from 'next/link';

const userVideos = [
  {
    id: '1',
    title: 'Building a Full Stack App with Next.js and TypeScript',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    views: '125K',
    timestamp: '2 days ago',
    duration: '15:32',
  },
  {
    id: '2',
    title: 'React Performance Optimization Techniques',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
    views: '89K',
    timestamp: '1 week ago',
    duration: '18:45',
  },
  {
    id: '3',
    title: 'Advanced TypeScript Patterns',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop',
    views: '234K',
    timestamp: '3 days ago',
    duration: '22:10',
  },
  {
    id: '4',
    title: 'Building RESTful APIs with Express',
    thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop',
    views: '156K',
    timestamp: '5 days ago',
    duration: '25:30',
  },
  {
    id: '5',
    title: 'Database Design Best Practices',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    views: '198K',
    timestamp: '1 day ago',
    duration: '20:15',
  },
  {
    id: '6',
    title: 'Authentication Strategies for Web Apps',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
    views: '312K',
    timestamp: '4 days ago',
    duration: '28:00',
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('videos');
  const [isSubscribed, setIsSubscribed] = useState(false);

  return (
    <div>
      <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600"></div>
      
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 -mt-12 mb-8">
          <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center border-4 border-gray-900">
            <span className="text-4xl font-bold text-white">U</span>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">Your Channel</h1>
            <p className="text-gray-400">@yourchannel</p>
            <div className="flex items-center gap-6 mt-2 text-sm text-gray-400">
              <span>1.2M subscribers</span>
              <span>48 videos</span>
              <span>15.2M total views</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              Customize Channel
            </button>
            <Link
              href="/upload"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-300">
            Welcome to my channel! I create tutorials about web development, programming, and software engineering. 
            Subscribe to stay updated with the latest content.
          </p>
        </div>

        <div className="border-b border-gray-800 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('videos')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'videos'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'playlists'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Playlists
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'about'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              About
            </button>
          </div>
        </div>

        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userVideos.map((video) => (
              <Link key={video.id} href={`/watch/${video.id}`} className="group">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full aspect-video object-cover rounded-lg group-hover:rounded-none transition-all duration-200"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                
                <div className="mt-3">
                  <h3 className="font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {video.views} views • {video.timestamp}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
            <p className="text-gray-400 mb-4">Create playlists to organize your videos</p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create Playlist
            </button>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-2xl">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-gray-300">
                Welcome to my channel! I create tutorials about web development, programming, and software engineering. 
                Subscribe to stay updated with the latest content.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-gray-400 w-32">Location</span>
                  <span className="text-white">San Francisco, CA</span>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-32">Joined</span>
                  <span className="text-white">Jan 15, 2024</span>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-32">Links</span>
                  <a href="#" className="text-blue-400 hover:underline">github.com/yourchannel</a>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Stats</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">1.2M</div>
                  <div className="text-sm text-gray-400">Subscribers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">48</div>
                  <div className="text-sm text-gray-400">Videos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">15.2M</div>
                  <div className="text-sm text-gray-400">Views</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
