'use client';

import { useState, useEffect } from 'react';
import { WeatherData } from '@/lib/types';

interface UseWeatherReturn {
  weather: WeatherData[];
  loading: boolean;
  error: string | null;
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/weather');

        if (!response.ok) {
          throw new Error(
            `Failed to fetch weather data: ${response.status} ${response.statusText}`
          );
        }

        const data: WeatherData[] = await response.json();

        if (!cancelled) {
          setWeather(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while fetching weather data.';
          setError(message);
          setWeather([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  return { weather, loading, error };
}
