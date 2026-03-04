'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FloodPrediction } from '@/lib/types';
import { FLOOD_REFRESH_INTERVAL_MS } from '@/lib/constants';

interface UseFloodRiskReturn {
  prediction: FloodPrediction | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFloodRisk(
  lat?: number,
  lon?: number
): UseFloodRiskReturn {
  const [prediction, setPrediction] = useState<FloodPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRisk = useCallback(async () => {
    if (lat === undefined || lon === undefined) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/flood-risk?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data: FloodPrediction = await res.json();
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compute flood risk');
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchRisk();
    const interval = setInterval(fetchRisk, FLOOD_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchRisk]);

  return { prediction, loading, error, refetch: fetchRisk };
}
