'use client';
import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [stage, setStage] = useState('logo');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setStage('exit'), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || stage === 'exit') return null;

  return (
    <div suppressHydrationWarning className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <img 
        suppressHydrationWarning 
        src="/play-logo.png" 
        alt="Playra Logo" 
        className="w-32 md:w-40"
      />
    </div>
  );
}
