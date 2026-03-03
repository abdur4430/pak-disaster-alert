'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, X, Heart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const STORAGE_KEY = 'pak-disaster-alert:favorites';
const MAX_FAVORITES = 10;

interface FavoriteLocation {
  name: string;
  lat: number;
  lon: number;
}

interface FavoritesPanelProps {
  onSelectFavorite: (location: FavoriteLocation) => void;
}

/**
 * Custom hook to manage favorite locations in localStorage.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FavoriteLocation[];
        setFavorites(parsed);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const saveFavorites = useCallback((updated: FavoriteLocation[]) => {
    setFavorites(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail
    }
  }, []);

  const addFavorite = useCallback(
    (location: FavoriteLocation) => {
      setFavorites((prev) => {
        // Check if already exists
        if (prev.some((f) => f.name === location.name)) {
          return prev;
        }
        if (prev.length >= MAX_FAVORITES) {
          return prev;
        }
        const updated = [...prev, location];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Silently fail
        }
        return updated;
      });
    },
    []
  );

  const removeFavorite = useCallback(
    (name: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((f) => f.name !== name);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Silently fail
        }
        return updated;
      });
    },
    []
  );

  const isFavorite = useCallback(
    (name: string) => {
      return favorites.some((f) => f.name === name);
    },
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite, saveFavorites };
}

export default function FavoritesPanel({
  onSelectFavorite,
}: FavoritesPanelProps) {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Heart className="h-4 w-4 text-pink-400" />
          Favorites
          {favorites.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({favorites.length}/{MAX_FAVORITES})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No favorites saved yet. Add locations from the search bar.
          </p>
        ) : (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1">
              {favorites.map((fav) => (
                <div
                  key={fav.name}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors group"
                >
                  <button
                    onClick={() => onSelectFavorite(fav)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">
                      {fav.name}
                    </span>
                  </button>
                  <button
                    onClick={() => removeFavorite(fav.name)}
                    className="p-0.5 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    aria-label={`Remove ${fav.name} from favorites`}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
