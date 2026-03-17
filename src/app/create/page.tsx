'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, ArrowLeft, X, FlipHorizontal, Zap, Timer } from 'lucide-react';

export default function CreatePage() {
    const router = useRouter();
    const [mode, setMode] = useState<'select' | 'record' | 'upload'>('select');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            // Navigate to publish page with file info
            const reader = new FileReader();
            reader.onloadend = () => {
                sessionStorage.setItem('uploadVideo', reader.result as string);
                router.push('/publish');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Record mode view
    if (mode === 'record') {
        return (
            <div className="min-h-screen bg-black flex flex-col">
                {/* Camera Viewfinder */}
                <div className="flex-1 relative bg-zinc-900">
                    {/* Mock camera preview */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-zinc-600 text-center">
                            <Camera size={48} className="mx-auto mb-4" />
                            <p className="text-sm">Camera preview would appear here</p>
                        </div>
                    </div>

                    {/* Floating Controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                        <button 
                            onClick={() => setMode('select')}
                            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex gap-3">
                            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                                <FlipHorizontal size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                                <Zap size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                                <Timer size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Record Controls */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
                        <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                            <button className="w-16 h-16 rounded-full bg-red-500 active:scale-95 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Upload mode view
    if (mode === 'upload') {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
                <header className="flex items-center justify-between px-4 py-4 border-b border-[#1A1A1A]">
                    <button 
                        onClick={() => setMode('select')}
                        className="text-[#888888] hover:text-white transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-sm font-medium tracking-wide">Upload Video</h1>
                    <div className="w-6" />
                </header>

                <main className="flex-1 flex flex-col items-center justify-center p-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    
                    <button
                        onClick={handleUploadClick}
                        className="w-full max-w-sm aspect-[3/4] border-2 border-dashed border-[#333333] rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-[#555555] transition-colors group"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#222222] transition-colors">
                            <Upload size={32} className="text-[#888888] group-hover:text-white transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-semibold mb-1">Tap to select video</p>
                            <p className="text-[#666666] text-sm">From your gallery</p>
                        </div>
                    </button>
                </main>
            </div>
        );
    }

    // Select mode (default)
    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
            <header className="flex items-center justify-between px-4 py-4 border-b border-[#1A1A1A]">
                <button 
                    onClick={() => router.back()}
                    className="text-[#888888] hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
                <h1 className="text-sm font-medium tracking-wide">Create</h1>
                <div className="w-6" />
            </header>

            <main className="flex-1 p-6">
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                    {/* Record Option */}
                    <button
                        onClick={() => setMode('record')}
                        className="aspect-square rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 flex flex-col items-center justify-center gap-3 hover:border-white/20 transition-all active:scale-95"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <Camera size={28} className="text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold">Record</p>
                            <p className="text-[#888888] text-xs">Create a video</p>
                        </div>
                    </button>

                    {/* Upload Option */}
                    <button
                        onClick={() => setMode('upload')}
                        className="aspect-square rounded-3xl bg-[#1A1A1A] border border-[#333333] flex flex-col items-center justify-center gap-3 hover:border-[#555555] transition-all active:scale-95"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-[#222222] flex items-center justify-center">
                            <Upload size={28} className="text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold">Upload</p>
                            <p className="text-[#888888] text-xs">From gallery</p>
                        </div>
                    </button>

                    {/* Live Option */}
                    <button
                        onClick={() => router.push('/studio/live')}
                        className="aspect-square rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center gap-3 hover:border-red-500/40 transition-all active:scale-95"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="text-red-400 font-bold">Go Live</p>
                            <p className="text-red-400/60 text-xs">Start streaming</p>
                        </div>
                    </button>

                    {/* Short Option */}
                    <button
                        onClick={() => router.push('/create/style')}
                        className="aspect-square rounded-3xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 border border-white/10 flex flex-col items-center justify-center gap-3 hover:border-white/20 transition-all active:scale-95"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold">Style</p>
                            <p className="text-[#888888] text-xs">Short vertical</p>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
}
