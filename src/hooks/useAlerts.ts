'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, UserLocation } from '@/lib/types';

/** Refresh interval: 15 minutes in milliseconds. */
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/** Default search radius in kilometers. */
const DEFAULT_RADIUS_KM = 30;

interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

function triggerBrowserNotification(alert: Alert): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(`Critical Alert: ${alert.title}`, {
      body: alert.description,
      icon: '/favicon.ico',
      tag: alert.id, // Prevents duplicate notifications for the same alert
    });
  } catch {
    // Silently fail if notification cannot be shown (e.g. service worker required on some platforms)
  }
}

export function useAlerts(location: UserLocation | null): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousAlertIdsRef = useRef<Set<string>>(new Set());

  const fetchAlerts = useCallback(async (loc: UserLocation) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: loc.latitude.toString(),
        lon: loc.longitude.toString(),
        radius: DEFAULT_RADIUS_KM.toString(),
      });

      const response = await fetch(`/api/alerts?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch alerts: ${response.status} ${response.statusText}`
        );
      }

      const data: Alert[] = await response.json();
      setAlerts(data);

      // Trigger browser notifications for new critical alerts only
      const previousIds = previousAlertIdsRef.current;
      for (const alert of data) {
        if (alert.severity === 'critical' && !previousIds.has(alert.id)) {
          triggerBrowserNotification(alert);
        }
      }

      // Update the set of known alert IDs
      previousAlertIdsRef.current = new Set(data.map((a) => a.id));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while fetching alerts.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear any existing interval when location changes
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!location) {
      setAlerts([]);
      setLoading(false);
      setError(null);
      previousAlertIdsRef.current = new Set();
      return;
    }

    // Request notification permission proactively (non-blocking)
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }

    // Fetch immediately
    fetchAlerts(location);

    // Set up 15-minute refresh interval
    intervalRef.current = setInterval(() => {
      fetchAlerts(location);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [location, fetchAlerts]);

  return { alerts, loading, error };
}
