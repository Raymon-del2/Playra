'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  startStream: () => Promise<void>;
  stopStream: () => void;
  joinStream: (roomId: string) => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
}

// Free public STUN servers
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function useWebRTC(isCreator: boolean): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const stopStream = useCallback(() => {
    // Stop all tracks
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());

    // Close connections
    pcRef.current?.close();
    wsRef.current?.close();

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    pcRef.current = null;
    wsRef.current = null;
    roomIdRef.current = null;
  }, [localStream, remoteStream]);

  // Creator starts broadcasting
  const startStream = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate
          }));
        }
      };

      setIsConnected(true);
      setIsConnecting(false);
    } catch (err) {
      console.error('Failed to start stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera/microphone');
      setIsConnecting(false);
    }
  }, []);

  // Viewer joins a stream
  const joinStream = useCallback(async (roomId: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      roomIdRef.current = roomId;

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Handle incoming stream
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStream(stream);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            roomId
          }));
        }
      };

      // Connect to signaling server
      // For now, we'll use a simple polling mechanism via Supabase
      // In production, you'd use a dedicated WebSocket server
      
      // For Phase 1, we'll implement a simple offer/answer exchange
      // This will be replaced with proper signaling in Phase 2
      
      setIsConnected(true);
      setIsConnecting(false);
    } catch (err) {
      console.error('Failed to join stream:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to stream');
      setIsConnecting(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
    error,
    startStream,
    stopStream,
    joinStream,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff
  };
}
