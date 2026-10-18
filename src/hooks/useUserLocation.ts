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
const focusStore = createStore(0);
const focusMap = () => focusStore.set(focusStore.get() + 1);

let askedOnOpen = false;

function locate(silent = false, focus = false) {
  const fail = (message: string) => !silent && showToast(message);
  if (!navigator.geolocation) {
    fail("এই ব্রাউজারে লোকেশন পাওয়া যায় না");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (silent && !locationStore.get().isDefault) return;
      locationStore.set({ lat: coords.latitude, lng: coords.longitude, label: "আপনার অবস্থান", isDefault: false });
      if (focus) focusMap();
    },
    () => fail("লোকেশন পাওয়া যায়নি — অনুমতি দেওয়া আছে কিনা দেখুন"),
    { timeout: 10_000, maximumAge: 300_000 },
  );
}

function chooseLocation({ lat, lng, label }: LatLng & { label: string }) {
  locationStore.set({ lat, lng, label, isDefault: false });
  focusMap();
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
  const showMyLocation = () => {
    focusMap();
    locate(false, true);
  };
  return { location, showMyLocation, chooseLocation };
}

export function useMapFocus() {
  return useSyncExternalStore(focusStore.subscribe, focusStore.get, () => 0);
}
