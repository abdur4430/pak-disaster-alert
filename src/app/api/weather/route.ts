/**
 * GET /api/weather
 *
 * Aggregates weather data from Open-Meteo (current conditions + 7-day
 * forecast) and OpenWeatherMap (weather alerts).
 *
 * Query parameters:
 *   - lat   Optional latitude for a specific location.
 *   - lon   Optional longitude for a specific location.
 *   - name  Optional city name for the custom location (defaults to
 *           "Your Location" when lat/lon are provided without a name).
 *
 * When lat/lon are omitted the handler returns weather data for all
 * KEY_CITIES defined in the constants module.
 *
 * OpenWeatherMap alerts are merged into the first few city entries
 * (limited to 3 cities to respect API rate limits).
 *
 * ISR revalidation is set to 15 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/api/open-meteo';
import { fetchWeatherAlerts } from '@/lib/api/openweather';
import { KEY_CITIES, PAKISTAN_BOUNDS } from '@/lib/constants';
import type { WeatherData } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 900;

/** Maximum number of cities for which we fetch OWM alerts (rate-limit guard). */
const MAX_ALERT_CITIES = 3;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const nameParam = searchParams.get('name');

    let weatherData: WeatherData[];

    // ----------------------------------------------------------------
    // Determine which cities to fetch
    // ----------------------------------------------------------------
    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);

      if (isNaN(lat) || isNaN(lon)) {
        return NextResponse.json(
          { error: 'Invalid lat/lon values. Both must be valid numbers.' },
          { status: 400 },
        );
      }

      // Validate coordinates are within Pakistan bounds
      if (
        lat < PAKISTAN_BOUNDS.lat.min ||
        lat > PAKISTAN_BOUNDS.lat.max ||
        lon < PAKISTAN_BOUNDS.lon.min ||
        lon > PAKISTAN_BOUNDS.lon.max
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

      const cityName = nameParam || 'Your Location';

      // Fetch weather for the specific location and OWM alerts in parallel
      const [weatherResult, alertsResult] = await Promise.allSettled([
        fetchWeather([{ name: cityName, latitude: lat, longitude: lon }]),
        fetchWeatherAlerts(lat, lon),
      ]);

      weatherData =
        weatherResult.status === 'fulfilled' ? weatherResult.value : [];

      if (alertsResult.status === 'fulfilled' && alertsResult.value.length > 0) {
        if (weatherData.length > 0) {
          weatherData[0] = {
            ...weatherData[0],
            alerts: alertsResult.value,
          };
        }
      } else if (alertsResult.status === 'rejected') {
        console.error('[api/weather] OWM alerts failed:', alertsResult.reason);
      }
    } else {
      // ------------------------------------------------------------------
      // Fetch weather for all KEY_CITIES
      // ------------------------------------------------------------------
      const cities = KEY_CITIES.map((c) => ({
        name: c.name,
        latitude: c.lat,
        longitude: c.lon,
      }));

      weatherData = await fetchWeather(cities);

      // Merge OpenWeatherMap alerts for the first few cities
      const alertCities = cities.slice(0, MAX_ALERT_CITIES);
      const alertResults = await Promise.allSettled(
        alertCities.map((city) =>
          fetchWeatherAlerts(city.latitude, city.longitude),
        ),
      );

      alertResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          // Find the matching weather entry by city name
          const cityName = alertCities[index]?.name;
          const weatherEntry = weatherData.find((w) => w.city === cityName);
          if (weatherEntry) {
            weatherEntry.alerts = result.value;
          }
        } else if (result.status === 'rejected') {
          console.error(
            `[api/weather] OWM alerts failed for ${alertCities[index]?.name}:`,
            result.reason,
          );
        }
      });
    }

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('[api/weather] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching weather data.' },
      { status: 500 },
    );
  }
}
