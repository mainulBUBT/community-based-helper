"use client";

import dynamic from "next/dynamic";

export const PlaceMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-surface" />,
});
