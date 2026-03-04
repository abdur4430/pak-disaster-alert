/**
 * ISRIC SoilGrids API client.
 *
 * Fetches soil composition (clay/sand/silt percentages) for any lat/lon.
 * Free, no API key required, ~5 requests/min.
 *
 * @see https://rest.isric.org/soilgrids/v2.0/docs
 */

import { FLOOD_API_URLS } from "@/lib/constants";

export interface SoilComposition {
  /** Clay percentage (0-100). Higher = retains more water. */
  clay: number;
  /** Sand percentage (0-100). Higher = drains better. */
  sand: number;
  /** Silt percentage (0-100). */
  silt: number;
  /** Drainage score 0-100 (100 = drains well, 0 = retains water). */
  drainage_score: number;
}

/**
 * Fetch soil composition from ISRIC SoilGrids.
 * Uses top-layer (0-5cm) data as a proxy for surface drainage.
 */
export async function fetchSoilComposition(
  lat: number,
  lon: number
): Promise<SoilComposition> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    property: "clay,sand,silt",
    depth: "0-5cm",
    value: "mean",
  });

  const url = `${FLOOD_API_URLS.soilGrids}?${params.toString()}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });

    if (!res.ok) {
      // SoilGrids can return 404 for ocean/missing data
      return getDefaultSoilComposition();
    }

    const data = await res.json();
    const properties = data.properties?.layers;

    if (!properties || !Array.isArray(properties)) {
      return getDefaultSoilComposition();
    }

    let clay = 33,
      sand = 33,
      silt = 34;

    for (const layer of properties) {
      const meanValue =
        layer.depths?.[0]?.values?.mean;
      if (typeof meanValue !== "number") continue;

      // SoilGrids returns values in g/kg (0-1000), convert to %
      const pct = meanValue / 10;

      if (layer.name === "clay") clay = pct;
      else if (layer.name === "sand") sand = pct;
      else if (layer.name === "silt") silt = pct;
    }

    // Drainage score: more sand = better drainage, more clay = worse
    const drainage_score = Math.min(100, Math.max(0, sand * 1.2 - clay * 0.8 + 40));

    return { clay, sand, silt, drainage_score };
  } catch {
    // Fallback for network errors or rate limits
    return getDefaultSoilComposition();
  }
}

/** Default composition when API is unavailable. */
function getDefaultSoilComposition(): SoilComposition {
  return { clay: 33, sand: 33, silt: 34, drainage_score: 50 };
}
