'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const [isFading, setIsFading] = useState(false);
    const [showWordmark, setShowWordmark] = useState(false);

    useEffect(() => {
        // Phase 1: Draw Logo (1.5s)
        // Phase 2: Show Wordmark (0.5s delay)
        // Phase 3: Fade Out (0.5s)
        const wordmarkTimer = setTimeout(() => setShowWordmark(true), 1200);
        const fadeTimer = setTimeout(() => {
            setIsFading(true);
            setTimeout(onFinish, 500);
        }, 2800);

        return () => {
            clearTimeout(wordmarkTimer);
            clearTimeout(fadeTimer);
        };
    }, [onFinish]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
            style={{
                background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0f 50%, #050507 100%)'
            }}
        >
            {/* Aura Glow Background */}
            <div
                className="absolute inset-0 aura-glow"
                style={{
                    background: 'radial-gradient(circle at center, rgba(37, 99, 235, 0.15) 0%, rgba(147, 51, 234, 0.1) 30%, transparent 60%)'
                }}
            />

            {/* The Logo Container */}
            <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG with Gradient Stroke */}
                <svg
                    className="absolute inset-0 w-full h-full drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                    viewBox="0 0 100 100"
                >
                    <defs>
                        <linearGradient id="playra-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* The Play Triangle - Stroke Draw Animation */}
                    <path
                        d="M30 20 L80 50 L30 80 Z"
                        fill="none"
                        stroke="url(#playra-gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="animate-draw-logo"
                    />
                </svg>
            </div>

            {/* Wordmark - Fades in after logo draws */}
            <div
                className={`mt-8 transition-all duration-700 ${showWordmark ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
                <span className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                    PLAYRA
                </span>
            </div>

            {/* Subtle Loading Indicator */}
            <div
                className={`absolute bottom-20 transition-opacity duration-500 ${showWordmark ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="w-16 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shimmer-effect"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}

