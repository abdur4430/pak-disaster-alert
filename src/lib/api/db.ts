/**
 * Neon Postgres serverless client.
 *
 * Uses the @neondatabase/serverless driver which works in edge/serverless
 * environments (Vercel, Cloudflare Workers, etc.).
 */

import { neon } from "@neondatabase/serverless";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Create a free Neon database at https://neon.tech and add the connection string to .env.local"
    );
  }
  return url;
}

/**
 * Returns a Neon SQL tagged-template function bound to DATABASE_URL.
 * Each invocation creates a fresh HTTP connection (stateless, ideal for serverless).
 */
export function getDb() {
  return neon(getDatabaseUrl());
}
