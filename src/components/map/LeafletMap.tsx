"use client";

import L from "leaflet";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { createElement, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { APP } from "@/config/app";
import { getCategory } from "@/config/categories";
import { useClock } from "@/hooks/useClock";
import type { LatLng, Place } from "@/types/place";
import { openState } from "@/utils/hours";
import { placePath } from "@/utils/links";

export interface LeafletMapProps {
  places: Place[];
  me?: LatLng;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const pinCache = new Map<string, L.DivIcon>();

function pinIcon(categoryId: string, isOpen: boolean, selected: boolean) {
  const key = `${categoryId}:${isOpen}:${selected}`;
  const cached = pinCache.get(key);
  if (cached) return cached;

  const size = selected ? 42 : 32;
  const svg = renderToStaticMarkup(createElement(getCategory(categoryId)?.icon ?? MapPin, { size: selected ? 20 : 16, strokeWidth: 2.2 }));
  const icon = L.divIcon({
    className: "",
    html: `<span class="pin ${isOpen ? "pin-open" : "pin-closed"}${selected ? " pin-selected" : ""}">${svg}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  pinCache.set(key, icon);
  return icon;
}

const meIcon = L.divIcon({ className: "", html: '<span class="me-dot"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });

function FitToPoints({ points }: { points: LatLng[] }) {
  const map = useMap();
  const lastKey = useRef("");

  useEffect(() => {
    const key = points.map((p) => `${p.lat},${p.lng}`).join("|");
    if (!points.length || key === lastKey.current) return;
    const animate = lastKey.current !== "";
    lastKey.current = key;
    if (points.length === 1) map.setView(points[0], 15, { animate });
    else map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15, animate });
  }, [map, points]);

  return null;
}

export default function LeafletMap({ places, me, selectedId, onSelect }: LeafletMapProps) {
  const router = useRouter();
  const clock = useClock();
  const select = onSelect ?? ((id: string) => router.push(placePath(id)));
  const points = me ? [...places, me] : places;

  return (
    <MapContainer center={me ?? APP.defaultLocation} zoom={APP.map.zoom} zoomControl={false} className="size-full">
      <TileLayer url={APP.map.tileUrl} attribution={APP.map.attribution} />
      <ZoomControl position="bottomright" />
      <FitToPoints points={points} />
      {places.map((p) => (
        <Marker
          key={p.id}
          position={p}
          title={p.name}
          alt={p.name}
          icon={pinIcon(p.categoryId, openState(p, clock).isOpen, p.id === selectedId)}
          eventHandlers={{ click: () => select(p.id) }}
        />
      ))}
      {me && <Marker position={me} icon={meIcon} interactive={false} keyboard={false} zIndexOffset={1000} />}
    </MapContainer>
  );
}
