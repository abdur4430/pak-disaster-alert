/**
 * Rain reports API.
 *
 * GET  /api/rain?lat=X&lon=Y&radius=10&hours=72 — list reports with spatial+time filter
 * POST /api/rain — submit a new rain report (with auto-elevation lookup)
 *
 * Fallback: When DATABASE_URL is not set, GET returns recent precipitation
 * from Open-Meteo Archive API as synthetic rain reports, and POST returns
 * the report with a flag indicating it should be stored in localStorage.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/api/db";
import { fetchElevation } from "@/lib/api/elevation";
import {
  PAKISTAN_BOUNDS,
  CATCHMENT_RADIUS_KM,
  FLOOD_TIME_WINDOWS,
  FLOOD_API_URLS,
  MAX_REPORTS_PER_DEVICE_PER_DAY,
} from "@/lib/constants";
import type { RainReport, RainReportInput } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Fallback: Fetch real precipitation data from Open-Meteo Archive
 * and convert it into synthetic RainReport objects.
 */
async function fetchOpenMeteoRainfall(
  lat: number,
  lon: number,
  hours: number
): Promise<RainReport[]> {
  try {
    const end = new Date();
    const start = new Date(end);
    start.setHours(start.getHours() - hours);

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
      hourly: "precipitation",
      timezone: "Asia/Karachi",
    });

    const res = await fetch(
      `${FLOOD_API_URLS.archive}?${params.toString()}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const times: string[] = data.hourly?.time ?? [];
    const precip: number[] = data.hourly?.precipitation ?? [];

    // Group into 6-hour buckets with non-zero precipitation
    const reports: RainReport[] = [];
    let bucketRain = 0;
    let bucketStart = times[0] || "";
    let idCounter = 1;

    for (let i = 0; i < times.length; i++) {
      bucketRain += precip[i] || 0;

      if ((i + 1) % 6 === 0 || i === times.length - 1) {
        if (bucketRain > 0) {
          reports.push({
            id: idCounter++,
            latitude: lat,
            longitude: lon,
            rainfall_mm: Math.round(bucketRain * 10) / 10,
            duration_hours: 6,
            notes: "Open-Meteo satellite data",
            elevation: null,
            device_id: "open-meteo",
            created_at: bucketStart,
          });
        }
        bucketRain = 0;
        bucketStart = times[i + 1] || "";
      }
    }

    return reports;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = parseFloat(searchParams.get("lat") || "30.3");
    const lon = parseFloat(searchParams.get("lon") || "69.3");
    const radiusKm = parseFloat(
      searchParams.get("radius") || String(CATCHMENT_RADIUS_KM)
    );
    const hours = parseInt(
      searchParams.get("hours") ||
        String(FLOOD_TIME_WINDOWS.rainfall_lookback_hours),
      10
    );

    const sql = getDb();

    // Try database first
    if (sql) {
      try {
        const degOffset = radiusKm / 111;

        const rows = await sql`
          SELECT id, latitude, longitude, rainfall_mm, duration_hours,
                 notes, elevation, device_id, created_at
          FROM rain_reports
          WHERE latitude BETWEEN ${lat - degOffset} AND ${lat + degOffset}
            AND longitude BETWEEN ${lon - degOffset} AND ${lon + degOffset}
            AND created_at > NOW() - INTERVAL '1 hour' * ${hours}
          ORDER BY created_at DESC
          LIMIT 500
        `;

        return NextResponse.json(rows as RainReport[]);
      } catch (dbError) {
        console.warn("[rain] DB query failed, falling back to Open-Meteo:", dbError);
      }
    }

    // Fallback: Open-Meteo Archive API for real precipitation data
    const reports = await fetchOpenMeteoRainfall(lat, lon, hours);
    return NextResponse.json(reports);
  } catch (error) {
    console.error("[rain] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rain reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RainReportInput = await request.json();

    // Validate required fields
    if (
      typeof body.latitude !== "number" ||
      typeof body.longitude !== "number" ||
      typeof body.rainfall_mm !== "number" ||
      typeof body.duration_hours !== "number" ||
      typeof body.device_id !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing required fields: latitude, longitude, rainfall_mm, duration_hours, device_id" },
        { status: 400 }
      );
    }

    // Validate bounds
    if (
      body.latitude < PAKISTAN_BOUNDS.lat.min ||
      body.latitude > PAKISTAN_BOUNDS.lat.max ||
      body.longitude < PAKISTAN_BOUNDS.lon.min ||
      body.longitude > PAKISTAN_BOUNDS.lon.max
    ) {
      return NextResponse.json(
        { error: "Location must be within Pakistan" },
        { status: 400 }
      );
    }

    // Validate ranges
    if (body.rainfall_mm < 0 || body.rainfall_mm > 1000) {
      return NextResponse.json(
        { error: "Rainfall must be between 0 and 1000mm" },
        { status: 400 }
      );
    }
    if (body.duration_hours < 0.1 || body.duration_hours > 72) {
      return NextResponse.json(
        { error: "Duration must be between 0.1 and 72 hours" },
        { status: 400 }
      );
    }

    // Auto-fetch elevation
    let elevation: number | null = null;
    try {
      elevation = await fetchElevation(body.latitude, body.longitude);
    } catch {
      // Non-critical — proceed without elevation
    }

    const sql = getDb();

    // Try database first
    if (sql) {
      try {
        // Rate limit: max reports per device per day
        const recentCount = await sql`
          SELECT COUNT(*) as cnt FROM rain_reports
          WHERE device_id = ${body.device_id}
            AND created_at > NOW() - INTERVAL '24 hours'
        `;

        if (Number(recentCount[0]?.cnt) >= MAX_REPORTS_PER_DEVICE_PER_DAY) {
          return NextResponse.json(
            { error: `Maximum ${MAX_REPORTS_PER_DEVICE_PER_DAY} reports per 24 hours` },
            { status: 429 }
          );
        }

        const rows = await sql`
          INSERT INTO rain_reports (latitude, longitude, rainfall_mm, duration_hours, notes, elevation, device_id)
          VALUES (${body.latitude}, ${body.longitude}, ${body.rainfall_mm}, ${body.duration_hours},
                  ${body.notes || null}, ${elevation}, ${body.device_id})
          RETURNING id, latitude, longitude, rainfall_mm, duration_hours, notes, elevation, device_id, created_at
        `;

        return NextResponse.json(rows[0] as RainReport, { status: 201 });
      } catch (dbError) {
        console.warn("[rain] DB insert failed, returning local-only report:", dbError);
      }
    }

    // Fallback: Return the report for localStorage storage on the client
    const localReport: RainReport = {
      id: Date.now(),
      latitude: body.latitude,
      longitude: body.longitude,
      rainfall_mm: body.rainfall_mm,
      duration_hours: body.duration_hours,
      notes: body.notes || null,
      elevation,
      device_id: body.device_id,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ ...localReport, _storage: "local" }, { status: 201 });
  } catch (error) {
    console.error("[rain] POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit rain report" },
      { status: 500 }
    );
  }
}
