'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Navigation, X } from 'lucide-react';
import { KEY_CITIES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';

interface LocationInfo {
  name: string;
  lat: number;
  lon: number;
  region: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationInfo) => void;
  currentLocation: string | null;
}

export default function LocationPicker({
  onLocationSelect,
  currentLocation,
}: LocationPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter cities based on search query
  const filtered = query.trim()
    ? KEY_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.region.toLowerCase().includes(query.toLowerCase())
      )
    : KEY_CITIES;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(city: (typeof KEY_CITIES)[number]) {
    onLocationSelect({
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      region: city.region,
    });
    setQuery('');
    setIsOpen(false);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Find the nearest city from KEY_CITIES
        let nearestIdx = 0;
        let minDist = Infinity;

        for (let i = 0; i < KEY_CITIES.length; i++) {
          const city = KEY_CITIES[i];
          const dist = Math.sqrt(
            Math.pow(pos.coords.latitude - city.lat, 2) +
              Math.pow(pos.coords.longitude - city.lon, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        }

        const nearest = KEY_CITIES[nearestIdx];

        onLocationSelect({
          name: nearest.name,
          lat: nearest.lat,
          lon: nearest.lon,
          region: nearest.region,
        });
        setGeoLoading(false);
        setIsOpen(false);
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search city or region..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <button
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title="Use my location"
        >
          <Navigation className={`h-4 w-4 ${geoLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {geoLoading ? 'Locating...' : 'My Location'}
          </span>
        </button>
      </div>

      {/* Current location display */}
      {currentLocation && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-primary">
          <MapPin className="h-3 w-3" />
          <span className="font-medium">{currentLocation}</span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute z-50 mt-1 w-full bg-card border-border shadow-lg max-h-64 overflow-auto">
          <CardContent className="py-1 px-0">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No cities found.
              </p>
            ) : (
              filtered.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleSelect(city)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">
                      {city.name}
                    </span>
                    <span className="text-muted-foreground ml-1.5">
                      {city.region}
                    </span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
