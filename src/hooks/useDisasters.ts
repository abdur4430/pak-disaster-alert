'use client';

import { useState, useEffect, useCallback } from 'react';
import { Disaster } from '@/lib/types';

interface UseDisastersReturn {
  disasters: Disaster[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDisasters(category?: string): UseDisastersReturn {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisasters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) {
        params.set('category', category);
      }

      const queryString = params.toString();
      const url = `/api/disasters${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch disasters: ${response.status} ${response.statusText}`
        );
      }

      const data: Disaster[] = await response.json();
      setDisasters(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setDisasters([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchDisasters();
  }, [fetchDisasters]);

  return { disasters, loading, error, refetch: fetchDisasters };
}
