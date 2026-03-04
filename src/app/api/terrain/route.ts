/**
 * Terrain data API with caching.
 *
 * GET /api/terrain?lat=X&lon=Y
 *
 * Fetches elevation + soil data for a location. Results are cached in
 * the terrain_cache table, snapped to a grid resolution.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/api/db";
import { fetchElevation } from "@/lib/api/elevation";
import { fetchSoilComposition } from "@/lib/api/soilgrids";
import { TERRAIN_GRID_RESOLUTION } from "@/lib/constants";
import type { TerrainData } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Snap a coordinate to the nearest grid cell. */
function snapToGrid(value: number): number {
  return (
    Math.round(value / TERRAIN_GRID_RESOLUTION) * TERRAIN_GRID_RESOLUTION
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = parseFloat(searchParams.get("lat") || "30.3");
    const lon = parseFloat(searchParams.get("lon") || "69.3");

    const gridLat = snapToGrid(lat);
    const gridLon = snapToGrid(lon);

    const sql = getDb();

    // Check cache first
    const cached = await sql`
      SELECT elevation, soil_clay, soil_sand, soil_silt, drainage_score
      FROM terrain_cache
      WHERE grid_lat = ${gridLat} AND grid_lon = ${gridLon}
        AND fetched_at > NOW() - INTERVAL '30 days'
      LIMIT 1
    `;

    if (cached.length > 0) {
      const row = cached[0];
      const result: TerrainData = {
        latitude: gridLat,
        longitude: gridLon,
        elevation: row.elevation as number,
        soil_clay: row.soil_clay as number,
        soil_sand: row.soil_sand as number,
        soil_silt: row.soil_silt as number,
        drainage_score: row.drainage_score as number,
      };
      return NextResponse.json(result);
    }

    // Fetch fresh data in parallel
    const [elevation, soil] = await Promise.all([
      fetchElevation(gridLat, gridLon).catch(() => 500),
      fetchSoilComposition(gridLat, gridLon),
    ]);

    // Cache the result (upsert)
    await sql`
      INSERT INTO terrain_cache (grid_lat, grid_lon, elevation, soil_clay, soil_sand, soil_silt, drainage_score)
      VALUES (${gridLat}, ${gridLon}, ${elevation}, ${soil.clay}, ${soil.sand}, ${soil.silt}, ${soil.drainage_score})
      ON CONFLICT (grid_lat, grid_lon)
      DO UPDATE SET elevation = ${elevation}, soil_clay = ${soil.clay}, soil_sand = ${soil.sand},
                    soil_silt = ${soil.silt}, drainage_score = ${soil.drainage_score}, fetched_at = NOW()
    `.catch(() => {});

    const result: TerrainData = {
      latitude: gridLat,
      longitude: gridLon,
      elevation,
      soil_clay: soil.clay,
      soil_sand: soil.sand,
      soil_silt: soil.silt,
      drainage_score: soil.drainage_score,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[terrain] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch terrain data" },
      { status: 500 }
    );
  }
}
