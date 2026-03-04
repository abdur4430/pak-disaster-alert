'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RainReport, RainReportInput } from '@/lib/types';
import { FLOOD_REFRESH_INTERVAL_MS } from '@/lib/constants';

const LOCAL_STORAGE_KEY = 'pak-disaster-alert:rain-reports';

/** Read locally-stored rain reports. */
function getLocalReports(): RainReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const reports: RainReport[] = JSON.parse(raw);
    // Prune reports older than 72h
    const cutoff = Date.now() - 72 * 3600_000;
    return reports.filter((r) => new Date(r.created_at).getTime() > cutoff);
  } catch {
    return [];
  }
}

/** Save a rain report to localStorage. */
function saveLocalReport(report: RainReport) {
  try {
    const existing = getLocalReports();
    existing.unshift(report);
    // Keep max 100 local reports
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(existing.slice(0, 100))
    );
  } catch {
    // localStorage full or unavailable
  }
}

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
      const apiReports: RainReport[] = await res.json();

      // Merge with localStorage reports (deduplicated by id)
      const localReports = getLocalReports();
      const apiIds = new Set(apiReports.map((r) => r.id));
      const merged = [
        ...apiReports,
        ...localReports.filter((r) => !apiIds.has(r.id)),
      ];
      merged.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setReports(merged);
    } catch (err) {
      // If API fails entirely, use localStorage reports only
      const localReports = getLocalReports();
      if (localReports.length > 0) {
        setReports(localReports);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch rain reports');
        setReports([]);
      }
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

        // Always save to localStorage as a backup
        saveLocalReport(report);

        setReports((prev) => [report, ...prev]);
        return report;
      } catch (err) {
        // If API fails, create a local-only report
        const localReport: RainReport = {
          id: Date.now(),
          latitude: input.latitude,
          longitude: input.longitude,
          rainfall_mm: input.rainfall_mm,
          duration_hours: input.duration_hours,
          notes: input.notes || null,
          elevation: null,
          device_id: input.device_id,
          created_at: new Date().toISOString(),
        };
        saveLocalReport(localReport);
        setReports((prev) => [localReport, ...prev]);
        // Don't set error — report was saved locally
        return localReport;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { reports, loading, error, refetch: fetchReports, submitReport, submitting };
}
