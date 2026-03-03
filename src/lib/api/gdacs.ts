/**
 * GDACS (Global Disaster Alert and Coordination System) API client.
 *
 * Fetches current disaster alerts from the GDACS GeoJSON endpoint and
 * filters to events within the Northern Pakistan bounding box.
 *
 * NOTE: The GDACS API can be unreliable. All calls are wrapped in
 * try-catch and will return an empty array on any failure.
 *
 * @see https://www.gdacs.org/
 */

import type { Disaster, Severity } from '@/lib/types';
import type { DisasterCategoryId } from '@/lib/constants';
import { API_URLS, N_PAKISTAN_BOUNDS, CACHE_DURATIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Map GDACS event types to our category IDs. */
function mapEventType(type: string | undefined): DisasterCategoryId {
  if (!type) return 'storm';

  const t = type.toUpperCase();
  if (t === 'EQ') return 'earthquake';
  if (t === 'FL') return 'flood';
  if (t === 'TC') return 'storm';
  if (t === 'DR') return 'drought';

  return 'storm';
}

/** Map GDACS alert levels (color) to severity. */
function mapAlertLevel(level: string | undefined): Severity {
  if (!level) return 'medium';

  const l = level.toLowerCase();
  if (l === 'red') return 'critical';
  if (l === 'orange') return 'high';
  if (l === 'green') return 'low';

  return 'medium';
}

/** Check if coordinates fall within the Northern Pakistan bounding box. */
function isInNorthernPakistan(lat: number, lon: number): boolean {
  return (
    lat >= N_PAKISTAN_BOUNDS.lat.min &&
    lat <= N_PAKISTAN_BOUNDS.lat.max &&
    lon >= N_PAKISTAN_BOUNDS.lon.min &&
    lon <= N_PAKISTAN_BOUNDS.lon.max
  );
}

/* ------------------------------------------------------------------ */
/*  GDACS response types (partial -- only fields we use)               */
/* ------------------------------------------------------------------ */

interface GDACSFeature {
  type: 'Feature';
  properties: {
    eventid?: number;
    eventtype?: string;    // "EQ", "FL", "TC", "DR"
    alertlevel?: string;   // "Green", "Orange", "Red"
    name?: string;
    description?: string;
    htmldescription?: string;
    fromdate?: string;
    todate?: string;
    country?: string;
    severity?: number;
    url?: {
      report?: string;
      details?: string;
    };
    [key: string]: unknown;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
}

interface GDACSResponse {
  type: 'FeatureCollection';
  features: GDACSFeature[];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch current GDACS alerts filtered to Northern Pakistan.
 *
 * Returns an empty array on any network, parsing, or API failure.
 */
export async function fetchGDACSAlerts(): Promise<Disaster[]> {
  try {
    const url = `${API_URLS.gdacs}/events/geteventlist/MAP?eventtype=EQ,FL,TC,DR&alertlevel=Green,Orange,Red`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_DURATIONS.disasters },
    });

    if (!response.ok) {
      console.error(`[gdacs] HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: GDACSResponse = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.error('[gdacs] Unexpected response structure -- no features array');
      return [];
    }

    const disasters: Disaster[] = [];

    for (const feature of data.features) {
      const { properties: p, geometry: g } = feature;

      // GDACS GeoJSON uses [lon, lat].
      const [lon, lat] = g.coordinates;

      if (!isInNorthernPakistan(lat, lon)) continue;

      const eventType = mapEventType(p.eventtype);
      const severity = mapAlertLevel(p.alertlevel);

      const dateStr = p.fromdate
        ? new Date(p.fromdate).toISOString()
        : new Date().toISOString();

      const reportUrl = typeof p.url === 'object' ? (p.url?.report ?? p.url?.details) : undefined;

      disasters.push({
        id: `gdacs-${p.eventid ?? feature.properties.eventid ?? Date.now()}`,
        title: p.name ?? `GDACS ${p.eventtype ?? 'Event'} Alert`,
        category: eventType,
        severity,
        latitude: lat,
        longitude: lon,
        date: dateStr,
        source: 'gdacs',
        description: p.description ?? p.htmldescription ?? undefined,
        url: reportUrl ?? undefined,
        magnitude: typeof p.severity === 'number' ? p.severity : undefined,
      });
    }

    return disasters;
  } catch (error) {
    console.error('[gdacs] Failed to fetch alerts:', error);
    return [];
  }
}
