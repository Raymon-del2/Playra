'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default function UploadPage() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-trigger file picker on mount
        const timer = setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                sessionStorage.setItem('uploadVideo', reader.result as string);
                router.push('/publish');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                sessionStorage.setItem('uploadVideo', reader.result as string);
                router.push('/publish');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
            {/* Header with back button */}
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
                    </div>
                </button>
            </main>
        </div>
    );
}
