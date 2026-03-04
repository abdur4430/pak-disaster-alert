'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RainReport, RainReportInput } from '@/lib/types';
import { FLOOD_REFRESH_INTERVAL_MS } from '@/lib/constants';

interface UseRainReportsReturn {
  reports: RainReport[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  submitReport: (input: RainReportInput) => Promise<RainReport | null>;
  submitting: boolean;
}

export function useRainReports(
  lat?: number,
  lon?: number,
  radiusKm?: number
): UseRainReportsReturn {
  const [reports, setReports] = useState<RainReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (lat !== undefined) params.set('lat', String(lat));
      if (lon !== undefined) params.set('lon', String(lon));
      if (radiusKm !== undefined) params.set('radius', String(radiusKm));

      const qs = params.toString();
      const res = await fetch(`/api/rain${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data: RainReport[] = await res.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rain reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lon, radiusKm]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, FLOOD_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const submitReport = useCallback(
    async (input: RainReportInput): Promise<RainReport | null> => {
      setSubmitting(true);
      try {
        const res = await fetch('/api/rain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Submit failed: ${res.status}`);
        }

        const report: RainReport = await res.json();
        setReports((prev) => [report, ...prev]);
        return report;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit report');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { reports, loading, error, refetch: fetchReports, submitReport, submitting };
}
