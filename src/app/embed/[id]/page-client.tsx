'use client';

import { useState, useEffect, useRef } from 'react';

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

export default function EmbedPageClient({ params }: EmbedPageProps) {
  const [video, setVideo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayBtn, setShowPlayBtn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        if (!navigator.onLine) {
          setIsOffline(true);
          setIsLoading(false);
          return;
        }
        const { id } = await params;
        const res = await fetch(`/api/videos/${id}`);
        if (!res.ok) throw new Error('Video not found');
        const data = await res.json();
        setVideo(data);
      } catch (err) {
        if (!navigator.onLine) {
          setIsOffline(true);
        } else {
          setError('Failed to load video');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadVideo();
  }, [params]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  if (isLoading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center m-0 p-0">
        <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 m-0">
        <svg className="w-16 h-16 text-white/40 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <p className="text-white/80 text-lg font-medium mb-2">Something went wrong</p>
        <p className="text-white/50 text-sm mb-4">Check your internet connection</p>
        <a href="/" target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">
          Watch on Playra
        </a>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 m-0">
        <svg className="w-16 h-16 text-white/40 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-white/80 text-lg font-medium mb-2">Something went wrong</p>
        <a href="/" target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">
          Watch on Playra
        </a>
      </div>
    );
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        setShowPlayBtn(false);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowPlayBtn(true);
      }
    }
  };

  return (
    <div className="w-full h-full bg-black relative group m-0 p-0 cursor-pointer" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={video.video_url}
        poster={video.thumbnail_url}
        className="w-full h-full object-contain"
        playsInline
        onPlay={() => { setIsPlaying(true); setShowPlayBtn(false); }}
        onPause={() => { setIsPlaying(false); setShowPlayBtn(true); }}
        onEnded={() => { setIsPlaying(false); setShowPlayBtn(true); }}
      />
      
      {/* Play button overlay - shows when not playing */}
      {showPlayBtn && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl scale-150" />
            <img
              src="/logo-play.png"
              alt="Play"
              className="w-20 h-20 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-200"
            />
          </div>
        </div>
      )}

      {/* Pause indicator - shows on hover when playing */}
      {isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm p-4 rounded-full">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Top-left: Channel info (like YouTube embed) */}
      <div className="absolute top-4 left-4 flex items-center gap-3 z-20">
        {(video.channel_avatar || video.channel_name) && (
          <>
            {video.channel_avatar && (
              <img 
                src={video.channel_avatar} 
                alt="" 
                className="w-10 h-10 rounded-full border border-white/20"
              />
            )}
            <div className="text-white drop-shadow-lg">
              <p className="font-bold text-base leading-tight drop-shadow-md">{video.title}</p>
              {video.channel_name && (
                <p className="text-sm text-white/80 drop-shadow-md">{video.channel_name}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom-right: Watch on Playra (like YouTube's embed branding) */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <a 
          href={`/watch/${video.id}`} 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-white hover:bg-black/80 transition-colors"
        >
          <span>Watch on</span>
          <img src="/offlinee.png" alt="Playra" className="h-5 w-auto object-contain" />
        </a>
      </div>

      {/* Prevent right-click download */}
      <div 
        className="absolute inset-0 z-10" 
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
