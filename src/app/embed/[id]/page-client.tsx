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
  const [showControls, setShowControls] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showMoreVideos, setShowMoreVideos] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

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
        
        // Load related videos
        loadRelatedVideos(data.channel_id);
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

  const loadRelatedVideos = async (channelId: string) => {
    try {
      const res = await fetch(`/api/videos?channel_id=${channelId}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setRelatedVideos(data.videos || []);
      }
    } catch (err) {
      console.error('Failed to load related videos');
    }
  };

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
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-4 m-0">
        <img src="/offlinee.png" alt="Playra" className="w-16 h-16 mb-4" />
        <p className="text-gray-800 text-lg font-medium mb-2">Sorry, something might have gone wrong</p>
        <p className="text-gray-500 text-sm">Please check your internet connection</p>
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/watch/${video.id}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleControlsShow = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime + (e.deltaY > 0 ? -5 : 5);
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, videoRef.current.duration));
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  return (
    <div className="w-full h-full bg-black relative group m-0 p-0" onMouseMove={handleControlsShow} onWheel={handleWheel}>
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
        <div className="absolute inset-0 flex items-center justify-center z-20" onClick={togglePlay}>
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

      {/* Controls overlay - shows on hover/playing */}
      {showControls && (
        <div className="absolute inset-0 z-20" onClick={togglePlay}>
          {/* Progress bar */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 cursor-pointer hover:h-2 transition-all"
            onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
          >
            <div 
              className="h-full bg-red-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Top-left: Channel info */}
          <div className="absolute top-4 left-4 flex items-center gap-3">
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

          {/* Top-right: Action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white hover:bg-black/80 transition-all"
            >
              {shareCopied ? (
                <>
                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                  <span>Share</span>
                </>
              )}
            </button>

            {/* More videos button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowMoreVideos(!showMoreVideos); }}
              className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white hover:bg-black/80 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
              <span>More videos</span>
            </button>
          </div>

          {/* Bottom-right: Watch on Playra */}
          <div className="absolute bottom-8 right-4">
            <a 
              href={`/watch/${video.id}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-5 py-3 rounded-2xl text-base text-white hover:bg-black/80 transition-all shadow-lg"
            >
              <img src="/offlinee.png" alt="Playra" className="h-6 w-auto object-contain" />
              <span className="font-medium">Watch on Playra</span>
            </a>
          </div>
        </div>
      )}

      {/* More videos panel */}
      {showMoreVideos && (
        <div className="absolute inset-0 bg-black/95 z-30 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white text-xl font-bold">More videos</h2>
              <button
                onClick={() => setShowMoreVideos(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {relatedVideos.map((v) => (
                <a
                  key={v.id}
                  href={`/embed/${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-white text-sm mt-2 line-clamp-2">{v.title}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prevent right-click download */}
      <div 
        className="absolute inset-0 z-10" 
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
