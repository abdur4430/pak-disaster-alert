import { CACHE_DURATIONS } from '@/lib/constants';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;       // URL to thumbnail (medium quality)
  channelTitle: string;
  publishedAt: string;     // ISO date
  url: string;             // https://www.youtube.com/watch?v=...
}

/**
 * Search YouTube for disaster-related videos.
 * Requires YOUTUBE_API_KEY env var.
 * Falls back to empty array if no key.
 *
 * API: GET https://www.googleapis.com/youtube/v3/search
 *   ?part=snippet
 *   &q={query}
 *   &type=video
 *   &maxResults=8
 *   &order=date
 *   &regionCode=PK
 *   &key={YOUTUBE_API_KEY}
 */
export async function searchYouTubeVideos(query?: string): Promise<YouTubeVideo[]> {
  // Default query if none provided
  const searchQuery = query || 'Pakistan disaster earthquake flood news';

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('[youtube] YOUTUBE_API_KEY not set - skipping video search');
    return [];
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: '8',
      order: 'date',
      regionCode: 'PK',
      relevanceLanguage: 'en',
      key: apiKey,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: CACHE_DURATIONS.news },
    });

    if (!res.ok) {
      console.error(`[youtube] HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();

    return (data.items ?? []).map((item: any) => ({
      id: item.id?.videoId ?? '',
      title: item.snippet?.title ?? '',
      description: item.snippet?.description ?? '',
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? '',
      channelTitle: item.snippet?.channelTitle ?? '',
      publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    }));
  } catch (error) {
    console.error('[youtube] Failed to search videos:', error);
    return [];
  }
}

/**
 * Search for videos about a specific location in Pakistan.
 */
export async function searchLocationVideos(locationName: string): Promise<YouTubeVideo[]> {
  return searchYouTubeVideos(`${locationName} Pakistan travel documentary`);
}
