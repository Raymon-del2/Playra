'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const [isVisible, setIsVisible] = useState(true);
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Step 0: Start (Dark)
        // Step 1: Sparkle appears
        const t1 = setTimeout(() => setStep(1), 500);
        // Step 2: Aura expands
        const t2 = setTimeout(() => setStep(2), 1500);
        // Step 3: Logo resolves
        const t3 = setTimeout(() => setStep(3), 2500);
        // Step 4: Fade out
        const t4 = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onFinish, 700);
        }, 4000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [onFinish]);

    return (
        <div
            className={`fixed inset-0 z-[10000] bg-[#050505] flex items-center justify-center transition-all duration-700 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 scale-105 pointer-events-none'}`}
        >
            <div className="relative flex flex-col items-center">
                {/* Aura Bloom */}
                <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full transition-all duration-1000 blur-[80px] ${step >= 2 ? 'bg-blue-600/20 scale-150' : 'bg-transparent scale-50'}`}
                />
                <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full transition-all duration-1000 delay-300 blur-[60px] ${step >= 2 ? 'bg-purple-600/10 scale-125' : 'bg-transparent scale-50'}`}
                />

                {/* Central Sparkle / Icon */}
                <div className="relative z-10">
                    <div className={`transition-all duration-1000 ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                        <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            <defs>
                                <linearGradient id="styles-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#60A5FA" />
                                    <stop offset="100%" stopColor="#C084FC" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M50 20 C60 20 65 35 80 50 C65 65 60 80 50 80 C40 80 35 65 20 50 C35 35 40 20 50 20"
                                fill="none"
                                stroke="url(#styles-grad)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ${step >= 3 ? 'animate-[draw-logo_2.5s_ease-out_forwards]' : 'opacity-0'}`}
                                style={{
                                    strokeDasharray: 400,
                                    strokeDashoffset: 400,
                                    fill: step >= 3 ? 'rgba(255,255,255,0.03)' : 'transparent',
                                }}
                            />
                            {/* Inner Pulse */}
                            <circle
                                cx="50" cy="50" r="3"
                                className={`fill-white transition-all duration-700 ${step >= 1 ? 'animate-ping' : 'opacity-0'}`}
                            />
                        </svg>
                    </div>
                </div>

                {/* Text branding */}
                <div className="mt-12 overflow-hidden flex flex-col items-center">
                    <h1
                        className={`text-4xl font-black text-white tracking-[0.4em] uppercase transition-all duration-1000 delay-500 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        Playra
                    </h1>
                    <div className={`h-px w-24 bg-gradient-to-r from-transparent via-zinc-800 to-transparent mt-5 transition-all duration-1000 delay-700 ${step >= 3 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} />
                    <p
                        className={`text-[9px] font-bold text-zinc-500 uppercase tracking-[0.5em] mt-6 transition-all duration-1000 delay-1000 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}
                    >
                        Styles Discovery
                    </p>
                </div>
            </div>

            {/* Loading Indicator */}
            <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                <div className="w-12 h-0.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[loading-bar_1.5s_infinite_ease-in-out]" />
                </div>
            </div>
        </div>
    );
}
