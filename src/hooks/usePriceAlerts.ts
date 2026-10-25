"use client";

import { useEffect, useSyncExternalStore } from "react";
import { alertStore, readAlertState, type AlertState } from "@/services/price-alerts";

export function usePriceAlerts(): AlertState {
  useEffect(() => alertStore.set(readAlertState()), []);
  return useSyncExternalStore(alertStore.subscribe, alertStore.get, () => "unsupported");
}
