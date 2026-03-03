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
import { DISASTER_CATEGORIES } from '@/lib/constants';
import type { Disaster } from '@/lib/types';

// Fix Leaflet default marker icon issue with bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'hue-rotate-[200deg] brightness-150',
});

const selectedIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'hue-rotate-[100deg] brightness-150',
});

L.Marker.prototype.options.icon = defaultIcon;

interface DisasterMapInnerProps {
  disasters: Disaster[];
  userLocation: { lat: number; lon: number } | null;
  selectedLocation: { lat: number; lon: number; name: string } | null;
}

/** Helper component to fly the map to a selected location. */
function FlyToLocation({
  location,
}: {
  location: { lat: number; lon: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lon], 10, { duration: 1.5 });
    }
  }, [location, map]);

  return null;
}

function getCategoryColor(categoryId: string): string {
  const cat = DISASTER_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.color ?? '#6B7280';
}

function getSeverityRadius(severity?: string): number {
  switch (severity) {
    case 'critical':
      return 10;
    case 'high':
      return 8;
    case 'medium':
      return 6;
    case 'low':
      return 5;
    default:
      return 5;
  }
}

export default function DisasterMapInner({
  disasters,
  userLocation,
  selectedLocation,
}: DisasterMapInnerProps) {
  return (
    <MapContainer
      center={[30.3, 69.3]}
      zoom={5}
      className="w-full h-[550px] rounded-xl border border-border z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Fly to selected location */}
      <FlyToLocation location={selectedLocation} />

      {/* Disaster markers */}
      {disasters.map((d) => (
        <CircleMarker
          key={d.id}
          center={[d.latitude, d.longitude]}
          radius={getSeverityRadius(d.severity)}
          pathOptions={{
            color: getCategoryColor(d.category),
            fillColor: getCategoryColor(d.category),
            fillOpacity: 0.6,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm max-w-[200px]">
              <p className="font-semibold text-foreground">{d.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(d.date).toLocaleDateString()}
              </p>
              <p className="text-xs mt-1">
                <span
                  className="inline-block rounded px-1.5 py-0.5 text-white text-[10px]"
                  style={{ backgroundColor: getCategoryColor(d.category) }}
                >
                  {d.category}
                </span>
                {d.severity && (
                  <span className="ml-1 text-[10px] uppercase opacity-70">
                    {d.severity}
                  </span>
                )}
              </p>
              {d.magnitude && (
                <p className="text-xs mt-1">Magnitude: M{d.magnitude.toFixed(1)}</p>
              )}
              {d.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {d.description}
                </p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* User location: blue marker with 30km radius */}
      {userLocation && (
        <>
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={userIcon}
          >
            <Popup>
              <p className="text-sm font-medium">Your Location</p>
            </Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lon]}
            radius={30000}
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
        </>
      )}

      {/* Selected location: green marker */}
      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lon]}
          icon={selectedIcon}
        >
          <Popup>
            <p className="text-sm font-medium">{selectedLocation.name}</p>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
