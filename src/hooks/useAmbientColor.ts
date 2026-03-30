'use client';

import { useState, useEffect } from 'react';

interface UseAmbientColorOptions {
  src: string | undefined;
  defaultColor?: string;
}

export function useAmbientColor({ src, defaultColor = 'rgba(255,255,255,0.1)' }: UseAmbientColorOptions) {
  const [color, setColor] = useState(defaultColor);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setColor(defaultColor);
      return;
    }

    setIsLoading(true);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsLoading(false);
          return;
        }
        
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < imageData.length; i += 4) {
          // Skip white/black pixels and transparent
          const alpha = imageData[i + 3];
          if (alpha > 200 && imageData[i] < 250 && imageData[i] > 10) {
            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
            count++;
          }
        }
        
        if (count > 0) {
          const dominantColor = `rgba(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)}, 0.4)`;
          setColor(dominantColor);
        }
      } catch (e) {
        setColor(defaultColor);
      } finally {
        setIsLoading(false);
      }
    };

    img.onerror = () => {
      setColor(defaultColor);
      setIsLoading(false);
    };

    img.src = src;
  }, [src, defaultColor]);

  return { color, isLoading };
}
