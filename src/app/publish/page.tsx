'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Camera, Loader2 } from 'lucide-react';
import { getActiveProfile } from '@/app/actions/profile';

export default function PublishPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Check for direct upload URL first, then fall back to browser base64
        const urlStored = sessionStorage.getItem('uploadVideoUrl');
        const base64Stored = sessionStorage.getItem('uploadVideo');
        
        if (urlStored) {
            setVideoData(urlStored);
        } else if (base64Stored) {
            setVideoData(base64Stored);
        }
        
        // Get active profile
        getActiveProfile().then(p => setProfile(p));
    }, []);

    const handleThumbnailClick = () => {
        fileInputRef.current?.click();
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnail(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePublish = async () => {
        if (!title.trim() || !videoData) return;
        
        setIsPublishing(true);
        
        // Store publish data for studio content page
        // Note: videoData is passed via URL or stored separately since it's too large for localStorage
        try {
            // Only store metadata in sessionStorage (thumbnail + text is usually under quota)
            const publishData = {
                title: title.trim(),
                description: description.trim(),
                thumbnail,
                hasVideoData: true // Flag to indicate video exists
            };
            
            const dataString = JSON.stringify(publishData);
            
            // Check size before storing (rough estimate: 1 char ≈ 2 bytes in UTF-16)
            if (dataString.length > 2000000) { // ~4MB limit with buffer
                throw new Error('Data too large for storage');
            }
            
            sessionStorage.setItem('publishData', dataString);
            
            // Store video data separately or pass via state
            // For large videos, we use a temporary approach - store in a global window var
            if (typeof window !== 'undefined') {
                (window as any).__tempVideoData = videoData;
            }
        } catch (e) {
            console.warn('Failed to store in sessionStorage, using fallback:', e);
            // Fallback: store minimal data and pass video via window object
            sessionStorage.setItem('publishData', JSON.stringify({
                title: title.trim(),
                description: description.trim(),
                hasVideoData: true,
                useFallback: true
            }));
            if (typeof window !== 'undefined') {
                (window as any).__tempVideoData = videoData;
                (window as any).__tempThumbnail = thumbnail;
            }
        }
        
        // Navigate to studio content for final processing
        router.push('/studio/content?publish=true');
    };

    const isValid = title.trim().length > 0;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans">
            {/* Top Navigation */}
            <header className="flex items-center justify-between px-4 py-4 border-b border-[#1A1A1A]">
                <button 
                    onClick={() => router.back()}
                    className="text-[#888888] hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-sm font-medium tracking-wide">New Post</h1>
                <div className="w-6" /> {/* Spacer for centering */}
            </header>

            <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                {/* Video Preview */}
                {videoData && (
                    <section className="space-y-3">
                        <label className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                            Video Preview
                        </label>
                        <div className="relative w-full aspect-video bg-[#121212] border border-[#222222] rounded-xl overflow-hidden">
                            <video 
                                src={videoData} 
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                            />
                        </div>
                    </section>
                )}

                {/* Thumbnail Upload Section */}
                <section className="space-y-3">
                    <label className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                        Thumbnail
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailSelect}
                    />
                    <div 
                        onClick={handleThumbnailClick}
                        className="relative w-full aspect-video bg-[#121212] border border-[#222222] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#444444] transition-all group overflow-hidden"
                    >
                        {thumbnail ? (
                            <img 
                                src={thumbnail} 
                                alt="Thumbnail" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center space-y-2 text-[#666666] group-hover:text-white transition-colors">
                                <Camera size={28} />
                                <span className="text-sm font-medium">Tap to upload thumbnail</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Video Details Section */}
                <section className="space-y-5">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                            Title
                        </label>
                        <input 
                            type="text" 
                            placeholder="Give your video a title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-b border-[#222222] py-2 text-lg focus:outline-none focus:border-white transition-colors placeholder:text-[#444444]"
                        />
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                            Description
                        </label>
                        <textarea 
                            placeholder="Tell viewers about your video..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full bg-[#121212] border border-[#222222] rounded-xl p-3 text-sm focus:outline-none focus:border-[#444444] transition-colors placeholder:text-[#444444] resize-none"
                        />
                    </div>
                </section>

                {/* Profile Info */}
                {profile && (
                    <section className="flex items-center gap-3 py-2">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold">
                                    {profile.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{profile.name}</p>
                            <p className="text-xs text-[#888888]">Publishing as</p>
                        </div>
                    </section>
                )}
            </main>

            {/* Bottom Publish Bar */}
            <footer className="p-4 border-t border-[#1A1A1A] bg-[#0A0A0A]">
                <button 
                    onClick={handlePublish}
                    disabled={!isValid || isPublishing}
                    className="w-full bg-white text-black font-semibold py-3.5 rounded-full flex items-center justify-center space-x-2 hover:bg-[#E5E5E5] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPublishing ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Upload size={18} />
                            <span>Publish to Playra</span>
                        </>
                    )}
                </button>
            </footer>
        </div>
    );
}
