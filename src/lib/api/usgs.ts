/**
 * USGS Earthquake Hazards Program API client.
 *
 * Fetches earthquake events for the Northern Pakistan bounding box and
 * normalizes the GeoJSON response into the shared Disaster interface.
 *
 * @see https://earthquake.usgs.gov/fdsnws/event/1/
 */

import type { Disaster, Severity } from '@/lib/types';
import { API_URLS, N_PAKISTAN_BOUNDS, CACHE_DURATIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Map USGS magnitude to a normalized severity level. */
function magnitudeToSeverity(mag: number): Severity {
  if (mag >= 6) return 'critical';
  if (mag >= 5) return 'high';
  if (mag >= 4) return 'medium';
  return 'low';
}

/* ------------------------------------------------------------------ */
/*  USGS GeoJSON response types (only the fields we need)             */
/* ------------------------------------------------------------------ */

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;        // epoch ms
    updated: number;
    url: string;
    title: string;
    type: string;
    status: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lon, lat, depth]
  };
}

interface USGSResponse {
  type: 'FeatureCollection';
  metadata: { generated: number; count: number; title: string };
  features: USGSFeature[];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch earthquake events from USGS for the Northern Pakistan bounding box.
 *
 * Returns an empty array on any network or parsing failure so callers
 * never have to handle exceptions.
 */
export async function fetchEarthquakes(): Promise<Disaster[]> {
  try {
    const params = new URLSearchParams({
      format: 'geojson',
      minlatitude: String(N_PAKISTAN_BOUNDS.lat.min),
      maxlatitude: String(N_PAKISTAN_BOUNDS.lat.max),
      minlongitude: String(N_PAKISTAN_BOUNDS.lon.min),
      maxlongitude: String(N_PAKISTAN_BOUNDS.lon.max),
      starttime: '1994-01-01',
      orderby: 'time',
      limit: '1000',
    });

    const url = `${API_URLS.usgs}/query?${params.toString()}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_DURATIONS.earthquakes },
    });

    if (!response.ok) {
      console.error(`[usgs] HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: USGSResponse = await response.json();

    const disasters: Disaster[] = data.features.map((feature) => {
      const { properties: p, geometry: g } = feature;
      const [lon, lat] = g.coordinates;
      const mag = p.mag ?? 0;

      return {
        id: `usgs-${feature.id}`,
        title: p.title || `M${mag.toFixed(1)} Earthquake`,
        category: 'earthquake',
        severity: magnitudeToSeverity(mag),
        latitude: lat,
        longitude: lon,
        date: new Date(p.time).toISOString(),
        source: 'usgs',
        description: p.place ?? undefined,
        url: p.url ?? undefined,
        magnitude: mag,
      };
    });

    return disasters;
  } catch (error) {
    console.error('[usgs] Failed to fetch earthquakes:', error);
    return [];
  }
}
