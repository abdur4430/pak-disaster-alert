/**
 * GNews API client.
 *
 * Fetches disaster-related news articles for Pakistan using the GNews
 * search endpoint. Requires an API key set via the GNEWS_API_KEY
 * environment variable.
 *
 * @see https://gnews.io/docs/v4
 */

import type { NewsArticle } from '@/lib/types';
import { API_URLS, CACHE_DURATIONS } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  GNews response types (only fields we need)                         */
/* ------------------------------------------------------------------ */

interface GNewsArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  image?: string;
  publishedAt: string;  // ISO-8601
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch disaster-related news articles for Pakistan from GNews.
 *
 * Returns an empty array if:
 * - The GNEWS_API_KEY env var is not set
 * - The API returns no articles
 * - Any network or parsing error occurs
 */
export async function fetchGNews(): Promise<NewsArticle[]> {
  try {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
      console.error('[gnews] GNEWS_API_KEY is not set -- skipping news fetch');
      return [];
    }

    const params = new URLSearchParams({
      q: 'disaster Pakistan earthquake flood landslide',
      lang: 'en',
      max: '10',
      token: apiKey,
    });

    const url = `${API_URLS.gnews}/search?${params.toString()}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_DURATIONS.news },
    });

    if (!response.ok) {
      console.error(`[gnews] HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const data: GNewsResponse = await response.json();

    if (!data.articles || !Array.isArray(data.articles)) {
      console.error('[gnews] Unexpected response -- no articles array');
      return [];
    }

    const articles: NewsArticle[] = data.articles.map((article) => ({
      title: article.title,
      description: article.description ?? '',
      url: article.url,
      image: article.image ?? undefined,
      source: article.source?.name ?? 'GNews',
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : new Date().toISOString(),
    }));

    return articles;
  } catch (error) {
    console.error('[gnews] Failed to fetch news:', error);
    return [];
  }
}
