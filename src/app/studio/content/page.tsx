'use client';

import { useState, useRef, useEffect } from 'react';
import { getActiveProfile } from '@/app/actions/profile';
import Link from 'next/link';
import { supabase, uploadVideoFile, uploadVideo, uploadThumbnail, deleteVideoWithAssets } from '@/lib/supabase';

// Helper to get post preview text from description
function getPostPreview(description: string): string {
    try {
        const data = JSON.parse(description || '{}');
        if (data.text) return data.text;
        if (data._post_type === 'quiz') return `Quiz: ${data.question}`;
        if (data.question) return data._post_type === 'poll' ? `Poll: ${data.question}` : `Post: ${data.question}`;
        return 'Community Post';
    } catch {
        return description?.substring(0, 100) || 'Community Post';
    }
}

type UploadStep = 'idle' | 'details' | 'success';

export default function ChannelContent() {
    const [activeProfile, setActiveProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('Videos');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Upload State
    const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoTitle, setVideoTitle] = useState('');
    const [videoDescription, setVideoDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'adults' | 'family' | 'kids' | 'advert' | 'general' | 'music'>('general');
    const [thumbnailData, setThumbnailData] = useState<string>('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // List State
    const [videos, setVideos] = useState<any[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    const tabs = ['Videos', 'Styles', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions', 'Collaborations', 'Music'];

    const filteredVideos = videos.filter(v => {
        if (activeTab === 'Videos') return !v.is_short && !v.is_live && !v.is_post && v.category !== 'music';
        if (activeTab === 'Styles') return v.is_short;
        if (activeTab === 'Live') return v.is_live;
        if (activeTab === 'Posts') return v.is_post;
        if (activeTab === 'Music') return v.category === 'music';
        return false; // Other tabs show no content for now
    });

    const fetchVideos = async (profileId: string) => {
        setIsLoadingList(true);
        try {
            const { data, error } = await supabase!
                .from('videos')
                .select('*')
                .eq('channel_id', profileId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVideos(data || []);
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            const profile = await getActiveProfile();
            setActiveProfile(profile);
            if (profile) {
                await fetchVideos(profile.id);
                
                // Check for publish data from /publish page
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('publish') === 'true') {
                    await handlePublishFlow(profile);
                }
            } else {
                setIsLoadingList(false);
            }
        };
        fetchProfileData();
    }, []);
    
    // Handle publish flow from /publish page
    const handlePublishFlow = async (profile: any) => {
        try {
            const publishDataStr = sessionStorage.getItem('publishData');
            if (!publishDataStr) return;
            
            const publishData = JSON.parse(publishDataStr);
            const videoData = (window as any).__tempVideoData;
            const thumbnail = (window as any).__tempThumbnail || publishData.thumbnail;
            
            if (!videoData) {
                console.error('No video data found');
                return;
            }
            
            // Convert base64 video to File
            const videoFile = await base64ToFile(videoData, 'uploaded-video.mp4');
            
            // Process the upload
            setIsUploadModalOpen(true);
            setUploadStep('details');
            setSelectedFile(videoFile);
            setVideoTitle(publishData.title || 'Untitled');
            setVideoDescription(publishData.description || '');
            if (thumbnail) {
                setThumbnailData(thumbnail);
            }
            
            // Clear the publish data
            sessionStorage.removeItem('publishData');
            sessionStorage.removeItem('uploadVideo');
            delete (window as any).__tempVideoData;
            delete (window as any).__tempThumbnail;
            
            // Remove publish param from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('publish');
            window.history.replaceState({}, '', url.toString());
            
        } catch (error) {
            console.error('Error handling publish flow:', error);
        }
    };
    
    // Helper to convert base64 to File
    const base64ToFile = async (base64String: string, filename: string): Promise<File> => {
        const response = await fetch(base64String);
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type || 'video/mp4' });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
            setUploadStep('details');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            setSelectedFile(file);
            setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
            setUploadStep('details');
        }
    };

    const getVideoDuration = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                const duration = video.duration;
                const hrs = Math.floor(duration / 3600);
                const mins = Math.floor((duration % 3600) / 60);
                const secs = Math.floor(duration % 60);
                if (hrs > 0) {
                    resolve(`${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
                } else {
                    resolve(`${mins}:${secs.toString().padStart(2, '0')}`);
                }
            };
            video.onerror = () => resolve('0:00');
            video.src = window.URL.createObjectURL(file);
        });
    };

    const handleSave = async () => {
        if (!selectedFile || !activeProfile) return;

        setIsSaving(true);
        try {
            // Calculate video duration
            setUploadProgress(10);
            const duration = await getVideoDuration(selectedFile);
            // 1. Upload to Storage
            const timestamp = Date.now();
            const filePath = `${activeProfile.id}/${timestamp}-${selectedFile.name}`;

            // Note: In a real app, you'd use the progress callback if available via supabase client
            setUploadProgress(40);
            const videoUrl = await uploadVideoFile(selectedFile, filePath);

            setUploadProgress(65);

            // 1b. Upload thumbnail if provided
            let thumbnailUrl = '';
            if (thumbnailFile) {
                const thumbPath = `${activeProfile.id}/${timestamp}-thumb-${thumbnailFile.name}`;
                thumbnailUrl = await uploadThumbnail(thumbnailFile, thumbPath);
                setUploadProgress(80);
            }

            // 2. Save to Database
            await uploadVideo({
                title: videoTitle,
                description: videoDescription,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl || 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=225&fit=crop',
                channel_id: activeProfile.id,
                channel_name: activeProfile.name,
                channel_avatar: activeProfile.avatar || '',
                duration: duration,
                is_live: activeTab === 'Live',
                is_short: activeTab === 'Styles',
                is_post: activeTab === 'Posts',
                category: activeTab === 'Music' ? 'music' : selectedCategory
            });

            setUploadProgress(100);
            setUploadStep('success');
            // Refresh list
            if (activeProfile) {
                fetchVideos(activeProfile.id);
            }
            // Dispatch event to refresh home page
            localStorage.setItem('video-updated', Date.now().toString());
            window.dispatchEvent(new CustomEvent('video-updated'));
            console.log('Video uploaded, event dispatched');
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message || 'Unknown error'}. Check that your 'videos' bucket and table exist in Supabase.`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = async () => {
        if (!editTarget || !editTitle.trim()) return;
        setIsSavingEdit(true);
        try {
            console.log('Updating video:', editTarget.id, 'to title:', editTitle.trim());
            const { data, error } = await supabase!
                .from('videos')
                .update({ title: editTitle.trim() })
                .eq('id', editTarget.id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }

            console.log('Supabase update result:', data);

            setVideos((prev) =>
                prev.map((v) => (v.id === editTarget.id ? { ...v, title: editTitle.trim() } : v))
            );
            setEditTarget(null);
            setEditTitle('');

            // Dispatch event to refresh home page
            localStorage.setItem('video-updated', Date.now().toString());
            window.dispatchEvent(new CustomEvent('video-updated', { detail: { videoId: editTarget.id } }));
            console.log('Event dispatched');
        } catch (error) {
            console.error('Error updating video:', error);
            alert('Failed to update video title');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const resetModal = () => {
        setIsUploadModalOpen(false);
        setUploadStep('idle');
        setSelectedFile(null);
        setUploadProgress(0);
        setVideoTitle('');
        setVideoDescription('');
        setThumbnailData('');
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setThumbnailFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result?.toString() || '';
            setThumbnailData(result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white w-full max-w-full overflow-x-hidden pb-24 lg:pb-0">
            {/* Header / Search Area */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-[#0f0f0f] sticky top-0 z-20 gap-2">
                <div className="relative flex-1 max-w-[200px] sm:max-w-[400px]">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full h-9 bg-[#121212] border border-white/10 rounded-full px-9 text-sm focus:border-white/30 outline-none transition-colors"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative hidden sm:block">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab !== 'Live') {
                                setIsUploadModalOpen(true);
                            }
                        }}
                        disabled={activeTab === 'Live'}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded text-sm font-medium transition-colors border border-white/10 whitespace-nowrap ${activeTab === 'Live' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white/10 hover:bg-white/15 text-white'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="hidden sm:inline">
                            {activeTab === 'Styles'
                                ? 'Upload'
                                : activeTab === 'Posts'
                                    ? 'Create'
                                    : activeTab === 'Music'
                                        ? 'Upload'
                                        : 'Create'}
                        </span>
                    </button>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                        {activeProfile?.avatar ? (
                            <img src={activeProfile.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                                {activeProfile?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}

                        {/* Delete confirmation modal */}
                        {deleteTarget && (
                            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                                <div className="bg-[#111] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md p-6 space-y-4">
                                    <h3 className="text-xl font-bold text-white">Delete this video?</h3>
                                    <p className="text-sm text-zinc-400">
                                        This will permanently remove "{deleteTarget.title}". You cannot undo this action.
                                    </p>
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => setDeleteTarget(null)}
                                            className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isDeleting}
                                            onClick={async () => {
                                                if (!deleteTarget) return;
                                                setIsDeleting(true);
                                                try {
                                                    await deleteVideoWithAssets({
                                                        id: deleteTarget.id,
                                                        videoUrl: deleteTarget.video_url,
                                                        thumbnailUrl: deleteTarget.thumbnail_url
                                                    });
                                                    setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
                                                } catch (error: any) {
                                                    console.error('Error deleting video:', error);
                                                    alert(`Failed to delete: ${error.message || 'Unknown error'}`);
                                                } finally {
                                                    setIsDeleting(false);
                                                    setDeleteTarget(null);
                                                }
                                            }}
                                            className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                                        >
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit video title modal */}
                        {editTarget && (
                            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                                <div className="bg-[#111] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md p-6 space-y-4">
                                    <h3 className="text-xl font-bold text-white">Edit video title</h3>
                                    <div className="space-y-2">
                                        <label className="text-sm text-zinc-400">New title</label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                                            placeholder="Enter new title"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => {
                                                setEditTarget(null);
                                                setEditTitle('');
                                            }}
                                            className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={isSavingEdit || !editTitle.trim()}
                                            onClick={handleEdit}
                                            className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-60"
                                        >
                                            {isSavingEdit ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-8 w-full max-w-full overflow-x-hidden">
                <h1 className="text-xl sm:text-2xl font-bold mb-6">Channel content</h1>

                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-8 border-b border-white/10 mb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-white' : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <button className="flex items-center gap-2 p-2 hover:bg-white/5 rounded text-zinc-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4.5h18m-18 5h18m-18 5h18m-18 5h18" />
                        </svg>
                        <span className="text-sm font-medium">Filter</span>
                    </button>
                </div>

                {/* Mobile Content List */}
                <div className="sm:hidden space-y-3">
                    {isLoadingList ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
                        </div>
                    ) : filteredVideos.length > 0 ? (
                        filteredVideos.map((video) => (
                            <div key={video.id} className="bg-zinc-900 rounded-lg p-3 border border-white/5 min-w-0">
                                {video.is_post ? (
                                    // Post preview
                                    <div className="flex gap-3 min-w-0">
                                        <div className="w-20 h-14 bg-zinc-800 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {video.thumbnail_url ? (
                                                <img src={video.thumbnail_url || undefined} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded uppercase">Post</span>
                                                <span className="text-xs text-zinc-500">{new Date(video.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-sm font-medium text-white truncate mt-1">{video.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-0.5 truncate">{getPostPreview(video.description)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <Link href={video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`} className="flex gap-3 min-w-0">
                                        <div className="w-20 h-14 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                            <img src={video.thumbnail_url || undefined} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                            <h3 className="text-sm font-medium text-white truncate">{video.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">{new Date(video.created_at).toLocaleDateString()} · {video.views || 0} views</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-xs text-zinc-400">Public</span>
                                            </div>
                                        </div>
                                    </Link>
                                )}
                                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                                    {!video.is_post && (
                                        <button
                                            onClick={() => {
                                                setEditTarget(video);
                                                setEditTitle(video.title);
                                            }}
                                            className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDeleteTarget(video)}
                                        className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-200 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-zinc-500 text-sm">No content available</p>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_repeat(5,120px)_110px] gap-4 px-4 py-2 border-b border-white/5 text-[12px] font-bold text-zinc-400 uppercase tracking-wider">
                        <div className="flex items-center gap-4">
                            <input type="checkbox" className="rounded border-zinc-600 bg-transparent" />
                            <span>Video</span>
                        </div>
                        <span>Visibility</span>
                        <span>Restrictions</span>
                        <span className="flex items-center gap-1">
                            Date
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z" /></svg>
                        </span>
                        <span>Views</span>
                        <span>Comments</span>
                        <span>Actions</span>
                    </div>

                    {/* Content List */}
                    {isLoadingList ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
                        </div>
                    ) : filteredVideos.length > 0 ? (
                        <div className="space-y-0">
                            {filteredVideos.map((video) => (
                                <div key={video.id} className="grid grid-cols-[1fr_repeat(5,120px)_110px] gap-4 px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors group items-center">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <input type="checkbox" className="rounded border-zinc-600 bg-transparent flex-shrink-0" />
                                        <Link href={video.is_short ? `/styles/${video.id}` : `/watch/${video.id}`} className="flex gap-4 items-center min-w-0 flex-1">
                                            <div className="w-32 aspect-video bg-zinc-800 rounded overflow-hidden flex-shrink-0 relative">
                                                <img src={video.thumbnail_url || undefined} className="w-full h-full object-cover" alt="" />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{video.title}</h3>
                                                <p className="text-[12px] text-zinc-500 line-clamp-1 mt-1">{video.description || 'Add description'}</p>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        Public
                                    </div>
                                    <div className="text-sm text-zinc-400">None</div>
                                    <div className="text-sm text-zinc-400">
                                        {new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        <div className="text-[11px] text-zinc-500 uppercase tracking-tighter">Published</div>
                                    </div>
                                    <div className="text-sm text-zinc-400">{video.views || 0}</div>
                                    <div className="text-sm text-zinc-400">0</div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditTarget(video);
                                                setEditTitle(video.title);
                                            }}
                                            className="px-3 py-1.5 text-sm font-semibold rounded-full bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 border border-blue-500/30 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(video)}
                                            className="px-3 py-1.5 text-sm font-semibold rounded-full bg-red-500/10 text-red-200 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                                <div className={`absolute inset-0 rounded-full blur-3xl ${activeTab === 'Live' ? 'bg-red-500/10' : 'bg-teal-500/10'}`} />
                                <div className={`relative z-10 w-40 h-40 rounded-2xl border-4 flex items-center justify-center overflow-hidden ${activeTab === 'Live' ? 'bg-red-400/20 border-red-400/30' : 'bg-teal-400/20 border-teal-400/30'
                                    }`}>
                                    <svg className={`w-24 h-24 ${activeTab === 'Live' ? 'text-red-400' : 'text-teal-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {activeTab === 'Live' ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        )}
                                    </svg>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-sm mb-6">
                                {activeTab === 'Live' ? 'No live streams yet' : `No ${activeTab.toLowerCase()} content available`}
                            </p>
                            <button
                                onClick={() => {
                                    if (activeTab !== 'Live') {
                                        setIsUploadModalOpen(true);
                                    }
                                }}
                                disabled={activeTab === 'Live'}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${activeTab === 'Live'
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                            >
                                {activeTab === 'Live' ? 'Start Live Stream' : activeTab === 'Styles' ? 'Upload Styles' : activeTab === 'Posts' ? 'Create Post' : 'Upload videos'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                    <div
                        className="absolute inset-0"
                        onClick={() => setIsUploadModalOpen(false)}
                    />
                    {/* UPDATED COMPACT MODAL DESIGN - MATCHING IMAGE */}
                    <div className={`relative w-full ${uploadStep === 'idle' ? 'max-w-xl' : 'max-w-[800px] aspect-[16/10]'} bg-[#282828] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 transition-all`}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 select-none">
                            <h2 className="text-[15px] font-bold text-white uppercase tracking-tight">Upload videos</h2>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                                    <svg className="w-5 h-5 text-zinc-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => resetModal()}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                                >
                                    <svg className="w-5 h-5 text-zinc-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 flex flex-col overflow-y-auto">
                            {uploadStep === 'idle' ? (
                                <div
                                    className={`flex-1 flex flex-col items-center justify-center py-16 px-8 transition-colors ${isDragging ? 'bg-white/5' : ''
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div 
                                      onClick={() => document.getElementById('studio-upload-input')?.click()}
                                      className="w-32 h-32 bg-[#1f1f1f] hover:bg-[#252525] rounded-full flex items-center justify-center mb-8 cursor-pointer transition-all shadow-inner group"
                                    >
                                        <svg className="w-12 h-12 text-zinc-500 group-hover:text-white group-hover:-translate-y-1 transition-all" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>

                                    <h3 className="text-[15px] font-bold text-white mb-6 select-none">Drag and drop video files to upload</h3>
                                    
                                    <input 
                                      id="studio-upload-input"
                                      type="file" 
                                      className="hidden" 
                                      accept="video/*" 
                                      onChange={handleFileSelect} 
                                    />

                                    <button 
                                      onClick={() => document.getElementById('studio-upload-input')?.click()}
                                      className="px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors uppercase tracking-wide"
                                    >
                                        Select files
                                    </button>

                                    <div className="mt-12 text-center opacity-40 hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[400px] mx-auto uppercase tracking-tighter">
                                            Your videos will be private until you publish them.
                                        </p>
                                    </div>
                                </div>
                            ) : uploadStep === 'details' ? (
                                <div className="p-8 flex flex-col lg:flex-row gap-8">
                                    {/* Left: Details Form */}
                                    <div className="flex-1 space-y-6">
                                        <h2 className="text-xl font-bold">Details</h2>
                                            <div className="space-y-4">
                                                {/* Video Type / Section Selection */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                                    {[
                                                        { id: 'video', label: 'Video', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
                                                        { id: 'music', label: 'Music', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
                                                        { id: 'styles', label: 'Styles', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                                                        { id: 'post', label: 'Post', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg> }
                                                    ].map((type) => (
                                                        <button
                                                            key={type.id}
                                                            onClick={() => {
                                                                if (type.id === 'video') { setSelectedCategory('general'); setActiveTab('Videos'); }
                                                                if (type.id === 'music') { setSelectedCategory('music'); setActiveTab('Music'); }
                                                                if (type.id === 'styles') { setActiveTab('Styles'); }
                                                                if (type.id === 'post') { setActiveTab('Posts'); }
                                                            }}
                                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5 ${
                                                                (type.id === 'video' && activeTab === 'Videos' && selectedCategory !== 'music') ||
                                                                (type.id === 'music' && selectedCategory === 'music') ||
                                                                (type.id === 'styles' && activeTab === 'Styles') ||
                                                                (type.id === 'post' && activeTab === 'Posts')
                                                                    ? 'bg-white/10 border-white text-white'
                                                                    : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/20'
                                                            }`}
                                                        >
                                                            {type.icon}
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="relative group">
                                                    <div className="absolute inset-0 border border-zinc-700 group-focus-within:border-blue-500 rounded p-2 pointer-events-none transition-colors" />
                                                    <label className="block text-[12px] text-zinc-500 px-2 pt-1 group-focus-within:text-blue-500 transition-colors">Title (required)</label>
                                                    <input
                                                        type="text"
                                                        value={videoTitle}
                                                        onChange={(e) => setVideoTitle(e.target.value)}
                                                        placeholder="Add a title that describes your content"
                                                        className="w-full bg-transparent p-2 text-sm outline-none placeholder-zinc-600"
                                                    />
                                                </div>

                                                <div className="relative group">
                                                    <div className="absolute inset-0 border border-zinc-700 group-focus-within:border-blue-500 rounded p-2 pointer-events-none transition-colors" />
                                                    <label className="block text-[12px] text-zinc-500 px-2 pt-1 group-focus-within:text-blue-500 transition-colors">Description</label>
                                                    <textarea
                                                        rows={4}
                                                        value={videoDescription}
                                                        onChange={(e) => setVideoDescription(e.target.value)}
                                                        placeholder="Tell viewers about your content"
                                                        className="w-full bg-transparent p-2 text-sm outline-none resize-none placeholder-zinc-600"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-4">
                                                <h3 className="text-sm font-bold text-white">Thumbnail</h3>
                                                <p className="text-[12px] text-zinc-400">Select or upload a picture that shows what's in your video.</p>
                                                <label className="w-36 aspect-video bg-zinc-800 border-2 border-dashed border-zinc-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden">
                                                    {thumbnailData ? (
                                                        <img src={thumbnailData} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-[10px] text-zinc-500 mt-2">Upload thumbnail</span>
                                                        </>
                                                    )}
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
                                                </label>
                                            </div>
                                        </div>

                                    {/* Right: Preview & Progress */}
                                    <div className="w-full lg:w-[300px] space-y-4">
                                        <div className="bg-[#1a1a1a] rounded overflow-hidden aspect-video border border-white/5 relative">
                                            {selectedFile && (
                                                <video
                                                    src={URL.createObjectURL(selectedFile)}
                                                    className="w-full h-full object-contain"
                                                />
                                            )}
                                        </div>
                                        <div className="bg-[#1a1a1a] p-3 rounded space-y-2">
                                            <div className="flex justify-between items-center text-[12px]">
                                                <span className="text-zinc-400">Filename</span>
                                                <span className="text-white truncate max-w-[150px]">{selectedFile?.name}</span>
                                            </div>
                                            {isSaving && (
                                                <div className="space-y-1">
                                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                                    </div>
                                                    <p className="text-[10px] text-blue-400 text-center uppercase font-bold tracking-widest">Uploading {uploadProgress}%</p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            disabled={isSaving || !videoTitle}
                                            onClick={handleSave}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-full text-sm font-bold transition-all"
                                        >
                                            {isSaving ? 'Uploading...' : 'Publish'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Video published successfully!</h3>
                                    <p className="text-zinc-400 mb-8 max-w-[400px]">Your video is now live on Playra. You can manage it from your content dashboard.</p>
                                    <button
                                        onClick={resetModal}
                                        className="px-8 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
