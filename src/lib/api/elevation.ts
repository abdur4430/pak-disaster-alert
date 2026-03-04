/**
 * Open-Meteo Elevation API client.
 *
 * Provides elevation data at ~90m resolution for any lat/lon.
 * Free, no API key required, 10K requests/day.
 *
 * @see https://open-meteo.com/en/docs/elevation-api
 */

import { FLOOD_API_URLS } from "@/lib/constants";

/**
 * Fetch elevation for a single point.
 * @returns Elevation in meters above sea level.
 */
export async function fetchElevation(
  lat: number,
  lon: number
): Promise<number> {
  const url = `${FLOOD_API_URLS.elevation}?latitude=${lat}&longitude=${lon}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

  if (!res.ok) {
    throw new Error(`Elevation API error: ${res.status}`);
  }

  const data = await res.json();
  const elevation = data.elevation?.[0];

  if (typeof elevation !== "number") {
    throw new Error("Invalid elevation response");
  }

  return elevation;
}

/**
 * Fetch elevations for multiple points in a single request.
 * Open-Meteo supports comma-separated coordinates.
 */
export async function fetchElevationBatch(
  points: Array<{ lat: number; lon: number }>
): Promise<number[]> {
  if (points.length === 0) return [];

  const lats = points.map((p) => p.lat).join(",");
  const lons = points.map((p) => p.lon).join(",");

  const url = `${FLOOD_API_URLS.elevation}?latitude=${lats}&longitude=${lons}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });

  if (!res.ok) {
    throw new Error(`Elevation batch API error: ${res.status}`);
  }

  const data = await res.json();
  return data.elevation as number[];
}
