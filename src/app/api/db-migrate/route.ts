/**
 * One-time database migration endpoint.
 * Creates the 3 tables required for flood monitoring.
 * Hit GET /api/db-migrate once to initialize, then this route can be removed.
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/api/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();

    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL is not set. The app will use Open-Meteo API fallback mode. Set DATABASE_URL to enable database features.",
        },
        { status: 400 }
      );
    }

    // Create rain_reports table
    await sql`
      CREATE TABLE IF NOT EXISTS rain_reports (
        id SERIAL PRIMARY KEY,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        rainfall_mm DOUBLE PRECISION NOT NULL,
        duration_hours DOUBLE PRECISION NOT NULL,
        notes TEXT,
        elevation DOUBLE PRECISION,
        device_id VARCHAR(128) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create flood_predictions table
    await sql`
      CREATE TABLE IF NOT EXISTS flood_predictions (
        id SERIAL PRIMARY KEY,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        risk_level VARCHAR(20) NOT NULL,
        risk_score INTEGER NOT NULL,
        factors JSONB NOT NULL DEFAULT '{}',
        report_count INTEGER NOT NULL DEFAULT 0,
        computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create terrain_cache table
    await sql`
      CREATE TABLE IF NOT EXISTS terrain_cache (
        id SERIAL PRIMARY KEY,
        grid_lat DOUBLE PRECISION NOT NULL,
        grid_lon DOUBLE PRECISION NOT NULL,
        elevation DOUBLE PRECISION NOT NULL,
        soil_clay DOUBLE PRECISION NOT NULL DEFAULT 33,
        soil_sand DOUBLE PRECISION NOT NULL DEFAULT 33,
        soil_silt DOUBLE PRECISION NOT NULL DEFAULT 34,
        drainage_score DOUBLE PRECISION NOT NULL DEFAULT 50,
        fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(grid_lat, grid_lon)
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rain_reports_location
      ON rain_reports (latitude, longitude)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rain_reports_created
      ON rain_reports (created_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rain_reports_device
      ON rain_reports (device_id, created_at)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_flood_predictions_location
      ON flood_predictions (latitude, longitude)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_terrain_cache_grid
      ON terrain_cache (grid_lat, grid_lon)
    `;

    return NextResponse.json({
      success: true,
      message: "All tables and indexes created successfully.",
      tables: ["rain_reports", "flood_predictions", "terrain_cache"],
    });
  } catch (error) {
    console.error("[db-migrate] Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}
