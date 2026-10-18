"use client";

import L from "leaflet";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AttributionControl, MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import Supercluster from "supercluster";
import { APP } from "@/config/app";
import { getCategory } from "@/config/categories";
import { useClock } from "@/hooks/useClock";
import { useMapFocus } from "@/hooks/useUserLocation";
import type { LatLng, Place } from "@/types/place";
import { toBnDigits } from "@/utils/bangla";
import { openState } from "@/utils/hours";
import { placePath } from "@/utils/links";
import { byDistance } from "@/utils/place";

export interface LeafletMapProps {
  places: Place[];
  me?: LatLng;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const FIT_NEAREST = 20;

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

const clusterCache = new Map<string, L.DivIcon>();

function clusterIcon(categoryId: string, count: number, anyOpen: boolean) {
  const key = `${categoryId}:${count}:${anyOpen}`;
  const cached = clusterCache.get(key);
  if (cached) return cached;
  const size = count < 10 ? 38 : count < 100 ? 42 : 46;
  const svg = renderToStaticMarkup(createElement(getCategory(categoryId)?.icon ?? MapPin, { size: 18, strokeWidth: 2.2 }));
  const icon = L.divIcon({
    className: "",
    html: `<span class="cluster ${anyOpen ? "pin-open" : "pin-closed"}">${svg}<b class="cluster-count">${toBnDigits(count)}</b></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  clusterCache.set(key, icon);
  return icon;
}

type ClusterTally = Record<string, number>;

function topCategory(tally: ClusterTally) {
  let best = "";
  for (const [key, count] of Object.entries(tally)) {
    if (key.startsWith("c:") && (!best || count > tally[best])) best = key;
  }
  return best.slice(2);
}

const meIcon = L.divIcon({ className: "", html: '<span class="me-dot"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });

function FitToPoints({ points }: { points: LatLng[] }) {
  const map = useMap();
  const lastKey = useRef("");

  useEffect(() => {
    if (!points.length) return;
    const key = `${points.length}:${L.latLngBounds(points).toBBoxString()}`;
    if (key === lastKey.current) return;
    const animate = lastKey.current !== "";
    lastKey.current = key;
    if (points.length === 1) map.setView(points[0], 15, { animate });
    else map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15, animate });
  }, [map, points]);

  return null;
}

function FocusOnMe({ me }: { me?: LatLng }) {
  const map = useMap();
  const focus = useMapFocus();
  const handled = useRef(focus);

  useEffect(() => {
    if (!me || focus === handled.current) return;
    handled.current = focus;
    map.flyTo(me, 16, { duration: 0.6 });
  }, [map, me, focus]);

  return null;
}

function viewOf(map: L.Map) {
  const bounds = map.getBounds();
  return {
    bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()] as [number, number, number, number],
    zoom: Math.round(map.getZoom()),
  };
}

interface PinsProps {
  places: Place[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

function PlacePin({ place, selected, onSelect }: { place: Place; selected: boolean; onSelect: (id: string) => void }) {
  const clock = useClock();
  return (
    <Marker
      position={place}
      title={place.name}
      alt={place.name}
      zIndexOffset={selected ? 500 : 0}
      icon={pinIcon(place.categoryId, openState(place, clock).isOpen, selected)}
      eventHandlers={{ click: () => onSelect(place.id) }}
    />
  );
}

function ClusteredPins({ places, selectedId, onSelect }: PinsProps) {
  const map = useMap();
  const clock = useClock();
  const [view, setView] = useState(() => viewOf(map));
  useMapEvents({ moveend: () => setView(viewOf(map)) });

  const selected = places.find((p) => p.id === selectedId);
  const index = useMemo(() => {
    const others = places.filter((p) => p.id !== selectedId);
    const cluster = new Supercluster<{ place: Place; open: number }, ClusterTally>({
      radius: 60,
      maxZoom: 16,
      map: (p) => ({ [`c:${p.place.categoryId}`]: 1, open: p.open }),
      reduce: (acc, p) => {
        for (const [key, count] of Object.entries(p)) acc[key] = (acc[key] ?? 0) + count;
      },
    });
    cluster.load(
      others.map((place) => ({
        type: "Feature" as const,
        properties: { place, open: openState(place, clock).isOpen ? 1 : 0 },
        geometry: { type: "Point" as const, coordinates: [place.lng, place.lat] },
      })),
    );
    return cluster;
  }, [places, selectedId, clock]);

  return (
    <>
      {index.getClusters(view.bbox, view.zoom).map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        if ("cluster_id" in feature.properties) {
          const { cluster_id: id, point_count: count, ...tally } = feature.properties;
          return (
            <Marker
              key={`cluster-${id}`}
              position={[lat, lng]}
              title={`${toBnDigits(count)}টি জায়গা — কাছে গিয়ে দেখুন`}
              icon={clusterIcon(topCategory(tally as ClusterTally), count, (tally.open ?? 0) > 0)}
              eventHandlers={{ click: () => map.flyTo([lat, lng], Math.min(index.getClusterExpansionZoom(id), 18)) }}
            />
          );
        }
        const { place } = feature.properties;
        return <PlacePin key={place.id} place={place} selected={false} onSelect={onSelect} />;
      })}
      {selected && <PlacePin place={selected} selected onSelect={onSelect} />}
    </>
  );
}

export default function LeafletMap({ places, me, selectedId, onSelect }: LeafletMapProps) {
  const router = useRouter();
  const select = onSelect ?? ((id: string) => router.push(placePath(id)));
  const points = useMemo(() => {
    const nearest = me ? byDistance(places, me).slice(0, FIT_NEAREST) : places.slice(0, FIT_NEAREST);
    return me ? [...nearest, me] : nearest;
  }, [places, me]);

  return (
    <MapContainer
      center={me ?? APP.defaultLocation}
      zoom={APP.map.zoom}
      zoomControl={false}
      attributionControl={false}
      className="size-full"
    >
      <TileLayer url={APP.map.tileUrl} attribution={APP.map.attribution} />
      <AttributionControl position="bottomleft" prefix={false} />
      <ZoomControl position="bottomright" />
      <ClusteredPins places={places} selectedId={selectedId} onSelect={select} />
      <FitToPoints points={points} />
      <FocusOnMe me={me} />
      {me && <Marker position={me} icon={meIcon} interactive={false} keyboard={false} zIndexOffset={1000} />}
    </MapContainer>
  );
}
