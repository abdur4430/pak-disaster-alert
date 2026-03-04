'use client';

import { Droplets } from 'lucide-react';
import { useRainReports } from '@/hooks/useRainReports';
import { useFloodRisk } from '@/hooks/useFloodRisk';
import RainMap from '@/components/RainMap';
import FloodRiskPanel from '@/components/FloodRiskPanel';
import CommunityStats from '@/components/CommunityStats';
import RainReportForm from '@/components/RainReportForm';
import RainDataChart from '@/components/RainDataChart';

interface FloodMonitorProps {
  selectedLocation: { lat: number; lon: number; name: string } | null;
  userLocation: { lat: number; lon: number } | null;
}

export default function FloodMonitor({
  selectedLocation,
  userLocation,
}: FloodMonitorProps) {
  const targetLat = selectedLocation?.lat ?? userLocation?.lat;
  const targetLon = selectedLocation?.lon ?? userLocation?.lon;

  const { reports, loading: reportsLoading, submitReport, submitting } =
    useRainReports(targetLat, targetLon, 50);

  const {
    prediction,
    loading: riskLoading,
    error: riskError,
  } = useFloodRisk(targetLat, targetLon);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Droplets className="h-4 w-4 text-blue-400" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Flood Monitor — Crowdsourced Rain Measurement & Prediction
        </h2>
      </div>

      {!targetLat && !targetLon && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Droplets className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Select a location or enable GPS to view flood risk analysis and
            submit rain reports.
          </p>
        </div>
      )}

      {(targetLat !== undefined && targetLon !== undefined) && (
        <>
          {/* ROW 1: Map + Flood Risk Panel */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8">
              <RainMap
                reports={reports}
                prediction={prediction}
                userLocation={userLocation}
                selectedLocation={selectedLocation}
              />
            </div>
            <div className="xl:col-span-4">
              <FloodRiskPanel
                prediction={prediction}
                loading={riskLoading}
                error={riskError}
              />
            </div>
          </div>

          {/* ROW 2: Community Stats */}
          <CommunityStats reports={reports} />

          {/* ROW 3: Rain Report Form + Rainfall Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5">
              <RainReportForm
                onSubmit={submitReport}
                submitting={submitting}
                userLocation={userLocation}
              />
            </div>
            <div className="xl:col-span-7">
              <RainDataChart reports={reports} />
            </div>
          </div>

          {/* Loading indicator for reports */}
          {reportsLoading && reports.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Loading rain reports...
            </p>
          )}
        </>
      )}
    </div>
  );
}
