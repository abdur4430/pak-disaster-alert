'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RainReport } from '@/lib/types';

interface RainDataChartProps {
  reports: RainReport[];
}

interface ChartDataPoint {
  time: string;
  rainfall: number;
  count: number;
}

export default function RainDataChart({ reports }: RainDataChartProps) {
  const chartData = useMemo(() => {
    if (reports.length === 0) return [];

    // Bucket reports into 6-hour intervals over 72 hours
    const now = Date.now();
    const buckets: Map<string, { rainfall: number; count: number }> = new Map();

    for (let i = 11; i >= 0; i--) {
      const bucketEnd = now - i * 6 * 3600_000;
      const label = new Date(bucketEnd).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
      });
      buckets.set(label, { rainfall: 0, count: 0 });
    }

    const bucketKeys = Array.from(buckets.keys());

    for (const report of reports) {
      const reportTime = new Date(report.created_at).getTime();
      const hoursAgo = (now - reportTime) / 3600_000;
      const bucketIndex = Math.max(
        0,
        11 - Math.floor(hoursAgo / 6)
      );
      if (bucketIndex >= 0 && bucketIndex < bucketKeys.length) {
        const key = bucketKeys[bucketIndex];
        const bucket = buckets.get(key)!;
        bucket.rainfall += report.rainfall_mm;
        bucket.count += 1;
      }
    }

    return Array.from(buckets.entries()).map(
      ([time, data]): ChartDataPoint => ({
        time,
        rainfall: Math.round(data.rainfall * 10) / 10,
        count: data.count,
      })
    );
  }, [reports]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-blue-400" />
          Rainfall Over 72h
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No rainfall data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                unit="mm"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={((value?: number, name?: string) => {
                  if (name === 'rainfall') return [`${value ?? 0}mm`, 'Rainfall'];
                  return [value ?? 0, name ?? ''];
                }) as never}
              />
              <Area
                type="monotone"
                dataKey="rainfall"
                stroke="#3B82F6"
                fill="url(#rainGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
