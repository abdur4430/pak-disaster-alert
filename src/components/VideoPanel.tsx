'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Video, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { YouTubeVideo } from '@/lib/api/youtube';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Auto-refresh interval: 30 minutes. */
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

/** Fixed card width for consistent tiling in the horizontal scroll row. */
const CARD_WIDTH = 250;

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface VideoPanelProps {
  locationName?: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Skeleton loader                                                            */
/* -------------------------------------------------------------------------- */

function VideoSkeleton() {
  return (
    <div className="flex gap-4 pb-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-shrink-0" style={{ width: CARD_WIDTH }}>
          <Skeleton className="h-[140px] w-full rounded-lg" />
          <div className="mt-2 space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Single video card                                                          */
/* -------------------------------------------------------------------------- */

function VideoCard({ video }: { video: YouTubeVideo }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 block rounded-lg overflow-hidden hover:ring-1 hover:ring-primary/40 transition-all"
      style={{ width: CARD_WIDTH }}
    >
      {/* Thumbnail with play overlay */}
      <div className="relative aspect-video w-full bg-muted overflow-hidden rounded-lg">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/60 p-2.5 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
            <Play className="h-5 w-5 text-white fill-white" />
          </div>
        </div>

        {/* External link hint */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded bg-black/60 p-1 backdrop-blur-sm">
            <ExternalLink className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="px-1 pt-2 pb-1">
        <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {video.title}
        </h4>
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">{video.channelTitle}</span>
          <span className="opacity-40">|</span>
          <span className="flex-shrink-0">
            {format(new Date(video.publishedAt), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function VideoPanel({ locationName }: VideoPanelProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevLocationRef = useRef<string | null | undefined>(undefined);

  const fetchVideos = useCallback(async (location?: string | null) => {
    setLoading(true);
    setError(null);

    try {
      let url: string;
      if (location) {
        url = `/api/videos?location=${encodeURIComponent(location)}`;
      } else {
        url = '/api/videos?q=Pakistan+disaster+news';
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch videos: ${res.status}`);
      }

      const data: YouTubeVideo[] = await res.json();
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when locationName changes
  useEffect(() => {
    // Only re-fetch if location actually changed
    if (prevLocationRef.current !== locationName) {
      prevLocationRef.current = locationName;
      fetchVideos(locationName);
    }
  }, [locationName, fetchVideos]);

  // Initial fetch
  useEffect(() => {
    fetchVideos(locationName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVideos(locationName);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [locationName, fetchVideos]);

  /* ---------------------------------------------------------------------- */
  /*  Derive the heading label                                                */
  /* ---------------------------------------------------------------------- */

  const heading = locationName
    ? `Videos - ${locationName}`
    : 'Disaster News Videos';

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Video className="h-4 w-4 text-red-400" />
          {heading}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Loading state */}
        {loading && videos.length === 0 ? (
          <VideoSkeleton />
        ) : error ? (
          /* Error state */
          <p className="text-center text-sm text-destructive py-4">
            {error}
          </p>
        ) : videos.length === 0 ? (
          /* Empty state - graceful degradation */
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Video className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground text-center">
              No videos available
            </p>
            <p className="text-xs text-muted-foreground/60 text-center">
              Add YOUTUBE_API_KEY for video results
            </p>
          </div>
        ) : (
          /* Video cards in horizontal scroll */
          <ScrollArea className="w-full" type="always">
            <div className="flex gap-4 pb-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
