'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Star,
  StarOff,
  Shield,
  MapPin,
  Radio,
  BookOpen,
  Video,
  Image,
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDisasters } from '@/hooks/useDisasters';
import { useWeather } from '@/hooks/useWeather';
import { useAlerts } from '@/hooks/useAlerts';
import { DISASTER_CATEGORIES } from '@/lib/constants';
import type { Disaster, WeatherData } from '@/lib/types';

import AlertBanner from '@/components/AlertBanner';
import CategoryFilter from '@/components/CategoryFilter';
import DisasterTimeline from '@/components/DisasterTimeline';
import DisasterList from '@/components/DisasterList';
import WeatherPanel from '@/components/WeatherPanel';
import NewsPanel from '@/components/NewsPanel';
import StatsCards from '@/components/StatsCards';
import LocationPicker from '@/components/LocationPicker';
import FunFacts from '@/components/FunFacts';
import FavoritesPanel, { useFavorites } from '@/components/FavoritesPanel';
import DisasterMap from '@/components/DisasterMap';
import VideoPanel from '@/components/VideoPanel';
import PlacePreview from '@/components/PlacePreview';
import DisasterHistory from '@/components/DisasterHistory';
import { Separator } from '@/components/ui/separator';

interface SelectedLocation {
  name: string;
  lat: number;
  lon: number;
  region: string;
}

export default function Dashboard() {
  // Core hooks
  const { location: geoLocation } = useGeolocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { disasters } = useDisasters(selectedCategory ?? undefined);
  const { weather, loading: weatherLoading } = useWeather();
  const { alerts } = useAlerts(geoLocation);

  // UI state
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // Favorites
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  // Category counts
  const disasterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of DISASTER_CATEGORIES) counts[cat.id] = 0;
    for (const d of disasters) counts[d.category] = (counts[d.category] || 0) + 1;
    return counts;
  }, [disasters]);

  // Filter weather for selected location
  const filteredWeather: WeatherData[] = useMemo(() => {
    if (!selectedLocation) return weather;
    const match = weather.find(
      (w) => w.city.toLowerCase() === selectedLocation.name.toLowerCase(),
    );
    return match ? [match] : weather;
  }, [weather, selectedLocation]);

  // Map props
  const userLocationForMap = geoLocation
    ? { lat: geoLocation.latitude, lon: geoLocation.longitude }
    : null;

  const selectedLocationForMap = selectedLocation
    ? { lat: selectedLocation.lat, lon: selectedLocation.lon, name: selectedLocation.name }
    : null;

  // Handlers
  const handleLocationSelect = useCallback(
    (loc: { name: string; lat: number; lon: number; region: string }) => {
      setSelectedLocation(loc);
    },
    [],
  );

  const handleFavoriteSelect = useCallback(
    (loc: { name: string; lat: number; lon: number }) => {
      setSelectedLocation({ ...loc, region: '' });
      setShowFavorites(false);
    },
    [],
  );

  const handleSelectDisaster = useCallback((d: Disaster) => {
    setSelectedLocation({
      name: d.title,
      lat: d.latitude,
      lon: d.longitude,
      region: '',
    });
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!selectedLocation) return;
    if (isFavorite(selectedLocation.name)) {
      removeFavorite(selectedLocation.name);
    } else {
      addFavorite({
        name: selectedLocation.name,
        lat: selectedLocation.lat,
        lon: selectedLocation.lon,
      });
    }
  }, [selectedLocation, isFavorite, addFavorite, removeFavorite]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Alert Banner */}
      <AlertBanner alerts={alerts} />

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Branding */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">
                  PakDisaster Alert
                </h1>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Real-time disaster monitoring
                </p>
              </div>
            </div>

            {/* Location picker */}
            <div className="flex-1 max-w-lg">
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                currentLocation={selectedLocation?.name ?? null}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedLocation && (
                <button
                  onClick={toggleFavorite}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  {isFavorite(selectedLocation.name) ? (
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="hidden sm:inline text-xs">
                    {isFavorite(selectedLocation.name) ? 'Saved' : 'Save'}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  showFavorites
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Favorites</span>
                {favorites.length > 0 && (
                  <span className="rounded-full bg-primary/20 px-1.5 text-[10px] font-medium">
                    {favorites.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 space-y-6">
        {/* Favorites panel */}
        {showFavorites && (
          <FavoritesPanel onSelectFavorite={handleFavoriteSelect} />
        )}

        {/* Selected location context bar */}
        {selectedLocation && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">
                {selectedLocation.name}
              </span>
              {selectedLocation.region && (
                <span className="text-xs text-muted-foreground ml-2">
                  {selectedLocation.region}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* ═══════════════ ROW 1: Map + Weather/FunFacts sidebar ═══════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8">
            <DisasterMap
              disasters={disasters}
              userLocation={userLocationForMap}
              selectedLocation={selectedLocationForMap}
            />
          </div>
          <div className="xl:col-span-4 space-y-5">
            <WeatherPanel weather={filteredWeather} loading={weatherLoading} />
            <FunFacts cityName={selectedLocation?.name ?? null} />
          </div>
        </div>

        {/* ═══════════════ ROW 2: Place Preview + Video Panel ═══════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Place images & info from Wikipedia */}
          <div className="xl:col-span-5">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              <Image className="h-3.5 w-3.5" />
              Explore Location
            </h2>
            <PlacePreview placeName={selectedLocation?.name ?? null} />
          </div>

          {/* YouTube videos */}
          <div className="xl:col-span-7">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              <Video className="h-3.5 w-3.5" />
              Disaster News Videos
            </h2>
            <VideoPanel locationName={selectedLocation?.name} />
          </div>
        </div>

        {/* ═══════════════ ROW 3: Stats Cards ═══════════════ */}
        <StatsCards disasters={disasters} alerts={alerts} />

        <Separator className="my-2" />

        {/* ═══════════════ ROW 4: Category Filter + Timeline ═══════════════ */}
        <CategoryFilter
          activeCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          disasterCounts={disasterCounts}
        />
        <DisasterTimeline disasters={disasters} />

        <Separator className="my-2" />

        {/* ═══════════════ ROW 5: Disaster History ═══════════════ */}
        <div>
          <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            <BookOpen className="h-3.5 w-3.5" />
            Pakistan Disaster History
          </h2>
          <DisasterHistory />
        </div>

        <Separator className="my-2" />

        {/* ═══════════════ ROW 6: Live Disasters + News ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              <Radio className="h-3.5 w-3.5" />
              Live Disaster Events
            </h2>
            <DisasterList
              disasters={disasters}
              onSelectDisaster={handleSelectDisaster}
            />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              &nbsp;
            </h2>
            <NewsPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                PakDisaster Alert &mdash; Real-time disaster monitoring for Pakistan
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Data: USGS &middot; ReliefWeb &middot; GDACS &middot; NASA EONET &middot; Open-Meteo &middot; GDELT &middot; Wikipedia &middot; YouTube
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
