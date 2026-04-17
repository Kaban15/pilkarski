"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// Fix default marker icons (Leaflet + webpack issue)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const sparingIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "hue-rotate-[120deg]", // green tint
});

const eventIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "hue-rotate-[270deg]", // violet tint
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: "sparing" | "event";
  location?: string;
  date?: string;
  href: string;
}

interface MapViewProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Poland center
const POLAND_CENTER: [number, number] = [51.92, 19.15];
const DEFAULT_ZOOM = 6;

export function MapView({ markers, center = POLAND_CENTER, zoom = DEFAULT_ZOOM, className = "h-[500px]" }: MapViewProps) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Hydration gate — Leaflet requires window, defer render until after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`${className} animate-pulse rounded-lg bg-muted`} />;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`${className} rounded-lg`}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker
          key={`${m.type}-${m.id}`}
          position={[m.lat, m.lng]}
          icon={m.type === "sparing" ? sparingIcon : eventIcon}
        >
          <Popup>
            <div className="min-w-[150px]">
              <p className="font-semibold">{m.title}</p>
              {m.location && <p className="text-xs text-gray-600">{m.location}</p>}
              {m.date && <p className="text-xs text-gray-500">{m.date}</p>}
              <Link href={m.href} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
                {t("Szczegóły →")}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
