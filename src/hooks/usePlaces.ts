"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPlaces } from "@/services/places";
import type { Place } from "@/types/place";
import { buildTree } from "@/utils/place-tree";

interface PlacesState {
  places: Place[];
  loading: boolean;
  error: string | null;
}

let cached: Place[] | null = null;
let request: Promise<Place[]> | null = null;

function loadPlaces() {
  request ??= fetchPlaces().then(
    (places) => (cached = places),
    (error) => {
      request = null;
      throw error;
    },
  );
  return request;
}

const initialState = (): PlacesState =>
  cached ? { places: cached, loading: false, error: null } : { places: [], loading: true, error: null };

export function usePlaces() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!state.loading) return;
    let active = true;
    loadPlaces().then(
      (places) => active && setState({ places, loading: false, error: null }),
      () => active && setState({ places: [], loading: false, error: "তথ্য আনা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।" }),
    );
    return () => {
      active = false;
    };
  }, [state.loading]);

  const tree = useMemo(() => buildTree(state.places), [state.places]);
  return { ...state, tree };
}
