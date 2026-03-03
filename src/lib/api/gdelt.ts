/**
 * GDELT Project API client.
 *
 * Fetches supplementary disaster-related news articles for Pakistan
 * from the GDELT DOC 2.0 API. No API key is required.
 *
 * NOTE: The GDELT API can occasionally return non-JSON or empty
 * responses. All calls are wrapped in try-catch and return an empty
 * array on any failure.
 *
 * @see https://blog.gdeltproject.org/gdelt-doc-2-0-api-documentation/
 */

import type { NewsArticle } from '@/lib/types';
import { CACHE_DURATIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  GDELT response types (only fields we need)                         */
/* ------------------------------------------------------------------ */

interface GDELTArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string;       // "YYYYMMDDTHHMMSSZ" format
  socialimage?: string;
  domain: string;
  language?: string;
  sourcecountry?: string;
}

interface GDELTResponse {
  articles?: GDELTArticle[];
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Parse the GDELT date format ("YYYYMMDDTHHMMSSZ") into a valid
 * ISO-8601 string.
 *
 * Example: "20250304T143022Z" -> "2025-03-04T14:30:22.000Z"
 */
function parseGDELTDate(raw: string): string {
  try {
    // Try standard Date parsing first (handles ISO-like strings).
    const attempt = new Date(raw);
    if (!isNaN(attempt.getTime())) {
      return attempt.toISOString();
    }

    // Manual parse for "YYYYMMDDTHHMMSSZ" format.
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(9, 11);
    const minute = raw.slice(11, 13);
    const second = raw.slice(13, 15);

    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    const parsed = new Date(iso);

    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch disaster-related news articles for Pakistan from GDELT.
 *
 * Returns an empty array on any network, parsing, or API failure.
 */
export async function fetchGDELTNews(): Promise<NewsArticle[]> {
  try {
    const params = new URLSearchParams({
      query: 'disaster Pakistan earthquake flood',
      mode: 'artlist',
      format: 'json',
      maxrecords: '20',
      sort: 'DateDesc',
    });

    const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_DURATIONS.news },
    });

    if (!response.ok) {
      console.error(`[gdelt] HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: GDELTResponse = await response.json();

    if (!data.articles || !Array.isArray(data.articles)) {
      console.error('[gdelt] Unexpected response -- no articles array');
      return [];
    }

    const articles: NewsArticle[] = data.articles.map((article) => ({
      title: article.title ?? 'Untitled',
      description: '', // GDELT article list mode does not include descriptions.
      url: article.url,
      image: article.socialimage ?? undefined,
      source: article.domain ?? 'GDELT',
      publishedAt: parseGDELTDate(article.seendate),
    }));

    return articles;
  } catch (error) {
    console.error('[gdelt] Failed to fetch news:', error);
    return [];
  }
}
