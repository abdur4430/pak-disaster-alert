'use client';

import { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  ChevronDown,
  ChevronUp,
  Cloud,
  Sun,
  Snowflake,
  CloudFog,
  CloudDrizzle,
  CloudLightning,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WeatherData } from '@/lib/types';

interface WeatherPanelProps {
  weather: WeatherData[];
  loading: boolean;
}

/** Map weather codes to icons */
function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return Sun;
  if (code >= 2 && code <= 3) return Cloud;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if (code >= 61 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return Snowflake;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return Snowflake;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

/** Prominent card for a single city */
function FeaturedWeatherCard({ data }: { data: WeatherData }) {
  const WeatherIcon = getWeatherIcon(data.current.weatherCode);

  return (
    <div className="space-y-4">
      {/* Main display */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{data.city}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{data.current.description}</p>
        </div>
        <WeatherIcon className="h-10 w-10 text-muted-foreground/60" />
      </div>

      {/* Temperature */}
      <div className="flex items-end gap-1">
        <span className="text-5xl font-bold tracking-tighter text-foreground">
          {Math.round(data.current.temperature)}
        </span>
        <span className="text-2xl text-muted-foreground mb-1">&deg;C</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <Droplets className="h-4 w-4 text-blue-400 mx-auto mb-1" />
          <p className="text-sm font-medium text-foreground">{data.current.humidity}%</p>
          <p className="text-[10px] text-muted-foreground">Humidity</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <Wind className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
          <p className="text-sm font-medium text-foreground">{Math.round(data.current.windSpeed)}</p>
          <p className="text-[10px] text-muted-foreground">km/h</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <Thermometer className="h-4 w-4 text-orange-400 mx-auto mb-1" />
          <p className="text-sm font-medium text-foreground">
            {data.daily[0] ? `${Math.round(data.daily[0].tempMax)}°` : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground">High</p>
        </div>
      </div>

      {/* Weather alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-1.5">
          {data.alerts.map((alert, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg bg-red-950/40 border border-red-900/50 p-2.5"
            >
              <CloudRain className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-red-300">{alert.event}</span>
                  <Badge className="text-[10px] bg-red-800/60 text-red-200 border-0 px-1.5 py-0">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-[11px] text-red-400/70 mt-0.5 line-clamp-2">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7-day forecast */}
      {data.daily.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2.5 font-medium">
            7-Day Forecast
          </p>
          <div className="grid grid-cols-7 gap-1">
            {data.daily.slice(0, 7).map((day, idx) => {
              const DayIcon = getWeatherIcon(day.weatherCode);
              const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
              return (
                <div key={idx} className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">{dayLabel}</p>
                  <DayIcon className="h-3.5 w-3.5 mx-auto text-muted-foreground/60 mb-1" />
                  <p className="text-xs font-medium text-foreground">{Math.round(day.tempMax)}°</p>
                  <p className="text-[10px] text-muted-foreground">{Math.round(day.tempMin)}°</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact row for city list */
function CompactCityRow({
  data,
  onClick,
}: {
  data: WeatherData;
  onClick: () => void;
}) {
  const WeatherIcon = getWeatherIcon(data.current.weatherCode);
  const hasAlerts = data.alerts && data.alerts.length > 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
    >
      <WeatherIcon className="h-5 w-5 text-muted-foreground/60 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{data.city}</span>
          {hasAlerts && (
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">{data.current.description}</span>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-lg font-semibold text-foreground">
          {Math.round(data.current.temperature)}°
        </span>
      </div>
    </button>
  );
}

function WeatherSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-12 w-24" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

export default function WeatherPanel({ weather, loading }: WeatherPanelProps) {
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (loading) return <WeatherSkeleton />;

  if (weather.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8">
          <p className="text-center text-sm text-muted-foreground">
            No weather data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If only 1 city (selected location mode), show featured card
  if (weather.length === 1) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
            <Eye className="h-3.5 w-3.5" />
            Current Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FeaturedWeatherCard data={weather[0]} />
        </CardContent>
      </Card>
    );
  }

  // Multiple cities: show featured (first or expanded) + compact list
  const featured = expandedCity
    ? weather.find((w) => w.city === expandedCity) ?? weather[0]
    : weather[0];
  const others = weather.filter((w) => w.city !== featured.city);
  const visibleOthers = showAll ? others : others.slice(0, 4);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
          <Eye className="h-3.5 w-3.5" />
          Weather Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Featured city */}
        <FeaturedWeatherCard data={featured} />

        {/* Other cities compact list */}
        {others.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-medium px-1">
              Other Cities
            </p>
            <ScrollArea className={showAll ? 'max-h-[300px]' : ''}>
              <div className="space-y-0.5">
                {visibleOthers.map((w) => (
                  <CompactCityRow
                    key={w.city}
                    data={w}
                    onClick={() =>
                      setExpandedCity(w.city === expandedCity ? null : w.city)
                    }
                  />
                ))}
              </div>
            </ScrollArea>
            {others.length > 4 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                {showAll ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show all {others.length} cities <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
