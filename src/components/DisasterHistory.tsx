'use client';

import { useState, useMemo } from 'react';
import { Skull, Users, MapPin, Calendar, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MAJOR_DISASTERS,
  HISTORY_CATEGORY_COLORS,
  type HistoricalDisaster,
} from '@/lib/disaster-history';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Number of events shown in collapsed state. */
const COLLAPSED_COUNT = 5;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Get the display color for a disaster category. Falls back to neutral grey. */
function getCategoryColor(category: string): string {
  return HISTORY_CATEGORY_COLORS[category] ?? '#718096';
}

/** Capitalize the first letter of a string. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Derive unique category list from the dataset. */
function getUniqueCategories(disasters: HistoricalDisaster[]): string[] {
  const seen = new Set<string>();
  for (const d of disasters) {
    seen.add(d.category);
  }
  return Array.from(seen).sort();
}

/* -------------------------------------------------------------------------- */
/*  Filter chips                                                               */
/* -------------------------------------------------------------------------- */

function CategoryFilterChips({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: string[];
  activeCategory: string | null;
  onSelect: (cat: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* All chip */}
      <button
        onClick={() => onSelect(null)}
        className={`
          rounded-full px-3 py-1 text-xs font-medium transition-colors border
          ${
            activeCategory === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
          }
        `}
      >
        All
      </button>

      {categories.map((cat) => {
        const color = getCategoryColor(cat);
        const isActive = activeCategory === cat;

        return (
          <button
            key={cat}
            onClick={() => onSelect(isActive ? null : cat)}
            className={`
              rounded-full px-3 py-1 text-xs font-medium transition-colors border
              ${
                isActive
                  ? 'text-white border-transparent'
                  : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
              }
            `}
            style={isActive ? { backgroundColor: color, borderColor: color } : undefined}
          >
            {capitalize(cat)}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Single timeline entry                                                      */
/* -------------------------------------------------------------------------- */

function TimelineEntry({
  disaster,
  isLast,
}: {
  disaster: HistoricalDisaster;
  isLast: boolean;
}) {
  const color = getCategoryColor(disaster.category);

  return (
    <div className="relative flex gap-4">
      {/* Left column: year + timeline line */}
      <div className="flex flex-col items-center flex-shrink-0 w-16">
        {/* Year label */}
        <span className="text-sm font-bold text-foreground tabular-nums">
          {disaster.year}
        </span>

        {/* Colored dot */}
        <div className="relative mt-1.5 mb-1.5">
          <div
            className="h-3.5 w-3.5 rounded-full border-2 border-card z-10 relative"
            style={{ backgroundColor: color }}
          />
          {/* Glow effect */}
          <div
            className="absolute inset-0 rounded-full blur-[4px] opacity-40"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Vertical connecting line */}
        {!isLast && (
          <div className="w-px flex-1 min-h-[24px] bg-border" />
        )}
      </div>

      {/* Right column: content card */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="rounded-lg bg-muted/30 border border-border p-3.5 hover:bg-muted/50 transition-colors">
          {/* Title + category badge */}
          <div className="flex flex-wrap items-start gap-2 mb-1.5">
            <h4 className="text-sm font-semibold text-foreground leading-tight flex-1 min-w-0">
              {disaster.title}
            </h4>
            <Badge
              className="text-[10px] px-2 py-0 flex-shrink-0 text-white border-0"
              style={{ backgroundColor: color }}
            >
              {capitalize(disaster.category)}
            </Badge>
          </div>

          {/* Region */}
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              {disaster.region}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {disaster.description}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3">
            {disaster.casualties && (
              <div className="flex items-center gap-1.5">
                <Skull className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs font-medium text-foreground">
                  {disaster.casualties}
                </span>
              </div>
            )}

            {disaster.affected && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-medium text-foreground">
                  {disaster.affected}
                </span>
              </div>
            )}

            {disaster.magnitude != null && (
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs font-medium text-foreground">
                  M{disaster.magnitude}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function DisasterHistory() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Unique categories derived from data
  const categories = useMemo(
    () => getUniqueCategories(MAJOR_DISASTERS),
    [],
  );

  // Filtered disasters (sorted by year descending)
  const filteredDisasters = useMemo(() => {
    const sorted = [...MAJOR_DISASTERS].sort((a, b) => b.year - a.year);
    if (!activeCategory) return sorted;
    return sorted.filter((d) => d.category === activeCategory);
  }, [activeCategory]);

  // Determine visible subset
  const shouldCollapse = filteredDisasters.length > COLLAPSED_COUNT && !expanded;
  const visibleDisasters = shouldCollapse
    ? filteredDisasters.slice(0, COLLAPSED_COUNT)
    : filteredDisasters;

  // Reset expansion when changing filters
  const handleCategorySelect = (cat: string | null) => {
    setActiveCategory(cat);
    setExpanded(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Major Disaster History
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
            {filteredDisasters.length} events
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Category filter chips */}
        <CategoryFilterChips
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategorySelect}
        />

        {/* Empty state */}
        {filteredDisasters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Calendar className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground text-center">
              No disasters found for this category.
            </p>
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div className="relative">
              {visibleDisasters.map((disaster, idx) => (
                <TimelineEntry
                  key={`${disaster.year}-${disaster.title}`}
                  disaster={disaster}
                  isLast={idx === visibleDisasters.length - 1}
                />
              ))}
            </div>

            {/* Show more / less button */}
            {filteredDisasters.length > COLLAPSED_COUNT && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-3 mt-1 transition-colors border-t border-border"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Show all {filteredDisasters.length} events{' '}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
