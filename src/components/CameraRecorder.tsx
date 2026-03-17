'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, X, Loader2, Check } from 'lucide-react';

export default function CameraRecorder() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordedChunksRef = useRef<Blob[]>([]);
    
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

    // Initialize camera with optimized constraints
    useEffect(() => {
        let stream: MediaStream | null = null;
        let isActive = true;

        const startCamera = async () => {
            setIsLoading(true);
            try {
                const constraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30, max: 60 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    },
                };

                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (!isActive) {
                    // Component unmounted before stream started - stop it
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                streamRef.current = stream;
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setPermissionDenied(false);
            } catch (err) {
                console.error("Error accessing camera:", err);
                setPermissionDenied(true);
            } finally {
                setIsLoading(false);
            }
        };

        startCamera();

        // Cleanup function
        const cleanup = () => {
            isActive = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };

        // Handle page visibility change (user switches tabs)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                cleanup();
            }
        };

        // Handle beforeunload (user navigates away)
        const handleBeforeUnload = () => {
            cleanup();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            cleanup();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [facingMode]);

    // Recording timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && !isPaused) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording, isPaused]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = useCallback(() => {
        if (!streamRef.current) return;

        recordedChunksRef.current = [];
        chunksRef.current = [];
        
        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'video/webm;codecs=vp9,opus'
        });
        
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setRecordedBlob(blob);
            setShowPreview(true);
        };

        mediaRecorder.start(100); // Collect chunks every 100ms
        setIsRecording(true);
        setIsPaused(false);
    }, []);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            if (mediaRecorderRef.current.state === 'recording') {
                // Pause: save current chunks and stop temporarily
                mediaRecorderRef.current.stop();
                recordedChunksRef.current = [...recordedChunksRef.current, ...chunksRef.current];
                chunksRef.current = [];
                setIsPaused(true);
            }
        }
    }, [isRecording]);

    const resumeRecording = useCallback(() => {
        if (!streamRef.current) return;

        // Create new recorder for the next segment
        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'video/webm;codecs=vp9,opus'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            recordedChunksRef.current = [...recordedChunksRef.current, ...chunksRef.current];
            chunksRef.current = [];
        };

        mediaRecorder.start(100);
        setIsPaused(false);
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            // Also add any remaining chunks
            recordedChunksRef.current = [...recordedChunksRef.current, ...chunksRef.current];
        }
        setIsRecording(false);
        setIsPaused(false);
        
        // Create final blob from all recorded segments
        if (recordedChunksRef.current.length > 0) {
            const finalBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            setRecordedBlob(finalBlob);
            setShowPreview(true);
        }
    }, []);

    const handleRecordButton = () => {
        if (!isRecording) {
            startRecording();
        } else if (isPaused) {
            resumeRecording();
        } else {
            pauseRecording();
        }
    };

    const handleStopButton = () => {
        stopRecording();
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const handlePost = async () => {
        if (!recordedBlob) return;
        
        // Convert blob to base64 for session storage
        const reader = new FileReader();
        reader.onloadend = () => {
            sessionStorage.setItem('uploadVideo', reader.result as string);
            router.push('/publish');
        };
        reader.readAsDataURL(recordedBlob);
    };

    const handleDiscard = () => {
        // Stop camera when discarding/leaving
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setShowPreview(false);
        setRecordedBlob(null);
        setRecordingTime(0);
        recordedChunksRef.current = [];
        chunksRef.current = [];
    };

    if (permissionDenied) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Camera Access Denied</h2>
                    <p className="text-zinc-400 mb-6">Please allow camera access in your browser settings to record videos.</p>
                    <button 
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-zinc-800 rounded-full text-white font-semibold"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (showPreview && recordedBlob) {
        const videoUrl = URL.createObjectURL(recordedBlob);
        return (
            <div className="min-h-screen bg-black flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-4">
                    <button 
                        onClick={handleDiscard}
                        className="text-white p-2"
                    >
                        <X size={24} />
                    </button>
                    <h1 className="text-white font-semibold">Preview</h1>
                    <button 
                        onClick={handlePost}
                        className="text-white font-semibold px-4 py-2 bg-blue-600 rounded-full"
                    >
                        Next
                    </button>
                </header>

                {/* Preview Video */}
                <main className="flex-1 flex flex-col items-center justify-center p-4">
                    <video
                        src={videoUrl}
                        controls
                        playsInline
                        className="w-full max-w-sm rounded-xl"
                    />
                    <p className="text-zinc-400 mt-4 text-sm">
                        Duration: {formatTime(recordingTime)}
                    </p>
                </main>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
                    <Loader2 size={40} className="text-white animate-spin" />
                </div>
            )}

            {/* Video Preview with object-fit: cover to prevent stretching */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Recording Indicator */}
            {isRecording && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
                    {isPaused && <span className="text-yellow-500 text-xs">PAUSED</span>}
                </div>
            )}

            {/* Camera UI Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between pb-12 pt-12 px-6 pointer-events-none">
                {/* Top Controls */}
                <div className="flex justify-between items-center w-full pointer-events-auto">
                    <button 
                        onClick={() => {
                            // Stop camera before going back
                            if (streamRef.current) {
                                streamRef.current.getTracks().forEach(track => track.stop());
                                streamRef.current = null;
                            }
                            if (videoRef.current) {
                                videoRef.current.srcObject = null;
                            }
                            router.back();
                        }}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Bottom Controls */}
                <div className="flex justify-between items-center w-full pointer-events-auto">
                    {/* Empty for spacing */}
                    <div className="w-14" />

                    {/* Record/Pause Button */}
                    <div className="flex flex-col items-center gap-3">
                        {!isRecording ? (
                            // Start Recording
                            <button 
                                onClick={startRecording}
                                className="p-1 rounded-full border-4 border-white"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-500 active:scale-95 transition-transform" />
                            </button>
                        ) : (
                            // Pause/Resume or Stop controls
                            <div className="flex items-center gap-6">
                                {/* Stop Button */}
                                <button 
                                    onClick={handleStopButton}
                                    className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center active:scale-90 transition-transform"
                                >
                                    <div className="w-4 h-4 bg-white rounded-sm" />
                                </button>
                                
                                {/* Pause/Resume Button */}
                                <button 
                                    onClick={handleRecordButton}
                                    className={`p-1 rounded-full border-4 ${isPaused ? 'border-yellow-500' : 'border-white'}`}
                                >
                                    <div className={`w-16 h-16 rounded-full active:scale-95 transition-transform flex items-center justify-center ${
                                        isPaused ? 'bg-yellow-500' : 'bg-white'
                                    }`}>
                                        {isPaused ? (
                                            <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                                        ) : (
                                            <div className="flex gap-1">
                                                <div className="w-2 h-6 bg-red-500 rounded-sm" />
                                                <div className="w-2 h-6 bg-red-500 rounded-sm" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        )}
                        
                        {!isRecording && <span className="text-white/60 text-xs">Tap to record</span>}
                    </div>

                    {/* Flip Camera Button */}
                    <button 
                        onClick={toggleCamera}
                        disabled={isRecording}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 active:scale-90 transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
