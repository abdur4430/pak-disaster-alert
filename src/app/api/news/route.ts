/**
 * GET /api/news
 *
 * Aggregates disaster-related news from two sources:
 *   - GNews (curated search results, requires API key)
 *   - GDELT (supplementary global event news, free)
 *
 * Articles are merged, deduplicated by title similarity, and sorted by
 * publishedAt descending (most recent first).
 *
 * ISR revalidation is set to 1 hour.
 */

import { NextResponse } from 'next/server';
import { fetchGNews } from '@/lib/api/gnews';
import { fetchGDELTNews } from '@/lib/api/gdelt';
import type { NewsArticle } from '@/lib/types';

export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*  Deduplication helpers                                              */
/* ------------------------------------------------------------------ */

/**
 * Normalize a title for similarity comparison by lower-casing, stripping
 * punctuation, and collapsing whitespace.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute a simple bigram-based similarity ratio between two strings.
 * Returns a value between 0 (no overlap) and 1 (identical bigrams).
 */
function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) {
    bigramsA.add(a.slice(i, i + 2));
  }

  const bigramsB = new Set<string>();
  for (let i = 0; i < b.length - 1; i++) {
    bigramsB.add(b.slice(i, i + 2));
  }

  let intersection = 0;
  for (const bigram of bigramsA) {
    if (bigramsB.has(bigram)) {
      intersection++;
    }
  }

  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Similarity threshold above which two articles are considered duplicates. */
const SIMILARITY_THRESHOLD = 0.65;

/**
 * Deduplicate articles by title similarity.
 *
 * For each pair of articles, if the normalized title similarity exceeds
 * the threshold the later article (by index, i.e. the one encountered
 * second) is dropped. This is an O(n^2) check but n is small (<=30).
 */
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const kept: NewsArticle[] = [];
  const keptNormalized: string[] = [];

  for (const article of articles) {
    const normalized = normalizeTitle(article.title);
    let isDuplicate = false;

    for (const existing of keptNormalized) {
      if (bigramSimilarity(normalized, existing) >= SIMILARITY_THRESHOLD) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      kept.push(article);
      keptNormalized.push(normalized);
    }
  }

  return kept;
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    // Fetch both news sources in parallel
    const [gnewsResult, gdeltResult] = await Promise.allSettled([
      fetchGNews(),
      fetchGDELTNews(),
    ]);

    const allArticles: NewsArticle[] = [];

    if (gnewsResult.status === 'fulfilled') {
      allArticles.push(...gnewsResult.value);
    } else {
      console.error('[api/news] GNews source failed:', gnewsResult.reason);
    }

    if (gdeltResult.status === 'fulfilled') {
      allArticles.push(...gdeltResult.value);
    } else {
      console.error('[api/news] GDELT source failed:', gdeltResult.reason);
    }

    // Sort by publishedAt descending before dedup so that when two
    // articles are similar the more recent one (which comes first) is kept.
    allArticles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    // Deduplicate by title similarity
    const articles = deduplicateArticles(allArticles);

    return NextResponse.json(articles);
  } catch (error) {
    console.error('[api/news] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching news.' },
      { status: 500 },
    );
  }
}
