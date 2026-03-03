'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KEY_CITIES } from '@/lib/constants';

interface FunFactsProps {
  cityName: string | null;
}

/** Rotation interval in milliseconds. */
const ROTATION_INTERVAL = 5000;

export default function FunFacts({ cityName }: FunFactsProps) {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Look up the city in KEY_CITIES to get fun facts
  const city = cityName
    ? KEY_CITIES.find(
        (c) => c.name.toLowerCase() === cityName.toLowerCase()
      )
    : null;

  const facts = city?.funFacts ?? [];

  // Rotate facts every 5 seconds
  useEffect(() => {
    if (facts.length <= 1) return;

    setCurrentFactIndex(0);

    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % facts.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [facts.length, cityName]);

  if (!cityName || !city) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Fun Facts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a location to see fun facts about it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          Fun Facts &mdash; {city.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {facts.length > 0 ? (
          <div className="space-y-3">
            {/* Animated single fact display */}
            <div className="rounded-lg bg-muted/50 border border-border p-3 min-h-[60px] flex items-center">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="text-yellow-400 mr-1.5">&bull;</span>
                {facts[currentFactIndex]}
              </p>
            </div>

            {/* Dot indicators */}
            {facts.length > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                {facts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentFactIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentFactIndex
                        ? 'w-4 bg-yellow-400'
                        : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Show fact ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Region info */}
            <p className="text-xs text-muted-foreground text-center">
              {city.region}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No fun facts available for this location.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
