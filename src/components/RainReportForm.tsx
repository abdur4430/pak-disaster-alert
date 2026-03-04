'use client';

import { useState, useCallback } from 'react';
import { CloudRain, Send, MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RainReportInput } from '@/lib/types';

interface RainReportFormProps {
  onSubmit: (input: RainReportInput) => Promise<unknown>;
  submitting: boolean;
  userLocation: { lat: number; lon: number } | null;
}

function getDeviceId(): string {
  const key = 'pak-disaster-alert:device-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function RainReportForm({
  onSubmit,
  submitting,
  userLocation,
}: RainReportFormProps) {
  const [rainfallMm, setRainfallMm] = useState('');
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUseLocation = useCallback(() => {
    if (userLocation) {
      setLat(userLocation.lat.toFixed(4));
      setLon(userLocation.lon.toFixed(4));
    }
  }, [userLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    const parsedRain = parseFloat(rainfallMm);
    const parsedDuration = parseFloat(duration);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      setError('Please enter valid coordinates or use GPS.');
      return;
    }
    if (isNaN(parsedRain) || parsedRain <= 0) {
      setError('Please enter a valid rainfall amount.');
      return;
    }

    const result = await onSubmit({
      latitude: parsedLat,
      longitude: parsedLon,
      rainfall_mm: parsedRain,
      duration_hours: parsedDuration,
      notes: notes || undefined,
      device_id: getDeviceId(),
    });

    if (result) {
      setSuccess(true);
      setRainfallMm('');
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <CloudRain className="h-4 w-4 text-blue-400" />
          Report Rainfall
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Coordinates */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="30.3753"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="69.3451"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            {userLocation && (
              <button
                type="button"
                onClick={handleUseLocation}
                className="self-end rounded-md border border-border p-1.5 hover:bg-muted transition-colors"
                title="Use GPS location"
              >
                <MapPin className="h-4 w-4 text-primary" />
              </button>
            )}
          </div>

          {/* Rainfall + Duration */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Rainfall (mm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1000"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(e.target.value)}
                placeholder="25"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Duration (hrs)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="0.5">30 min</option>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
                <option value="8">8 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Heavy downpour, streets flooding..."
              maxLength={200}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-400">Report submitted successfully!</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
