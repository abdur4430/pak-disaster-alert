'use client';

import { useMemo } from 'react';
import { BarChart3, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import type { Disaster, Alert } from '@/lib/types';

interface StatsCardsProps {
  disasters: Disaster[];
  alerts: Alert[];
}

export default function StatsCards({ disasters, alerts }: StatsCardsProps) {
  const stats = useMemo(() => {
    // Most affected region: calculate which region/location appears most
    const locationCounts: Record<string, number> = {};
    for (const d of disasters) {
      // Use the first part of the title or approximate region
      const parts = d.title.split(',');
      const region = parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown';
      locationCounts[region] = (locationCounts[region] || 0) + 1;
    }

    let mostAffectedRegion = 'N/A';
    let maxCount = 0;
    for (const [region, count] of Object.entries(locationCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostAffectedRegion = region;
      }
    }

    // Last major event: most recent high/critical disaster
    const majorEvents = disasters
      .filter(
        (d) => d.severity === 'high' || d.severity === 'critical'
      )
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    const lastMajor = majorEvents[0] ?? null;

    return { mostAffectedRegion, lastMajor };
  }, [disasters]);

  const cards = [
    {
      title: 'Total Disasters',
      value: disasters.length.toString(),
      subtitle: 'Events tracked',
      icon: BarChart3,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Alerts',
      value: alerts.length.toString(),
      subtitle: alerts.length > 0 ? 'Proximity alerts' : 'No active alerts',
      icon: AlertTriangle,
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Most Affected',
      value: stats.mostAffectedRegion,
      subtitle: disasters.length > 0 ? 'By event count' : 'No data',
      icon: MapPin,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Last Major Event',
      value: stats.lastMajor
        ? format(new Date(stats.lastMajor.date), 'MMM d, yyyy')
        : 'N/A',
      subtitle: stats.lastMajor
        ? stats.lastMajor.title.substring(0, 40) +
          (stats.lastMajor.title.length > 40 ? '...' : '')
        : 'No major events',
      icon: Clock,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-card border-border">
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1 truncate">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {card.subtitle}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-2 ${card.bgColor} flex-shrink-0`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
