'use client';

import { useState, useEffect, useCallback } from 'react';
import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();

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
        const result = fac.getColor(img, { 
          algorithm: 'dominant',
          mode: 'precision'
        });
        // Convert to RGBA with lower opacity for ambient glow
        const rgba = result.rgb.replace('rgb', 'rgba').replace(')', ', 0.35)');
        setColor(rgba);
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
