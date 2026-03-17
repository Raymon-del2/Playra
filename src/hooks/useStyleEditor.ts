'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RecordingSegment } from './useCameraRecorder';

export interface AudioLayer {
    id: string;
    blob: Blob;
    startTime: number; // in seconds, relative to video start
    volume: number;
    duration: number;
}

export interface TextLayer {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    scale: number;
    color: string;
    style: 'classic' | 'neon' | 'brush';
}

interface UseStyleEditorOptions {
    segments: RecordingSegment[]; // Changed from videoBlob to segments
    initialDuration?: number;
}

export function useStyleEditor({ segments, initialDuration }: UseStyleEditorOptions) {
    const [audioLayers, setAudioLayers] = useState<AudioLayer[]>([]);
    const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Duration is sum of segments or initialDuration
    const calculatedDuration = segments.reduce((acc, s) => acc + s.duration, 0);
    const [duration, setDuration] = useState(initialDuration || calculatedDuration);

    // Merge all segments into a single blob for seamless playback
    const mergedBlobUrl = useMemo(() => {
        console.log('useStyleEditor: Creating merged blob from', segments.length, 'segments');
        if (segments.length === 0) return null;
        const allBlobs = segments.map(s => s.blob);
        const mergedBlob = new Blob(allBlobs, { type: 'video/webm' });
        const url = URL.createObjectURL(mergedBlob);
        console.log('useStyleEditor: Created merged blob URL:', url, 'size:', mergedBlob.size);
        return url;
    }, [segments]);

    // Cleanup merged blob URL on unmount or when segments change
    useEffect(() => {
        return () => {
            if (mergedBlobUrl) {
                URL.revokeObjectURL(mergedBlobUrl);
            }
        };
    }, [mergedBlobUrl]);

    // Use callback ref pattern to handle conditional rendering of video element
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

    const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

    // Update duration if segments change (e.g. initial load)
    useEffect(() => {
        setDuration(initialDuration || calculatedDuration);
    }, [segments, initialDuration, calculatedDuration]);

    // Set merged video source when video element is available
    useEffect(() => {
        if (videoElement && mergedBlobUrl) {
            videoElement.src = mergedBlobUrl;
        }
    }, [videoElement, mergedBlobUrl]);

    // Initialize audio element for a layer
    const createAudioElement = useCallback((layer: AudioLayer) => {
        const audio = new Audio(URL.createObjectURL(layer.blob));
        audio.volume = layer.volume;
        audioElementsRef.current.set(layer.id, audio);
        return audio;
    }, []);

    const removeAudioElement = useCallback((id: string) => {
        const audio = audioElementsRef.current.get(id);
        if (audio) {
            audio.pause();
            URL.revokeObjectURL(audio.src);
            audioElementsRef.current.delete(id);
        }
    }, []);

    // Add Audio Layer
    const addAudioLayer = useCallback((blob: Blob, startTime: number) => {
        const id = Date.now().toString();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onloadedmetadata = () => {
            const newLayer: AudioLayer = {
                id,
                blob,
                startTime,
                volume: 1,
                duration: audio.duration,
            };
            setAudioLayers(prev => [...prev, newLayer]);
            audioElementsRef.current.set(id, audio);
        };
    }, []);

    const removeAudioLayer = useCallback((id: string) => {
        removeAudioElement(id);
        setAudioLayers(prev => prev.filter(l => l.id !== id));
    }, [removeAudioElement]);

    // Text Layers
    const addTextLayer = useCallback((text: string, startTime: number = 0) => {
        const newLayer: TextLayer = {
            id: Date.now().toString(),
            text,
            startTime,
            endTime: startTime + 3,
            x: 50,
            y: 50,
            scale: 1,
            color: '#ffffff',
            style: 'classic',
        };
        setTextLayers(prev => [...prev, newLayer]);
    }, []);

    const updateTextLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
        setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }, []);

    const removeTextLayer = useCallback((id: string) => {
        setTextLayers(prev => prev.filter(l => l.id !== id));
    }, []);

    // Playback Control
    const togglePlay = useCallback(() => {
        if (videoElement) {
            if (isPlaying) {
                videoElement.pause();
                audioElementsRef.current.forEach(audio => audio.pause());
            } else {
                const playPromise = videoElement.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        if (error.name !== 'AbortError') console.error('Video play error:', error);
                    });
                }
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying, videoElement]);

    // Calculate segment start times
    const getSegmentStartTimes = useCallback(() => {
        let t = 0;
        return segments.map(s => {
            const start = t;
            t += s.duration;
            return start;
        });
    }, [segments]);

    const seek = useCallback((time: number) => {
        if (videoElement) {
            videoElement.currentTime = time;
        }
        setCurrentTime(time);

        // Sync audio
        audioElementsRef.current.forEach((audio, id) => {
            const layer = audioLayers.find(l => l.id === id);
            if (layer) {
                const audioTime = time - layer.startTime;
                if (audioTime >= 0 && audioTime < layer.duration) {
                    audio.currentTime = audioTime;
                    if (isPlaying) {
                        const p = audio.play();
                        if (p !== undefined) p.catch(e => { if (e.name !== 'AbortError') console.error(e); });
                    }
                } else {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        });
    }, [audioLayers, isPlaying, videoElement]);

    // Handle video ended - just update state, don't reset video position
    const handleEnded = useCallback(() => {
        console.log('Video ended, currentTime:', videoElement?.currentTime, 'duration:', videoElement?.duration);
        setIsPlaying(false);
    }, [videoElement]);

    // Sync Loop (runs on timeupdate from video)
    const handleTimeUpdate = useCallback(() => {
        if (videoElement) {
            const currentTime = videoElement.currentTime;
            setCurrentTime(currentTime);

            // Audio Sync
            if (isPlaying) {
                audioElementsRef.current.forEach((audio, id) => {
                    const layer = audioLayers.find(l => l.id === id);
                    if (layer) {
                        const audioTime = currentTime - layer.startTime;
                        if (audioTime >= 0 && audioTime < layer.duration) {
                            if (audio.paused) {
                                audio.currentTime = audioTime;
                                const p = audio.play();
                                if (p !== undefined) p.catch(e => { if (e.name !== 'AbortError') console.error(e); });
                            }
                            if (Math.abs(audio.currentTime - audioTime) > 0.3) {
                                audio.currentTime = audioTime;
                            }
                        } else {
                            if (!audio.paused) audio.pause();
                        }
                    }
                });
            }
        }
    }, [audioLayers, isPlaying, videoElement]);

    const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
        // Just for reference, not setting global duration here anymore
    }, []);

    return {
        audioLayers,
        textLayers,
        currentTime,
        duration,
        isPlaying,
        videoElement,
        mergedBlobUrl,
        setVideoRef: setVideoElement,
        addAudioLayer,
        removeAudioLayer,
        addTextLayer,
        updateTextLayer,
        removeTextLayer,
        togglePlay,
        seek,
        handleTimeUpdate,
        handleLoadedMetadata,
        handleEnded,
    };
}
