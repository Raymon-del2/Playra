'use client';

import Link from 'next/link';

export default function YouPage() {
    const historyVideos = [
        { id: '1', title: 'Building a Full Stack App...', views: '125K', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=240&h=135&fit=crop' },
        { id: '2', title: 'Learn React Hooks...', views: '89K', thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=240&h=135&fit=crop' },
        { id: '3', title: 'The Future of AI...', views: '234K', thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=240&h=135&fit=crop' },
    ];

    const playlists = [
        { title: 'Watch Later', count: '45 videos', icon: 'clock' },
        { title: 'Liked Videos', count: '1,234 videos', icon: 'heart' },
        { title: 'Coding Tips', count: '12 videos', icon: 'folder' },
    ];

    return (
        <div className="bg-gray-900 min-h-screen text-white pb-20 overflow-x-hidden">
            {/* Top Header - Settings Pin */}
            <div className="flex justify-end p-4 sticky top-0 bg-gray-900 z-10">
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors active:scale-90">
                    <svg className="w-6 h-6 outline-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0a7.5 7.5 0 00-5.132-7.117m0 0A7.5 7.5 0 0116.867 12m0 0a7.5 7.5 0 01-5.132 7.117m0 0A7.5 7.5 0 0012 21.75c-2.676 0-5.216-.584-7.499-1.632" /></svg>
                </button>
            </div>

            {/* Profile Section */}
            <div className="px-5 mb-8">
                <div className="flex items-center gap-4 group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border-2 border-white/10 shadow-2xl p-0.5">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-2xl font-black italic">A</div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Antigravity</h1>
                        <p className="text-gray-400 text-sm font-medium flex items-center gap-1.5">
                            @antigravity_dev <span className="opacity-30">•</span> View channel
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide">
                    {['Switch accounts', 'Google Account', 'Incognito'].map(action => (
                        <button key={action} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-white/5 active:scale-95">
                            {action}
                        </button>
                    ))}
                </div>
            </div>

            {/* History Section */}
            <section className="mb-8 pl-5">
                <div className="flex items-center justify-between pr-5 mb-4 group cursor-pointer">
                    <h2 className="text-xl font-bold tracking-tight">History</h2>
                    <button className="text-blue-400 text-sm font-bold border border-blue-500/30 px-3 py-1 rounded-full hover:bg-blue-500/10 transition-all">View all</button>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pr-5">
                    {historyVideos.map(video => (
                        <div key={video.id} className="flex-shrink-0 w-44">
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-lg border border-white/5 mb-2">
                                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold px-1 rounded">12:34</div>
                            </div>
                            <h3 className="text-sm font-medium leading-tight line-clamp-2 mb-1">{video.title}</h3>
                            <p className="text-[12px] text-gray-500 font-medium">{video.views} views</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Playlists Section */}
            <section className="mb-8 pl-5">
                <div className="flex items-center justify-between pr-5 mb-4 group cursor-pointer">
                    <h2 className="text-xl font-bold tracking-tight">Playlists</h2>
                    <button className="text-blue-400 text-sm font-bold border border-blue-500/30 px-3 py-1 rounded-full hover:bg-blue-500/10 transition-all">View all</button>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pr-5">
                    {playlists.map(p => (
                        <div key={p.title} className="flex-shrink-0 w-40">
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 shadow-md border border-white/5 mb-2 flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                                <div className="opacity-20 absolute inset-0 bg-gradient-to-br from-white to-transparent" />
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                    {p.icon === 'clock' && <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    {p.icon === 'heart' && <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>}
                                    {p.icon === 'folder' && <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>}
                                </div>
                            </div>
                            <h3 className="text-sm font-bold leading-tight mb-1">{p.title}</h3>
                            <p className="text-[12px] text-gray-500 font-medium">{p.count}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Content Management rows */}
            <div className="px-1 mb-10">
                {[
                    { label: 'Your videos', icon: 'video' },
                    { label: 'Downloads', icon: 'down', desc: '24 videos' },
                    { label: 'Your movies & TV', icon: 'tv' },
                    { label: 'Your clips', icon: 'clip' }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-5 px-5 py-4 hover:bg-white/5 active:bg-white/10 transition-all rounded-2xl mx-2 cursor-pointer">
                        <div className="w-6 h-6 text-gray-400 flex items-center justify-center">
                            {item.icon === 'video' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                            {item.icon === 'down' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            {item.icon === 'tv' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" /></svg>}
                            {item.icon === 'clip' && <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[15px]">{item.label}</p>
                            {item.desc && <p className="text-[12px] text-gray-500 font-medium">{item.desc}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
