'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserLocation } from '@/lib/types';

const STORAGE_KEY = 'pak-disaster-alert:last-known-location';

interface UseGeolocationReturn {
  location: UserLocation | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => void;
}

function saveToLocalStorage(location: UserLocation): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Silently fail if localStorage is unavailable (e.g. private browsing quota exceeded)
  }
}

function loadFromLocalStorage(): UserLocation | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UserLocation;
    }
  } catch {
    // Silently fail if localStorage is unavailable or data is corrupt
  }
  return null;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // On mount, check localStorage for last known position
  useEffect(() => {
    const cached = loadFromLocalStorage();
    if (cached) {
      setLocation(cached);
    }
  }, []);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const userLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setLocation(userLocation);
        setError(null);
        setLoading(false);
        saveToLocalStorage(userLocation);
      },
      (geolocationError: GeolocationPositionError) => {
        setLoading(false);

        switch (geolocationError.code) {
          case geolocationError.PERMISSION_DENIED:
            setError(
              'Location permission denied. Please enable location access in your browser settings.'
            );
            break;
          case geolocationError.POSITION_UNAVAILABLE:
            setError(
              'Location information is unavailable. Please try again later.'
            );
            break;
          case geolocationError.TIMEOUT:
            setError(
              'Location request timed out. Please try again.'
            );
            break;
          default:
            setError('An unknown error occurred while fetching location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Accept cached positions up to 5 minutes old
      }
    );
  }, []);

  return { location, error, loading, requestPermission };
}
