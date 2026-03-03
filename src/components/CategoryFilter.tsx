'use client';

import {
  Activity,
  Waves,
  MountainSnow,
  Snowflake,
  Droplets,
  Sun,
  Thermometer,
  CloudLightning,
} from 'lucide-react';
import { DISASTER_CATEGORIES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';

interface CategoryFilterProps {
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  disasterCounts: Record<string, number>;
}

/** Map of icon name strings from DISASTER_CATEGORIES to actual lucide-react components. */
const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  Waves,
  MountainSnow,
  Snowflake,
  Droplets,
  Sun,
  Thermometer,
  CloudLightning,
};

export default function CategoryFilter({
  activeCategory,
  onCategoryChange,
  disasterCounts,
}: CategoryFilterProps) {
  const totalCount = Object.values(disasterCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full overflow-x-auto py-3">
      <div className="flex items-center gap-2 min-w-max px-1">
        {/* "All" tab */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`
            flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
            ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }
          `}
        >
          <span>All</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {totalCount}
          </Badge>
        </button>

        {/* Category tabs */}
        {DISASTER_CATEGORIES.map((cat) => {
          const IconComp = ICON_MAP[cat.icon];
          const isActive = activeCategory === cat.id;
          const count = disasterCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(isActive ? null : cat.id)}
              className={`
                flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'shadow-sm text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }
              `}
              style={isActive ? { backgroundColor: cat.color } : undefined}
            >
              {IconComp && <IconComp className="h-4 w-4" />}
              <span>{cat.label}</span>
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0"
              >
                {count}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
