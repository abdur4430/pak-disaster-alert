import { CACHE_DURATIONS } from '@/lib/constants';

export interface WikiPlaceInfo {
  title: string;
  description: string;      // First 2-3 sentences of the article
  imageUrl: string | null;   // Main image URL
  thumbnailUrl: string | null;
  images: string[];          // Additional image URLs (up to 4)
  url: string;               // Wikipedia article URL
  coordinates?: { lat: number; lon: number };
}

/**
 * Fetch place information from Wikipedia.
 * Uses the Wikipedia REST API (no key needed).
 *
 * Strategy:
 * 1. Use /page/summary/{title} for description and main image
 * 2. Use /page/media-list/{title} for additional images
 */
export async function fetchPlaceInfo(placeName: string): Promise<WikiPlaceInfo | null> {
  try {
    // Try with "Pakistan" suffix for better results
    const searchTerms = [
      `${placeName}, Pakistan`,
      `${placeName} Pakistan`,
      placeName,
    ];

    let summaryData: any = null;

    for (const term of searchTerms) {
      const encoded = encodeURIComponent(term);
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        {
          signal: AbortSignal.timeout(8_000),
          next: { revalidate: 86400 }, // cache 24h - wiki content doesn't change often
          headers: { 'User-Agent': 'PakDisasterAlert/1.0' },
        }
      );

      if (res.ok) {
        summaryData = await res.json();
        if (summaryData.type !== 'disambiguation') break;
      }
    }

    if (!summaryData || summaryData.type === 'not_found') {
      return null;
    }

    // Fetch additional images
    let additionalImages: string[] = [];
    try {
      const mediaRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(summaryData.title)}`,
        {
          signal: AbortSignal.timeout(8_000),
          next: { revalidate: 86400 },
          headers: { 'User-Agent': 'PakDisasterAlert/1.0' },
        }
      );

      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        additionalImages = (mediaData.items ?? [])
          .filter((item: any) =>
            item.type === 'image' &&
            item.srcset &&
            !item.title?.includes('Flag') &&
            !item.title?.includes('icon') &&
            !item.title?.includes('logo') &&
            !item.title?.includes('.svg')
          )
          .slice(0, 4)
          .map((item: any) => {
            const srcset = item.srcset ?? [];
            // Get the best quality available
            const best = srcset.sort((a: any, b: any) => (b.scale ?? 1) - (a.scale ?? 1))[0];
            const src = best?.src ?? item.src ?? '';
            return src.startsWith('//') ? `https:${src}` : src;
          })
          .filter((url: string) => url.length > 0);
      }
    } catch {
      // Silently skip additional images
    }

    const mainImage = summaryData.originalimage?.source ?? summaryData.thumbnail?.source ?? null;
    const thumbnail = summaryData.thumbnail?.source ?? null;

    return {
      title: summaryData.title ?? placeName,
      description: summaryData.extract ?? '',
      imageUrl: mainImage,
      thumbnailUrl: thumbnail,
      images: additionalImages,
      url: summaryData.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(placeName)}`,
      coordinates: summaryData.coordinates ? {
        lat: summaryData.coordinates.lat,
        lon: summaryData.coordinates.lon,
      } : undefined,
    };
  } catch (error) {
    console.error('[wikipedia] Failed to fetch place info:', error);
    return null;
  }
}
