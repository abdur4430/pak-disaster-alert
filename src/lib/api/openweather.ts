/**
 * OpenWeatherMap One Call API 3.0 client.
 *
 * Fetches weather alerts for a given coordinate pair using the
 * OpenWeatherMap One Call API. Requires an API key set via the
 * OPENWEATHER_API_KEY environment variable.
 *
 * @see https://openweathermap.org/api/one-call-3
 */

import type { WeatherAlert } from '@/lib/types';
import { CACHE_DURATIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  OpenWeatherMap response types (only fields we need)                */
/* ------------------------------------------------------------------ */

interface OWMAlert {
  sender_name?: string;
  event: string;
  start: number;       // Unix timestamp (seconds)
  end: number;         // Unix timestamp (seconds)
  description: string;
  tags?: string[];
}

interface OWMOneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  alerts?: OWMAlert[];
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Map OpenWeatherMap alert tags/event names to our severity levels.
 *
 * OWM does not provide a formal severity field; we infer from keywords
 * in the event name and tags.
 */
function inferSeverity(event: string, tags?: string[]): WeatherAlert['severity'] {
  const text = `${event} ${(tags ?? []).join(' ')}`.toLowerCase();

  if (text.includes('extreme') || text.includes('tornado') || text.includes('hurricane')) {
    return 'extreme';
  }
  if (text.includes('severe') || text.includes('blizzard') || text.includes('flood warning')) {
    return 'severe';
  }
  if (text.includes('warning') || text.includes('storm')) {
    return 'moderate';
  }

  return 'minor';
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch weather alerts from OpenWeatherMap One Call API 3.0 for a
 * given location.
 *
 * Returns an empty array if:
 * - The OPENWEATHER_API_KEY env var is not set
 * - The API returns no alerts
 * - Any network or parsing error occurs
 */
export async function fetchWeatherAlerts(
  lat: number,
  lon: number,
): Promise<WeatherAlert[]> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      console.error('[openweather] OPENWEATHER_API_KEY is not set -- skipping weather alerts');
      return [];
    }

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      appid: apiKey,
      exclude: 'minutely,hourly',
    });

    const url = `https://api.openweathermap.org/data/3.0/onecall?${params.toString()}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_DURATIONS.weather },
    });

    if (!response.ok) {
      console.error(`[openweather] HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: OWMOneCallResponse = await response.json();

    if (!data.alerts || !Array.isArray(data.alerts) || data.alerts.length === 0) {
      return [];
    }

    const alerts: WeatherAlert[] = data.alerts.map((alert) => ({
      event: alert.event,
      severity: inferSeverity(alert.event, alert.tags),
      description: alert.description,
      start: new Date(alert.start * 1000).toISOString(),
      end: new Date(alert.end * 1000).toISOString(),
    }));

    return alerts;
  } catch (error) {
    console.error('[openweather] Failed to fetch weather alerts:', error);
    return [];
  }
}
