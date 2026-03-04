'use client';

import { useMemo } from 'react';
import { Users, MapPin, CloudRain, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RainReport } from '@/lib/types';

interface CommunityStatsProps {
  reports: RainReport[];
}

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}

export default function CommunityStats({ reports }: CommunityStatsProps) {
  const stats = useMemo((): StatCard[] => {
    const totalReports = reports.length;
    const uniqueDevices = new Set(reports.map((r) => r.device_id)).size;
    const highestRainfall = reports.reduce(
      (max, r) => Math.max(max, r.rainfall_mm),
      0
    );

    // Coverage: approximate unique grid cells (0.1 degree resolution)
    const cells = new Set(
      reports.map(
        (r) =>
          `${Math.round(r.latitude * 10) / 10},${Math.round(r.longitude * 10) / 10}`
      )
    );

    return [
      {
        label: 'Total Reports',
        value: String(totalReports),
        sub: 'in last 72 hours',
        icon: <CloudRain className="h-4 w-4" />,
        color: '#3B82F6',
      },
      {
        label: 'Area Coverage',
        value: `${cells.size}`,
        sub: 'grid cells covered',
        icon: <MapPin className="h-4 w-4" />,
        color: '#22C55E',
      },
      {
        label: 'Highest Rainfall',
        value: highestRainfall > 0 ? `${highestRainfall.toFixed(1)}mm` : '—',
        sub: 'single report',
        icon: <TrendingUp className="h-4 w-4" />,
        color: '#F97316',
      },
      {
        label: 'Contributors',
        value: String(uniqueDevices),
        sub: 'unique reporters',
        icon: <Users className="h-4 w-4" />,
        color: '#8B5CF6',
      },
    ];
  }, [reports]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="rounded-md p-1.5"
                style={{ backgroundColor: stat.color + '15' }}
              >
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
