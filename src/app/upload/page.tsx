'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getActiveProfile } from '@/app/actions/profile';

export default function UploadPage() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const uploadDirectToSupabase = async (file: File) => {
        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const profile = await getActiveProfile();
            const userId = profile?.id || 'anonymous';
            const timestamp = Date.now();
            const fileName = `${userId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            
            const { data, error: uploadError } = await supabase.storage
                .from('videos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            setUploadProgress(100);

            const { data: urlData } = supabase.storage
                .from('videos')
                .getPublicUrl(fileName);

            sessionStorage.setItem('uploadVideoUrl', urlData.publicUrl);
            sessionStorage.setItem('uploadVideoName', file.name);
            router.push('/publish');
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload video');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            uploadDirectToSupabase(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('video/')) {
            uploadDirectToSupabase(file);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
            <header className="flex items-center gap-4 px-4 py-4 border-b border-[#1A1A1A]">
                <button 
                    onClick={() => router.back()}
                    className="text-[#888888] hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-sm font-medium tracking-wide">Upload Video</h1>
            </header>

            <main 
                className="flex-1 flex flex-col items-center justify-center p-6"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {isUploading ? (
                    <div className="text-center">
                        <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-white font-semibold mb-2">Uploading directly to server...</p>
                        <div className="w-64 h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-[#666666] text-sm mt-2">For large & old videos</p>
                    </div>
                ) : error ? (
                    <div className="text-center">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => { setError(null); fileInputRef.current?.click(); }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full max-w-sm aspect-[3/4] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 transition-all ${
                            isDragging 
                                ? 'border-white bg-white/5' 
                                : 'border-[#333333] hover:border-[#555555]'
                        }`}
                    >
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                            isDragging ? 'bg-white/10' : 'bg-[#1A1A1A]'
                        }`}>
                            <ImageIcon size={32} className={`transition-colors ${
                                isDragging ? 'text-white' : 'text-[#888888]'
                            }`} />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-semibold mb-1">
                                {isDragging ? 'Drop video here' : 'Tap to select video'}
                            </p>
                            <p className="text-[#666666] text-sm">From your gallery</p>
                            <p className="text-[#444444] text-xs mt-2">Max 50MB for browser upload</p>
                        </div>
                    </button>
                )}
            </main>
        </div>
    );
}
