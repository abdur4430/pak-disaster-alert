'use client';

import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DISASTER_CATEGORIES } from '@/lib/constants';
import type { Disaster } from '@/lib/types';

interface DisasterListProps {
  disasters: Disaster[];
  onSelectDisaster?: (d: Disaster) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-yellow-600 text-white',
  low: 'bg-blue-600 text-white',
};

export default function DisasterList({
  disasters,
  onSelectDisaster,
}: DisasterListProps) {
  if (disasters.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            No disasters found matching the current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-4">
        {disasters.map((disaster) => {
          const category = DISASTER_CATEGORIES.find(
            (c) => c.id === disaster.category
          );

          return (
            <Card
              key={disaster.id}
              className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onSelectDisaster?.(disaster)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Category badge and severity */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge
                        className="text-xs text-white"
                        style={{
                          backgroundColor: category?.color ?? '#6B7280',
                        }}
                      >
                        {category?.label ?? disaster.category}
                      </Badge>
                      {disaster.severity && (
                        <Badge
                          className={`text-xs ${SEVERITY_COLORS[disaster.severity] ?? ''}`}
                        >
                          {disaster.severity}
                        </Badge>
                      )}
                      {disaster.magnitude && (
                        <Badge variant="outline" className="text-xs">
                          M{disaster.magnitude.toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {disaster.title}
                    </h3>

                    {/* Date and source */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(disaster.date), 'MMM d, yyyy')}
                      </span>
                      <span className="opacity-50">|</span>
                      <span className="uppercase">{disaster.source}</span>
                    </div>

                    {/* Description snippet */}
                    {disaster.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {disaster.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
