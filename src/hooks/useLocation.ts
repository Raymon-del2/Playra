'use client';

import { useState, useEffect } from 'react';

export function useLocation() {
  const [countryCode, setCountryCode] = useState<string>('KE');

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code) {
          setCountryCode(data.country_code);
        }
      } catch (error) {
        console.error('Failed to fetch location:', error);
      }
    };

    fetchLocation();
  }, []);

  return countryCode;
}
