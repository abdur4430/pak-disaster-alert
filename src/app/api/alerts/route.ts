/**
 * GET /api/alerts
 *
 * Proximity-based alert endpoint. Given a user's coordinates and an
 * optional radius, this route:
 *   1. Fetches disaster events from all sources (USGS, ReliefWeb, GDACS, EONET)
 *   2. Filters events that fall within the specified radius of the user
 *   3. Fetches weather alerts from OpenWeatherMap for the user's location
 *   4. Merges disaster and weather alerts into a unified Alert[] response
 *   5. Sorts by severity (critical first) then by distance (nearest first)
 *
 * Query parameters (required):
 *   - lat     User latitude (decimal degrees)
 *   - lon     User longitude (decimal degrees)
 *
 * Query parameters (optional):
 *   - radius  Search radius in kilometers (default: 30)
 *
 * This route is fully dynamic (no ISR caching) to ensure real-time
 * proximity results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchEarthquakes } from '@/lib/api/usgs';
import { fetchReliefWebDisasters } from '@/lib/api/reliefweb';
import { fetchGDACSAlerts } from '@/lib/api/gdacs';
import { fetchEONETEvents } from '@/lib/api/eonet';
import { fetchWeatherAlerts } from '@/lib/api/openweather';
import { calculateDistance } from '@/lib/geo';
import { PAKISTAN_BOUNDS, DEFAULT_ALERT_RADIUS } from '@/lib/constants';
import type { Alert, Disaster, Severity } from '@/lib/types';

export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ */
/*  Severity ordering for sorting (higher number = more severe)        */
/* ------------------------------------------------------------------ */

const SEVERITY_ORDER: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Map OpenWeatherMap alert severity strings to our unified Severity type.
 */
function mapWeatherSeverity(
  owmSeverity: 'minor' | 'moderate' | 'severe' | 'extreme',
): Severity {
  switch (owmSeverity) {
    case 'extreme':
      return 'critical';
    case 'severe':
      return 'high';
    case 'moderate':
      return 'medium';
    case 'minor':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Convert a nearby disaster event into an Alert object.
 */
function disasterToAlert(disaster: Disaster, distance: number): Alert {
  return {
    id: disaster.id,
    type: 'disaster',
    severity: disaster.severity ?? 'medium',
    title: disaster.title,
    description:
      disaster.description ??
      `${disaster.category} event detected ${distance.toFixed(1)} km from your location.`,
    distance: Math.round(distance * 10) / 10,
    latitude: disaster.latitude,
    longitude: disaster.longitude,
  };
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const radiusParam = searchParams.get('radius');

    // ----------------------------------------------------------------
    // Validate required parameters
    // ----------------------------------------------------------------
    if (!latParam || !lonParam) {
      return NextResponse.json(
        { error: 'Missing required query parameters: lat and lon.' },
        { status: 400 },
      );
    }

    const userLat = parseFloat(latParam);
    const userLon = parseFloat(lonParam);

    if (isNaN(userLat) || isNaN(userLon)) {
      return NextResponse.json(
        { error: 'Invalid lat/lon values. Both must be valid numbers.' },
        { status: 400 },
      );
    }

    // Validate coordinates are within Pakistan bounds
    if (
      userLat < PAKISTAN_BOUNDS.lat.min ||
      userLat > PAKISTAN_BOUNDS.lat.max ||
      userLon < PAKISTAN_BOUNDS.lon.min ||
      userLon > PAKISTAN_BOUNDS.lon.max
    ) {
      return NextResponse.json(
        {
          error:
            'Coordinates are outside Pakistan bounds. ' +
            `Latitude must be ${PAKISTAN_BOUNDS.lat.min}-${PAKISTAN_BOUNDS.lat.max}, ` +
            `longitude must be ${PAKISTAN_BOUNDS.lon.min}-${PAKISTAN_BOUNDS.lon.max}.`,
        },
        { status: 400 },
      );
    }

    const radius = radiusParam ? parseFloat(radiusParam) : DEFAULT_ALERT_RADIUS;

    if (isNaN(radius) || radius <= 0 || radius > 500) {
      return NextResponse.json(
        { error: 'Invalid radius. Must be a number between 0 and 500 km.' },
        { status: 400 },
      );
    }

    // ----------------------------------------------------------------
    // Fetch disaster data and weather alerts in parallel
    // ----------------------------------------------------------------
    const [usgsResult, reliefWebResult, gdacsResult, eonetResult, weatherAlertsResult] =
      await Promise.allSettled([
        fetchEarthquakes(),
        fetchReliefWebDisasters(),
        fetchGDACSAlerts(),
        fetchEONETEvents(),
        fetchWeatherAlerts(userLat, userLon),
      ]);

    // ----------------------------------------------------------------
    // Collect all disaster events
    // ----------------------------------------------------------------
    const allDisasters: Disaster[] = [];

    if (usgsResult.status === 'fulfilled') {
      allDisasters.push(...usgsResult.value);
    } else {
      console.error('[api/alerts] USGS source failed:', usgsResult.reason);
    }

    if (reliefWebResult.status === 'fulfilled') {
      allDisasters.push(...reliefWebResult.value);
    } else {
      console.error('[api/alerts] ReliefWeb source failed:', reliefWebResult.reason);
    }

    if (gdacsResult.status === 'fulfilled') {
      allDisasters.push(...gdacsResult.value);
    } else {
      console.error('[api/alerts] GDACS source failed:', gdacsResult.reason);
    }

    if (eonetResult.status === 'fulfilled') {
      allDisasters.push(...eonetResult.value);
    } else {
      console.error('[api/alerts] EONET source failed:', eonetResult.reason);
    }

    // ----------------------------------------------------------------
    // Filter disasters within the user's radius
    // ----------------------------------------------------------------
    const alerts: Alert[] = [];

    for (const disaster of allDisasters) {
      const distance = calculateDistance(
        userLat,
        userLon,
        disaster.latitude,
        disaster.longitude,
      );

      if (distance <= radius) {
        alerts.push(disasterToAlert(disaster, distance));
      }
    }

    // ----------------------------------------------------------------
    // Add weather alerts from OpenWeatherMap
    // ----------------------------------------------------------------
    if (weatherAlertsResult.status === 'fulfilled') {
      const weatherAlerts = weatherAlertsResult.value;

      for (const wa of weatherAlerts) {
        const severity = mapWeatherSeverity(wa.severity);
        alerts.push({
          id: `weather-${wa.event.replace(/\s+/g, '-').toLowerCase()}-${wa.start}`,
          type: 'weather',
          severity,
          title: wa.event,
          description: wa.description,
          distance: 0, // Weather alerts are for the user's exact location
          latitude: userLat,
          longitude: userLon,
        });
      }
    } else {
      console.error(
        '[api/alerts] Weather alerts failed:',
        weatherAlertsResult.reason,
      );
    }

    // ----------------------------------------------------------------
    // Sort: by severity descending (critical first), then by distance
    // ascending (nearest first) as a tiebreaker.
    // ----------------------------------------------------------------
    alerts.sort((a, b) => {
      const severityDiff =
        SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.distance - b.distance;
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('[api/alerts] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching alerts.' },
      { status: 500 },
    );
  }
}
