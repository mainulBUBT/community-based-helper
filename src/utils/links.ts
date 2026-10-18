import type { LatLng } from "@/types/place";

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export const directionsUrl = ({ lat, lng }: LatLng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

export const mapUrl = ({ lat, lng }: LatLng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const placePath = (id: string) => `/place/?id=${encodeURIComponent(id)}`;

export const categoryPath = (id: string) => `/category/?c=${encodeURIComponent(id)}`;
