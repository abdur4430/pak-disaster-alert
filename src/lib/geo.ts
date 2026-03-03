/**
 * Geographic utility functions for the Pakistan Disaster Alert system.
 * All distance calculations use the Haversine formula.
 */

import { N_PAKISTAN_BOUNDS, DEFAULT_ALERT_RADIUS } from "./constants";

/** Mean radius of the Earth in kilometers. */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the great-circle distance between two points on the Earth's
 * surface using the Haversine formula.
 *
 * @param lat1 - Latitude of point 1 in decimal degrees.
 * @param lon1 - Longitude of point 1 in decimal degrees.
 * @param lat2 - Latitude of point 2 in decimal degrees.
 * @param lon2 - Longitude of point 2 in decimal degrees.
 * @returns Distance in kilometers.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Determine whether an event location falls within a given radius of the
 * user's position.
 *
 * @param userLat  - User's latitude in decimal degrees.
 * @param userLon  - User's longitude in decimal degrees.
 * @param eventLat - Event's latitude in decimal degrees.
 * @param eventLon - Event's longitude in decimal degrees.
 * @param radiusKm - Radius threshold in kilometers (defaults to DEFAULT_ALERT_RADIUS).
 * @returns `true` if the event is within the radius, `false` otherwise.
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  eventLat: number,
  eventLon: number,
  radiusKm: number = DEFAULT_ALERT_RADIUS,
): boolean {
  const distance = calculateDistance(userLat, userLon, eventLat, eventLon);
  return distance <= radiusKm;
}

/**
 * Check whether a coordinate pair falls within the Northern Pakistan
 * bounding box defined by N_PAKISTAN_BOUNDS.
 *
 * @param lat - Latitude in decimal degrees.
 * @param lon - Longitude in decimal degrees.
 * @returns `true` if the point is inside the bounding box.
 */
export function isInNorthernPakistan(lat: number, lon: number): boolean {
  return (
    lat >= N_PAKISTAN_BOUNDS.lat.min &&
    lat <= N_PAKISTAN_BOUNDS.lat.max &&
    lon >= N_PAKISTAN_BOUNDS.lon.min &&
    lon <= N_PAKISTAN_BOUNDS.lon.max
  );
}
