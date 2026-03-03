/**
 * NASA EONET (Earth Observatory Natural Event Tracker) API client.
 *
 * Fetches open natural events and filters those whose geometry falls
 * within the Northern Pakistan bounding box.
 *
 * @see https://eonet.gsfc.nasa.gov/docs/v3
 */

import type { Disaster } from '@/lib/types';
import type { DisasterCategoryId } from '@/lib/constants';
import { API_URLS, N_PAKISTAN_BOUNDS, CACHE_DURATIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Map EONET category IDs to our disaster category IDs.
 *
 * EONET uses string IDs like "wildfires", "severeStorms", etc.
 */
function mapEONETCategory(eonetId: string): DisasterCategoryId {
  const id = eonetId.toLowerCase();

  if (id === 'wildfires') return 'storm';
  if (id === 'severestorms') return 'storm';
  if (id === 'floods') return 'flood';
  if (id === 'earthquakes') return 'earthquake';
  if (id === 'landslides') return 'landslide';
  if (id === 'volcanoes') return 'earthquake';
  if (id === 'drought') return 'drought';
  if (id === 'snow') return 'avalanche';
  if (id === 'sealakeice' || id === 'tempextremes') return 'heatwave';

  return 'storm';
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
/*  EONET response types (only fields we need)                         */
/* ------------------------------------------------------------------ */

interface EONETGeometry {
  date: string;          // ISO-8601
  type: 'Point';
  coordinates: [number, number]; // [lon, lat]
}

interface EONETCategory {
  id: string;
  title: string;
}

interface EONETEvent {
  id: string;
  title: string;
  description?: string;
  link?: string;
  categories: EONETCategory[];
  sources?: Array<{ id: string; url: string }>;
  geometry: EONETGeometry[];
}

interface EONETResponse {
  title: string;
  events: EONETEvent[];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch open EONET events filtered to Northern Pakistan.
 *
 * Returns an empty array on any network or parsing failure.
 */
export async function fetchEONETEvents(): Promise<Disaster[]> {
  try {
    const url = `${API_URLS.eonet}/events?status=open&limit=50`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_DURATIONS.eonet },
    });

    if (!response.ok) {
      console.error(`[eonet] HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: EONETResponse = await response.json();

    if (!data.events || !Array.isArray(data.events)) {
      console.error('[eonet] Unexpected response -- no events array');
      return [];
    }

    const disasters: Disaster[] = [];

    for (const event of data.events) {
      // Use the most recent geometry entry.
      const latestGeo = event.geometry[event.geometry.length - 1];
      if (!latestGeo || latestGeo.type !== 'Point') continue;

      const [lon, lat] = latestGeo.coordinates;

      if (!isInNorthernPakistan(lat, lon)) continue;

      const categoryId = event.categories[0]?.id ?? 'other';
      const category = mapEONETCategory(categoryId);

      const sourceUrl = event.sources?.[0]?.url ?? event.link ?? undefined;

      disasters.push({
        id: `eonet-${event.id}`,
        title: event.title,
        category,
        severity: 'medium', // EONET doesn't provide severity; default to medium.
        latitude: lat,
        longitude: lon,
        date: new Date(latestGeo.date).toISOString(),
        source: 'eonet',
        description: event.description ?? undefined,
        url: sourceUrl,
      });
    }

    return disasters;
  } catch (error) {
    console.error('[eonet] Failed to fetch events:', error);
    return [];
  }
}
