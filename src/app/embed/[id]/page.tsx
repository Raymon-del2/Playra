'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

export default function EmbedPage({ params }: EmbedPageProps) {
  const [video, setVideo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const { id } = await params;
        const res = await fetch(`/api/videos/${id}`);
        if (!res.ok) throw new Error('Video not found');
        const data = await res.json();
        setVideo(data);
      } catch (err) {
        setError('Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };
    loadVideo();
  }, [params]);

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4">
        <p className="text-white/60 text-sm mb-2">Video not available</p>
        <Link href="/" className="text-blue-400 text-xs hover:underline">
          Watch on Playra
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative group">
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url}
        className="w-full h-full object-contain"
        controls
        controlsList="nodownload noplaybackrate"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />
      
      {/* Watermark */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link 
          href={`/watch/${video.id}`} 
          target="_blank"
          className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white/90 hover:bg-black/80 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Watch on Playra
        </Link>
      </div>

      {/* Prevent right-click download */}
      <div 
        className="absolute inset-0 z-10" 
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
