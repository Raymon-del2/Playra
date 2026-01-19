'use client';

import { useState } from 'react';
import Link from 'next/link';

const studioVideos = [
  {
    id: '1',
    title: 'Building a Full Stack App with Next.js and TypeScript',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    status: 'public',
    views: '125K',
    date: 'Jan 16, 2026',
    duration: '15:32',
  },
  {
    id: '2',
    title: 'React Performance Optimization Techniques',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=225&fit=crop',
    status: 'public',
    views: '89K',
    date: 'Jan 11, 2026',
    duration: '18:45',
  },
  {
    id: '3',
    title: 'Advanced TypeScript Patterns',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop',
    status: 'public',
    views: '234K',
    date: 'Jan 15, 2026',
    duration: '22:10',
  },
  {
    id: '4',
    title: 'Building RESTful APIs with Express',
    thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop',
    status: 'unlisted',
    views: '156K',
    date: 'Jan 13, 2026',
    duration: '25:30',
  },
  {
    id: '5',
    title: 'Database Design Best Practices',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    status: 'public',
    views: '198K',
    date: 'Jan 17, 2026',
    duration: '20:15',
  },
  {
    id: '6',
    title: 'Authentication Strategies for Web Apps',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
    status: 'private',
    views: '0',
    date: 'Jan 18, 2026',
    duration: '28:00',
  },
];

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = [
    { label: 'Total Views', value: '15.2M', change: '+12.5%' },
    { label: 'Watch Time', value: '2.3M hrs', change: '+8.2%' },
    { label: 'Subscribers', value: '1.2M', change: '+5.1%' },
    { label: 'Revenue', value: '$12,450', change: '+15.3%' },
  ];

  const recentPerformance = [
    { video: 'Building a Full Stack App', views: '125K', likes: '8.2K', comments: '234' },
    { video: 'Advanced TypeScript Patterns', views: '234K', likes: '15.1K', comments: '412' },
    { video: 'Database Design Best Practices', views: '198K', likes: '12.8K', comments: '389' },
  ];

  return (
    <div>
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Studio</h1>
            <Link
              href="/upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-8">
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'content'
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                Content
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'comments'
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="bg-gray-800 rounded-lg p-6">
                      <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold mb-1">{stat.value}</p>
                      <p className="text-sm text-green-400">{stat.change}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Recent Performance</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                          <th className="pb-3">Video</th>
                          <th className="pb-3">Views</th>
                          <th className="pb-3">Likes</th>
                          <th className="pb-3">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPerformance.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700/50">
                            <td className="py-3 text-white">{item.video}</td>
                            <td className="py-3 text-gray-300">{item.views}</td>
                            <td className="py-3 text-gray-300">{item.likes}</td>
                            <td className="py-3 text-gray-300">{item.comments}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Videos</h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search videos"
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors">
                      Filter
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                        <th className="pb-3 w-48">Video</th>
                        <th className="pb-3">Visibility</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Views</th>
                        <th className="pb-3">Comments</th>
                        <th className="pb-3">Likes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studioVideos.map((video) => (
                        <tr key={video.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                          <td className="py-4">
                            <Link href={`/watch/${video.id}`} className="flex gap-3 items-center group">
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-24 aspect-video object-cover rounded"
                              />
                              <div className="min-w-0">
                                <p className="text-white font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                                  {video.title}
                                </p>
                                <p className="text-sm text-gray-400">{video.duration}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                video.status === 'public'
                                  ? 'bg-green-500/20 text-green-400'
                                  : video.status === 'unlisted'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {video.status}
                            </span>
                          </td>
                          <td className="py-4 text-gray-300">{video.date}</td>
                          <td className="py-4 text-gray-300">{video.views}</td>
                          <td className="py-4 text-gray-300">--</td>
                          <td className="py-4 text-gray-300">--</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-xl font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-400">Detailed analytics will be available in the next update.</p>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-semibold mb-2">Comments Coming Soon</h3>
                <p className="text-gray-400">Comment management will be available in the next update.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-xl font-semibold mb-2">Settings Coming Soon</h3>
                <p className="text-gray-400">Channel settings will be available in the next update.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
