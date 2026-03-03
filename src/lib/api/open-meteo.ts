/**
 * Open-Meteo weather API client.
 *
 * Fetches current conditions and 7-day forecasts for a list of cities
 * using the free Open-Meteo API (no API key required).
 *
 * @see https://open-meteo.com/en/docs
 */

import type { WeatherData } from '@/lib/types';
import { API_URLS, CACHE_DURATIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  WMO weather code descriptions                                     */
/* ------------------------------------------------------------------ */

/**
 * Map a WMO weather interpretation code to a human-readable description.
 *
 * @see https://open-meteo.com/en/docs#weathervariables
 */
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return descriptions[code] ?? 'Unknown';
}

/* ------------------------------------------------------------------ */
/*  Open-Meteo response types (only used fields)                       */
/* ------------------------------------------------------------------ */

interface OpenMeteoCurrentUnits {
  temperature_2m: string;
  relative_humidity_2m: string;
  wind_speed_10m: string;
  weather_code: string;
}

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  weather_code: number;
}

interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current: OpenMeteoCurrent;
  current_units: OpenMeteoCurrentUnits;
  daily: OpenMeteoDaily;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

interface CityInput {
  name: string;
  latitude: number;
  longitude: number;
}

/** Fetch weather for a single city. */
async function fetchCityWeather(city: CityInput): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'Asia/Karachi',
    forecast_days: '7',
  });

  const url = `${API_URLS.openMeteo}/forecast?${params.toString()}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: CACHE_DURATIONS.weather },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: OpenMeteoResponse = await response.json();

  const daily = data.daily.time.map((date, i) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i] ?? 0,
    tempMin: data.daily.temperature_2m_min[i] ?? 0,
    weatherCode: data.daily.weather_code[i] ?? 0,
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
  }));

  return {
    city: city.name,
    latitude: data.latitude,
    longitude: data.longitude,
    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      description: getWeatherDescription(data.current.weather_code),
    },
    daily,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch weather data for multiple cities in parallel.
 *
 * Uses `Promise.allSettled` so a failure for one city does not block
 * the others. Failed cities are logged and omitted from the result.
 */
export async function fetchWeather(
  cities: Array<{ name: string; latitude: number; longitude: number }>,
): Promise<WeatherData[]> {
  try {
    const results = await Promise.allSettled(cities.map(fetchCityWeather));

    const weatherData: WeatherData[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        weatherData.push(result.value);
      } else {
        console.error(
          `[open-meteo] Failed to fetch weather for ${cities[index]?.name}:`,
          result.reason,
        );
      }
    });

    return weatherData;
  } catch (error) {
    console.error('[open-meteo] Failed to fetch weather:', error);
    return [];
  }
}
