"use client";

import { useEffect, useSyncExternalStore } from "react";
import { APP } from "@/config/app";
import { createStore } from "@/lib/create-store";
import { showToast } from "@/lib/toast";
import type { LatLng } from "@/types/place";

export interface UserLocation extends LatLng {
  label: string;
  isDefault: boolean;
}

const DEFAULT_LOCATION: UserLocation = { ...APP.defaultLocation, isDefault: true };
const locationStore = createStore(DEFAULT_LOCATION);

let askedOnOpen = false;

function locate(silent = false) {
  const fail = (message: string) => !silent && showToast(message);
  if (!navigator.geolocation) {
    fail("এই ব্রাউজারে লোকেশন পাওয়া যায় না");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) =>
      locationStore.set({ lat: coords.latitude, lng: coords.longitude, label: "আপনার অবস্থান", isDefault: false }),
    () => fail("লোকেশন পাওয়া যায়নি — অনুমতি দেওয়া আছে কিনা দেখুন"),
    { timeout: 10_000, maximumAge: 300_000 },
  );
}

export function useLocateOnOpen() {
  useEffect(() => {
    if (askedOnOpen) return;
    askedOnOpen = true;
    locate(true);
  }, []);
}

export function useUserLocation() {
  const location = useSyncExternalStore(locationStore.subscribe, locationStore.get, () => DEFAULT_LOCATION);
  return { location, locate: () => locate() };
}
