/**
 * Neon Postgres serverless client.
 *
 * Uses the @neondatabase/serverless driver which works in edge/serverless
 * environments (Vercel, Cloudflare Workers, etc.).
 *
 * Returns `null` when DATABASE_URL is not configured, allowing the app
 * to fall back to API-only mode (Open-Meteo + localStorage).
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Returns a Neon SQL tagged-template function bound to DATABASE_URL,
 * or `null` if the env var is not set.
 */
export function getDb(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

/** Check whether a database connection is available. */
export function hasDb(): boolean {
  return !!process.env.DATABASE_URL;
}
