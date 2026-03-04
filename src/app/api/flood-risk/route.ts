/**
 * Flood risk computation API.
 *
 * GET /api/flood-risk?lat=X&lon=Y
 *
 * Fetches all data in parallel (rain reports, forecast, elevation, soil,
 * historical) and runs the flood prediction model.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/api/db";
import { fetchElevation, fetchElevationBatch } from "@/lib/api/elevation";
import { fetchSoilComposition } from "@/lib/api/soilgrids";
import { computeFloodRisk } from "@/lib/flood-model";
import {
  API_URLS,
  FLOOD_API_URLS,
  CATCHMENT_RADIUS_KM,
  FLOOD_TIME_WINDOWS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

async function fetchForecastRain(
  lat: number,
  lon: number
): Promise<number> {
  try {
    const hours = FLOOD_TIME_WINDOWS.forecast_hours;
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly: "precipitation",
      timezone: "Asia/Karachi",
      forecast_hours: String(hours),
    });
    const res = await fetch(
      `${API_URLS.openMeteo}/forecast?${params.toString()}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const precip: number[] = data.hourly?.precipitation ?? [];
    return precip.reduce((sum, v) => sum + (v || 0), 0);
  } catch {
    return 0;
  }
}

async function fetchHistoricalAvg(
  lat: number,
  lon: number
): Promise<number> {
  try {
    // Get same 2-week period from 5 years ago
    const now = new Date();
    const avgPrecips: number[] = [];

    for (let yearsAgo = 1; yearsAgo <= 5; yearsAgo++) {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - yearsAgo);
      start.setDate(start.getDate() - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 14);

      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        daily: "precipitation_sum",
        timezone: "Asia/Karachi",
      });

      const res = await fetch(
        `${FLOOD_API_URLS.archive}?${params.toString()}`,
        { signal: AbortSignal.timeout(10_000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const precips: number[] = data.daily?.precipitation_sum ?? [];
      const total = precips.reduce((s, v) => s + (v || 0), 0);
      avgPrecips.push(total);
    }

    if (avgPrecips.length === 0) return 0;
    return avgPrecips.reduce((s, v) => s + v, 0) / avgPrecips.length;
  } catch {
    return 0;
  }
}

async function fetchCurrentPrecipitation(
  lat: number,
  lon: number
): Promise<number> {
  try {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 14);

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
      daily: "precipitation_sum",
      timezone: "Asia/Karachi",
    });

    const res = await fetch(
      `${FLOOD_API_URLS.archive}?${params.toString()}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const precips: number[] = data.daily?.precipitation_sum ?? [];
    return precips.reduce((s, v) => s + (v || 0), 0);
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = parseFloat(searchParams.get("lat") || "30.3");
    const lon = parseFloat(searchParams.get("lon") || "69.3");

    const sql = getDb();
    const degOffset = CATCHMENT_RADIUS_KM / 111;

    // Fetch everything in parallel
    const [
      rainReports,
      forecastRain,
      pointElevation,
      surroundingElevations,
      soil,
      currentPrecip,
      historicalAvg,
    ] = await Promise.all([
      // 1. Rain reports in catchment
      sql`
        SELECT rainfall_mm FROM rain_reports
        WHERE latitude BETWEEN ${lat - degOffset} AND ${lat + degOffset}
          AND longitude BETWEEN ${lon - degOffset} AND ${lon + degOffset}
          AND created_at > NOW() - INTERVAL '${FLOOD_TIME_WINDOWS.rainfall_lookback_hours} hours'
      `.catch(() => [] as Array<{ rainfall_mm: number }>),

      // 2. Forecast rain
      fetchForecastRain(lat, lon),

      // 3. Point elevation
      fetchElevation(lat, lon).catch(() => 500),

      // 4. Surrounding elevations (8 compass points at ~5km)
      fetchElevationBatch([
        { lat: lat + 0.045, lon },
        { lat: lat - 0.045, lon },
        { lat, lon: lon + 0.045 },
        { lat, lon: lon - 0.045 },
        { lat: lat + 0.032, lon: lon + 0.032 },
        { lat: lat + 0.032, lon: lon - 0.032 },
        { lat: lat - 0.032, lon: lon + 0.032 },
        { lat: lat - 0.032, lon: lon - 0.032 },
      ]).catch(() => [] as number[]),

      // 5. Soil composition
      fetchSoilComposition(lat, lon),

      // 6. Current period precipitation
      fetchCurrentPrecipitation(lat, lon),

      // 7. Historical average
      fetchHistoricalAvg(lat, lon),
    ]);

    const accumulatedRainfall = (rainReports as Array<{ rainfall_mm: number }>).reduce(
      (sum, r) => sum + (r.rainfall_mm || 0),
      0
    );

    const surroundingAvg =
      surroundingElevations.length > 0
        ? surroundingElevations.reduce((s, v) => s + v, 0) /
          surroundingElevations.length
        : pointElevation;

    const prediction = computeFloodRisk({
      latitude: lat,
      longitude: lon,
      accumulated_rainfall_mm: accumulatedRainfall,
      report_count: (rainReports as unknown[]).length,
      forecast_rain_mm: forecastRain,
      elevation: pointElevation,
      surrounding_elevation_avg: surroundingAvg,
      drainage_score: soil.drainage_score,
      current_precipitation_mm: currentPrecip,
      historical_avg_mm: historicalAvg,
    });

    // Save prediction to DB (fire and forget)
    sql`
      INSERT INTO flood_predictions (latitude, longitude, risk_level, risk_score, factors, report_count)
      VALUES (${lat}, ${lon}, ${prediction.risk_level}, ${prediction.risk_score},
              ${JSON.stringify(prediction.contributing_factors)}, ${prediction.report_count})
    `.catch(() => {});

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("[flood-risk] Error:", error);
    return NextResponse.json(
      { error: "Failed to compute flood risk" },
      { status: 500 }
    );
  }
}
