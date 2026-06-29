'use client';

import { useState, useEffect } from 'react';

export function useLocation() {
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (!response.ok) throw new Error('Failed to fetch location');
        const data = await response.json();
        if (data.country_code) {
          setCountryCode(data.country_code);
        }
      } catch (error) {
        // Silently fail and use null - don't log to console to avoid noise
        setCountryCode(null);
      }
    };

    fetchLocation();
  }, []);

  return countryCode;
}
