/**
 * Core TypeScript interfaces for the Pakistan Disaster Alert system.
 */

import type { DisasterCategoryId } from "./constants";

/** A single disaster event from any data source. */
export interface Disaster {
  id: string;
  title: string;
  /** Must match one of the DISASTER_CATEGORIES ids. */
  category: DisasterCategoryId;
  /** ISO-8601 date string. */
  date: string;
  latitude: number;
  longitude: number;
  /** Richter magnitude (applicable to earthquakes). */
  magnitude?: number;
  severity?: "low" | "medium" | "high" | "critical";
  /** Data source identifier: usgs, reliefweb, gdacs, or eonet. */
  source: "usgs" | "reliefweb" | "gdacs" | "eonet";
  description?: string;
  /** Link to the original report or event page. */
  url?: string;
}

/** Severity levels shared across weather alerts and disaster events. */
export type Severity = "low" | "medium" | "high" | "critical";

/** Weather alert issued by a meteorological authority. */
export interface WeatherAlert {
  event: string;
  severity: "minor" | "moderate" | "severe" | "extreme";
  description: string;
  /** ISO-8601 datetime string for alert start. */
  start: string;
  /** ISO-8601 datetime string for alert end. */
  end: string;
}

/** Current conditions and forecast for a single city. */
export interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  current: {
    /** Temperature in Celsius. */
    temperature: number;
    /** Relative humidity percentage (0-100). */
    humidity: number;
    /** Wind speed in km/h. */
    windSpeed: number;
    /** WMO weather interpretation code. */
    weatherCode: number;
    /** Human-readable weather description. */
    description: string;
  };
  daily: Array<{
    /** ISO-8601 date string. */
    date: string;
    /** Maximum temperature in Celsius. */
    tempMax: number;
    /** Minimum temperature in Celsius. */
    tempMin: number;
    /** WMO weather interpretation code. */
    weatherCode: number;
    /** Total precipitation in mm. */
    precipitationSum: number;
  }>;
  alerts?: WeatherAlert[];
}

/** A news article related to disasters or weather events. */
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  /** Thumbnail or hero image URL. */
  image?: string;
  /** Publisher or news agency name. */
  source: string;
  /** ISO-8601 datetime string. */
  publishedAt: string;
}

/** A proximity-based alert surfaced to the user. */
export interface Alert {
  id: string;
  type: "weather" | "disaster";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  /** Distance from the user's location in km. */
  distance: number;
  latitude: number;
  longitude: number;
}

/** User's current geolocation obtained via the Geolocation API. */
export interface UserLocation {
  latitude: number;
  longitude: number;
  /** Accuracy of the position in meters. */
  accuracy: number;
  /** Unix timestamp in milliseconds when the position was acquired. */
  timestamp: number;
}
