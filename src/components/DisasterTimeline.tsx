'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DISASTER_CATEGORIES } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Disaster } from '@/lib/types';

interface DisasterTimelineProps {
  disasters: Disaster[];
}

export default function DisasterTimeline({ disasters }: DisasterTimelineProps) {
  const chartData = useMemo(() => {
    // Group disasters by year and category
    const yearMap: Record<string, Record<string, number>> = {};

    for (const d of disasters) {
      const year = new Date(d.date).getFullYear().toString();
      if (!yearMap[year]) {
        yearMap[year] = {};
      }
      yearMap[year][d.category] = (yearMap[year][d.category] || 0) + 1;
    }

    // Convert to array sorted by year
    return Object.entries(yearMap)
      .map(([year, counts]) => ({
        year,
        ...counts,
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [disasters]);

  if (disasters.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Disaster Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No disaster data available for timeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Disaster Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              stroke="hsl(var(--border))"
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
            />
            {DISASTER_CATEGORIES.map((cat) => (
              <Area
                key={cat.id}
                type="monotone"
                dataKey={cat.id}
                name={cat.label}
                stackId="1"
                stroke={cat.color}
                fill={cat.color}
                fillOpacity={0.4}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
