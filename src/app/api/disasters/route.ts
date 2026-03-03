/**
 * GET /api/disasters
 *
 * Aggregates disaster data from four independent sources:
 *   - USGS (earthquakes)
 *   - ReliefWeb (multi-hazard reports for Pakistan)
 *   - GDACS (global disaster alerts filtered to Pakistan)
 *   - NASA EONET (natural events filtered to Pakistan)
 *
 * Query parameters:
 *   - category  Optional DisasterCategoryId to filter results.
 *   - year      Optional 4-digit year to restrict events to a single year.
 *
 * Results are merged, deduplicated by id, and sorted by date descending.
 * ISR revalidation is set to 1 hour.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchEarthquakes } from '@/lib/api/usgs';
import { fetchReliefWebDisasters } from '@/lib/api/reliefweb';
import { fetchGDACSAlerts } from '@/lib/api/gdacs';
import { fetchEONETEvents } from '@/lib/api/eonet';
import type { Disaster } from '@/lib/types';
import type { DisasterCategoryId } from '@/lib/constants';
import { DISASTER_CATEGORIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/** Set of valid category IDs for fast lookup. */
const VALID_CATEGORIES = new Set<string>(
  DISASTER_CATEGORIES.map((c) => c.id),
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categoryParam = searchParams.get('category');
    const yearParam = searchParams.get('year');

    // ----------------------------------------------------------------
    // Validate query parameters
    // ----------------------------------------------------------------
    if (categoryParam && !VALID_CATEGORIES.has(categoryParam)) {
      return NextResponse.json(
        {
          error: `Invalid category "${categoryParam}". Valid categories: ${[...VALID_CATEGORIES].join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (yearParam && (!/^\d{4}$/.test(yearParam) || Number(yearParam) < 1900)) {
      return NextResponse.json(
        { error: `Invalid year "${yearParam}". Provide a 4-digit year >= 1900.` },
        { status: 400 },
      );
    }

    // ----------------------------------------------------------------
    // Fetch all sources in parallel using Promise.allSettled so that a
    // failure in one source does not block the others.
    // ----------------------------------------------------------------
    const [usgsResult, reliefWebResult, gdacsResult, eonetResult] =
      await Promise.allSettled([
        fetchEarthquakes(),
        fetchReliefWebDisasters(),
        fetchGDACSAlerts(),
        fetchEONETEvents(),
      ]);

    // Collect fulfilled results; log and skip rejected ones.
    const allDisasters: Disaster[] = [];

    if (usgsResult.status === 'fulfilled') {
      allDisasters.push(...usgsResult.value);
    } else {
      console.error('[api/disasters] USGS source failed:', usgsResult.reason);
    }

    if (reliefWebResult.status === 'fulfilled') {
      allDisasters.push(...reliefWebResult.value);
    } else {
      console.error('[api/disasters] ReliefWeb source failed:', reliefWebResult.reason);
    }

    if (gdacsResult.status === 'fulfilled') {
      allDisasters.push(...gdacsResult.value);
    } else {
      console.error('[api/disasters] GDACS source failed:', gdacsResult.reason);
    }

    if (eonetResult.status === 'fulfilled') {
      allDisasters.push(...eonetResult.value);
    } else {
      console.error('[api/disasters] EONET source failed:', eonetResult.reason);
    }

    // ----------------------------------------------------------------
    // Deduplicate by id (each source prefixes IDs, so collisions are
    // unlikely, but this guards against edge cases).
    // ----------------------------------------------------------------
    const seen = new Set<string>();
    let disasters = allDisasters.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    // ----------------------------------------------------------------
    // Apply optional filters
    // ----------------------------------------------------------------
    if (categoryParam) {
      const category = categoryParam as DisasterCategoryId;
      disasters = disasters.filter((d) => d.category === category);
    }

    if (yearParam) {
      const year = Number(yearParam);
      disasters = disasters.filter((d) => {
        const eventYear = new Date(d.date).getFullYear();
        return eventYear === year;
      });
    }

    // ----------------------------------------------------------------
    // Sort by date descending (most recent first)
    // ----------------------------------------------------------------
    disasters.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json(disasters);
  } catch (error) {
    console.error('[api/disasters] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching disaster data.' },
      { status: 500 },
    );
  }
}
