import type { LatLng } from "./place";

export interface Area extends LatLng {
  name: string;
  en: string | null;
  kind: string;
  near: string | null;
}

export interface AreaHit extends LatLng {
  key: string;
  label: string;
  detail?: string;
}
