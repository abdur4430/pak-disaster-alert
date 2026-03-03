/**
 * ReliefWeb API client.
 *
 * Fetches disaster reports for Pakistan and normalizes them into the
 * shared Disaster interface.
 *
 * @see https://api.reliefweb.int/v1
 */

import type { Disaster } from '@/lib/types';
import type { DisasterCategoryId } from '@/lib/constants';
import { API_URLS, CACHE_DURATIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/** Default coordinates (Islamabad) when event has no geo data. */
const DEFAULT_LAT = 33.7;
const DEFAULT_LON = 73.0;

/**
 * Map ReliefWeb disaster type names to our category IDs.
 * Falls back to 'storm' for unrecognized types.
 */
function mapDisasterType(type: string | undefined): DisasterCategoryId {
  if (!type) return 'storm';

  const normalized = type.toLowerCase();

  if (normalized.includes('earthquake')) return 'earthquake';
  if (normalized.includes('flood')) return 'flood';
  if (normalized.includes('landslide') || normalized.includes('mudslide')) return 'landslide';
  if (normalized.includes('avalanche')) return 'avalanche';
  if (normalized.includes('glacial') || normalized.includes('glof')) return 'glof';
  if (normalized.includes('drought')) return 'drought';
  if (normalized.includes('heat') || normalized.includes('heatwave')) return 'heatwave';
  if (normalized.includes('cyclone') || normalized.includes('storm') || normalized.includes('typhoon')) return 'storm';
  if (normalized.includes('cold') || normalized.includes('snow')) return 'avalanche';

  return 'storm';
}

/* ------------------------------------------------------------------ */
/*  ReliefWeb response types (only used fields)                        */
/* ------------------------------------------------------------------ */

interface ReliefWebItem {
  id: string;
  fields: {
    name?: string;
    date?: { created?: string };
    glide?: string;
    type?: Array<{ name: string }>;
    country?: Array<{ name: string; iso3: string; location?: { lat: number; lon: number } }>;
    description?: string;
    url?: string;
  };
}

interface ReliefWebResponse {
  count: number;
  data: ReliefWebItem[];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch disaster reports from ReliefWeb filtered to Pakistan.
 *
 * Returns an empty array on any network or parsing failure.
 */
export async function fetchReliefWebDisasters(): Promise<Disaster[]> {
  try {
    // URLSearchParams doesn't support duplicate keys well, so build the URL manually.
    const fieldIncludes = ['name', 'date', 'glide', 'type', 'country', 'description', 'url'];
    const fieldsQuery = fieldIncludes
      .map((f) => `fields[include][]=${encodeURIComponent(f)}`)
      .join('&');

    const baseUrl = `${API_URLS.reliefWeb}/disasters?appname=pakdisaster&filter[field]=country&filter[value]=Pakistan&limit=500&${fieldsQuery}`;

    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_DURATIONS.disasters },
    });

    if (!response.ok) {
      console.error(`[reliefweb] HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: ReliefWebResponse = await response.json();

    const disasters: Disaster[] = data.data.map((item) => {
      const f = item.fields;
      const typeName = f.type?.[0]?.name;
      const category = mapDisasterType(typeName);

      // Try to extract coordinates from the country location or fall back to Islamabad.
      const countryLoc = f.country?.[0]?.location;
      const latitude = countryLoc?.lat ?? DEFAULT_LAT;
      const longitude = countryLoc?.lon ?? DEFAULT_LON;

      const dateStr = f.date?.created
        ? new Date(f.date.created).toISOString()
        : new Date().toISOString();

      return {
        id: `reliefweb-${item.id}`,
        title: f.name ?? 'Unknown Disaster',
        category,
        severity: 'medium',
        latitude,
        longitude,
        date: dateStr,
        source: 'reliefweb',
        description: f.description ?? undefined,
        url: f.url ?? undefined,
      } satisfies Disaster;
    });

    return disasters;
  } catch (error) {
    console.error('[reliefweb] Failed to fetch disasters:', error);
    return [];
  }
}
