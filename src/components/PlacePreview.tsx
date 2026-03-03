'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { WikiPlaceInfo } from '@/lib/api/wikipedia';

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface PlacePreviewProps {
  placeName: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Skeleton loader                                                            */
/* -------------------------------------------------------------------------- */

function PlaceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[200px] w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-16 w-16 rounded-md" />
        <Skeleton className="h-16 w-16 rounded-md" />
        <Skeleton className="h-16 w-16 rounded-md" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Image lightbox overlay                                                     */
/* -------------------------------------------------------------------------- */

function ImageOverlay({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-label="Image preview"
    >
      <div className="relative max-w-3xl max-h-[80vh]">
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 rounded-full bg-card border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors shadow-lg"
          aria-label="Close preview"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function PlacePreview({ placeName }: PlacePreviewProps) {
  const [placeInfo, setPlaceInfo] = useState<WikiPlaceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Cache: Map of placeName -> WikiPlaceInfo (persists across re-renders)
  const cacheRef = useRef<Map<string, WikiPlaceInfo | 'not_found'>>(new Map());

  const fetchPlace = useCallback(async (name: string) => {
    // Check cache first
    const cached = cacheRef.current.get(name);
    if (cached === 'not_found') {
      setPlaceInfo(null);
      setError('No information found for this location.');
      return;
    }
    if (cached) {
      setPlaceInfo(cached);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setPlaceInfo(null);

    try {
      const res = await fetch(`/api/place?name=${encodeURIComponent(name)}`);

      if (res.status === 404) {
        cacheRef.current.set(name, 'not_found');
        setError('No information found for this location.');
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch place info: ${res.status}`);
      }

      const data: WikiPlaceInfo = await res.json();
      cacheRef.current.set(name, data);
      setPlaceInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load place info.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch whenever placeName changes
  useEffect(() => {
    if (placeName) {
      fetchPlace(placeName);
    } else {
      setPlaceInfo(null);
      setError(null);
    }
  }, [placeName, fetchPlace]);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxImage) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  /* ---------------------------------------------------------------------- */
  /*  No place selected                                                       */
  /* ---------------------------------------------------------------------- */

  if (!placeName) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-blue-400" />
            Place Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Globe className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground text-center">
              Select a location to explore
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      {/* Lightbox */}
      {lightboxImage && (
        <ImageOverlay
          src={lightboxImage}
          alt={placeInfo?.title ?? placeName}
          onClose={() => setLightboxImage(null)}
        />
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-blue-400" />
            Place Explorer
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Loading state */}
          {loading ? (
            <PlaceSkeleton />
          ) : error ? (
            /* Error / not-found state */
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Globe className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center">
                {error}
              </p>
            </div>
          ) : placeInfo ? (
            /* Place info display */
            <div className="space-y-4">
              {/* Main image */}
              {placeInfo.imageUrl && (
                <button
                  onClick={() => setLightboxImage(placeInfo.imageUrl)}
                  className="block w-full overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <img
                    src={placeInfo.imageUrl}
                    alt={placeInfo.title}
                    className="w-full h-[200px] object-cover rounded-lg hover:opacity-90 transition-opacity"
                  />
                </button>
              )}

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground">
                {placeInfo.title}
              </h3>

              {/* Description */}
              {placeInfo.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {placeInfo.description}
                </p>
              )}

              {/* Read more link */}
              <a
                href={placeInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Read more on Wikipedia
                <ExternalLink className="h-3 w-3" />
              </a>

              {/* Image gallery */}
              {placeInfo.images.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2.5 font-medium flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" />
                      Gallery
                    </p>
                    <ScrollArea className="w-full" type="always">
                      <div className="flex gap-2 pb-2">
                        {placeInfo.images.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            onClick={() => setLightboxImage(imgUrl)}
                            className="flex-shrink-0 rounded-md overflow-hidden border border-border hover:border-primary/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <img
                              src={imgUrl}
                              alt={`${placeInfo.title} - image ${idx + 1}`}
                              className="h-20 w-20 object-cover hover:opacity-80 transition-opacity"
                            />
                          </button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </>
              )}

              {/* Attribution */}
              <Separator />
              <p className="text-[10px] text-muted-foreground/60 text-center">
                Source: Wikipedia
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
