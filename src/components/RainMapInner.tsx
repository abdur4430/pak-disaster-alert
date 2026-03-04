'use client';

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FLOOD_RISK_LEVELS } from '@/lib/constants';
import type { RainReport, FloodPrediction } from '@/lib/types';

// Fix Leaflet icon with bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'hue-rotate-[200deg] brightness-150',
});

L.Marker.prototype.options.icon = defaultIcon;

interface RainMapInnerProps {
  reports: RainReport[];
  prediction: FloodPrediction | null;
  userLocation: { lat: number; lon: number } | null;
  selectedLocation: { lat: number; lon: number; name: string } | null;
}

function FlyToLocation({ location }: { location: { lat: number; lon: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lon], 10, { duration: 1.5 });
    }
  }, [location, map]);
  return null;
}

function getRainMarkerRadius(mm: number): number {
  if (mm >= 100) return 12;
  if (mm >= 50) return 10;
  if (mm >= 20) return 8;
  if (mm >= 10) return 6;
  return 4;
}

function getRainMarkerColor(mm: number): string {
  if (mm >= 100) return '#7C3AED';
  if (mm >= 50) return '#EF4444';
  if (mm >= 20) return '#F97316';
  if (mm >= 10) return '#EAB308';
  return '#22C55E';
}

function getRiskColor(score: number): string {
  for (const level of FLOOD_RISK_LEVELS) {
    if (score < level.max) return level.color;
  }
  return FLOOD_RISK_LEVELS[FLOOD_RISK_LEVELS.length - 1].color;
}

export default function RainMapInner({
  reports,
  prediction,
  userLocation,
  selectedLocation,
}: RainMapInnerProps) {
  const center = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lon]
    : userLocation
      ? [userLocation.lat, userLocation.lon]
      : [30.3, 69.3];

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={6}
      className="w-full h-[450px] rounded-xl border border-border z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <FlyToLocation location={selectedLocation || userLocation} />

      {/* Flood risk zone */}
      {prediction && (
        <Circle
          center={[prediction.latitude, prediction.longitude]}
          radius={10000}
          pathOptions={{
            color: getRiskColor(prediction.risk_score),
            fillColor: getRiskColor(prediction.risk_score),
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5,5',
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Flood Risk Zone</p>
              <p className="text-xs mt-1">
                Risk: <strong className="uppercase">{prediction.risk_level}</strong>{' '}
                ({prediction.risk_score}/100)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {prediction.report_count} reports
              </p>
            </div>
          </Popup>
        </Circle>
      )}

      {/* Rain report markers */}
      {reports.map((r) => (
        <CircleMarker
          key={r.id}
          center={[r.latitude, r.longitude]}
          radius={getRainMarkerRadius(r.rainfall_mm)}
          pathOptions={{
            color: getRainMarkerColor(r.rainfall_mm),
            fillColor: getRainMarkerColor(r.rainfall_mm),
            fillOpacity: 0.7,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm max-w-[200px]">
              <p className="font-semibold">{r.rainfall_mm}mm rainfall</p>
              <p className="text-xs text-muted-foreground mt-1">
                Duration: {r.duration_hours}h
              </p>
              {r.elevation !== null && (
                <p className="text-xs text-muted-foreground">
                  Elevation: {r.elevation}m
                </p>
              )}
              {r.notes && (
                <p className="text-xs mt-1 italic">{r.notes}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* User location */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
          <Popup>
            <p className="text-sm font-medium">Your Location</p>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
