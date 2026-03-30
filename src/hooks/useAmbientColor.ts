'use client';

import { useState, useEffect } from 'react';

interface UseAmbientColorOptions {
  src: string | undefined;
  defaultColor?: string;
}

export function useAmbientColor({ src, defaultColor = 'rgba(100,100,100,0.2)' }: UseAmbientColorOptions) {
  const [color, setColor] = useState(defaultColor);

  useEffect(() => {
    if (!src) {
      setColor(defaultColor);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setColor(defaultColor);
          return;
        }
        
        // Small canvas for performance
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        
        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        // Sample every 4th pixel for performance
        for (let i = 0; i < imageData.length; i += 16) {
          const pixelR = imageData[i];
          const pixelG = imageData[i + 1];
          const pixelB = imageData[i + 2];
          const alpha = imageData[i + 3];
          
          // Skip transparent, white, black, and gray pixels
          if (alpha > 100 && 
              !(pixelR > 240 && pixelG > 240 && pixelB > 240) && // Not white
              !(pixelR < 20 && pixelG < 20 && pixelB < 20) &&   // Not black
              !(Math.abs(pixelR - pixelG) < 15 && Math.abs(pixelG - pixelB) < 15) // Not gray
          ) {
            r += pixelR;
            g += pixelG;
            b += pixelB;
            count++;
          }
        }
        
        if (count > 0) {
          // Boost saturation
          const avgR = r / count;
          const avgG = g / count;
          const avgB = b / count;
          
          // Find dominant color and boost it
          const max = Math.max(avgR, avgG, avgB);
          const boost = 1.3;
          
          const boostedR = Math.min(255, avgR * (avgR === max ? boost : 1));
          const boostedG = Math.min(255, avgG * (avgG === max ? boost : 1));
          const boostedB = Math.min(255, avgB * (avgB === max ? boost : 1));
          
          const dominantColor = `rgba(${Math.round(boostedR)}, ${Math.round(boostedG)}, ${Math.round(boostedB)}, 0.4)`;
          setColor(dominantColor);
        } else {
          setColor(defaultColor);
        }
      } catch (e) {
        setColor(defaultColor);
      }
    };

    img.onerror = () => {
      setColor(defaultColor);
    };

    img.src = src;
  }, [src, defaultColor]);

  return { color };
}
