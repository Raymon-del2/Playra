'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AppInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed or dismissed
        if (typeof window !== 'undefined') {
            const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone === true;
            setIsStandalone(isStandaloneMode);

            const wasDismissed = localStorage.getItem('playra_banner_dismissed');
            if (wasDismissed) {
                const dismissedTime = parseInt(wasDismissed);
                // Show again after 7 days
                if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                    setDismissed(true);
                }
            }

            // Check if iOS
            const userAgent = window.navigator.userAgent.toLowerCase();
            const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
            setIsIOS(isIOSDevice);

            // Check if mobile
            const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

            if (isMobile && !isStandaloneMode && !dismissed) {
                setShowBanner(true);
            }
        }

        // Listen for install prompt (Android/Chrome)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, [dismissed]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        setDismissed(true);
        localStorage.setItem('playra_banner_dismissed', Date.now().toString());
    };

    if (isStandalone || !showBanner || dismissed) {
        return null;
    }

    return (
        <div className="fixed z-[99] lg:hidden animate-slide-in-up" style={{ bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', left: '1rem', right: '1rem' }}>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl">
                <div className="flex items-start gap-3">
                    {/* App Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <img src="/Playra.png" alt="Playra" className="w-8 h-8" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm">Get the Playra App</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            {isIOS
                                ? 'Tap Share → Add to Home Screen'
                                : 'Install for a better experience'
                            }
                        </p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleDismiss}
                        className="text-zinc-500 hover:text-white p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Action Button */}
                <div className="mt-3 flex gap-2">
                    {isIOS ? (
                        <button
                            onClick={handleDismiss}
                            className="flex-1 bg-white text-black py-2.5 rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            How to Install
                        </button>
                    ) : deferredPrompt ? (
                        <button
                            onClick={handleInstall}
                            className="flex-1 bg-white text-black py-2.5 rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Install App
                        </button>
                    ) : (
                        <a
                            href="/download"
                            className="flex-1 bg-white text-black py-2.5 rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download APK
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
