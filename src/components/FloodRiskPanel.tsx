'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FLOOD_RISK_LEVELS, FLOOD_MODEL_WEIGHTS } from '@/lib/constants';
import type { FloodPrediction } from '@/lib/types';

interface FloodRiskPanelProps {
  prediction: FloodPrediction | null;
  loading: boolean;
  error: string | null;
}

function getRiskMeta(level: string) {
  return (
    FLOOD_RISK_LEVELS.find((l) => l.id === level) ?? FLOOD_RISK_LEVELS[0]
  );
}

const FACTOR_LABELS: Record<string, { label: string; weight: number }> = {
  accumulated_rainfall: { label: 'Accumulated Rainfall', weight: FLOOD_MODEL_WEIGHTS.accumulated_rainfall },
  forecast_rain: { label: 'Forecast Rain', weight: FLOOD_MODEL_WEIGHTS.forecast_rain },
  elevation: { label: 'Elevation Factor', weight: FLOOD_MODEL_WEIGHTS.elevation },
  soil_drainage: { label: 'Soil Drainage', weight: FLOOD_MODEL_WEIGHTS.soil_drainage },
  historical_pattern: { label: 'Historical Pattern', weight: FLOOD_MODEL_WEIGHTS.historical_pattern },
};

export default function FloodRiskPanel({
  prediction,
  loading,
  error,
}: FloodRiskPanelProps) {
  const meta = prediction ? getRiskMeta(prediction.risk_level) : null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          Flood Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Analyzing flood risk...
            </span>
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-red-400 py-4">{error}</p>
        )}

        {!prediction && !loading && !error && (
          <p className="text-sm text-muted-foreground py-4">
            Select a location to view flood risk.
          </p>
        )}

        {prediction && meta && !loading && (
          <div className="space-y-4">
            {/* Risk badge + score */}
            <div className="flex items-center gap-3">
              <Badge
                className="text-xs font-bold px-3 py-1"
                style={{
                  backgroundColor: meta.color + '20',
                  color: meta.color,
                  border: `1px solid ${meta.color}40`,
                }}
              >
                {meta.label.toUpperCase()}
              </Badge>
              <span className="text-2xl font-bold" style={{ color: meta.color }}>
                {prediction.risk_score}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>

            {/* Score gauge */}
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${prediction.risk_score}%`,
                  backgroundColor: meta.color,
                }}
              />
              {/* Level markers */}
              {FLOOD_RISK_LEVELS.slice(1).map((level) => (
                <div
                  key={level.id}
                  className="absolute inset-y-0 w-px bg-background/50"
                  style={{ left: `${level.min}%` }}
                />
              ))}
            </div>

            {/* Level labels */}
            <div className="flex justify-between">
              {FLOOD_RISK_LEVELS.map((level) => (
                <span
                  key={level.id}
                  className="text-[9px] uppercase tracking-wider"
                  style={{
                    color:
                      prediction.risk_level === level.id
                        ? level.color
                        : 'var(--muted-foreground)',
                    fontWeight: prediction.risk_level === level.id ? 700 : 400,
                  }}
                >
                  {level.label}
                </span>
              ))}
            </div>

            {/* Contributing factors */}
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Contributing Factors
              </p>
              {Object.entries(prediction.contributing_factors).map(
                ([key, factor]) => {
                  const info = FACTOR_LABELS[key];
                  if (!info) return null;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">
                          {info.label}
                          <span className="text-muted-foreground ml-1">
                            ({(info.weight * 100).toFixed(0)}%)
                          </span>
                        </span>
                        <span className="text-xs font-medium">
                          {factor.score}/100
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${factor.score}%`,
                            backgroundColor:
                              factor.score >= 60
                                ? '#EF4444'
                                : factor.score >= 30
                                  ? '#EAB308'
                                  : '#22C55E',
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {factor.detail}
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            {/* Report count + timestamp */}
            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
              Based on {prediction.report_count} community report
              {prediction.report_count !== 1 ? 's' : ''} &middot; Updated{' '}
              {new Date(prediction.computed_at).toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
