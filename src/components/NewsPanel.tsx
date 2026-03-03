'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { NewsArticle } from '@/lib/types';

/** Refresh interval: 30 minutes. */
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

function NewsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NewsPanel() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news');
      if (!res.ok) {
        throw new Error(`Failed to fetch news: ${res.status}`);
      }
      const data: NewsArticle[] = await res.json();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();

    const interval = setInterval(fetchNews, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          Latest News
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && articles.length === 0 ? (
          <NewsSkeleton />
        ) : error ? (
          <p className="text-center text-sm text-destructive py-4">{error}</p>
        ) : articles.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No news articles available.
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 pr-4">
              {articles.map((article, idx) => (
                <div key={idx}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Thumbnail */}
                    {article.image ? (
                      <img
                        src={article.image}
                        alt=""
                        className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Newspaper className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      {article.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {article.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span>{article.source}</span>
                        <span className="opacity-50">|</span>
                        <span>
                          {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                        </span>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </a>
                  {idx < articles.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
