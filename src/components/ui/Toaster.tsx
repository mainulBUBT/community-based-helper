"use client";

import { useSyncExternalStore } from "react";
import { toastStore } from "@/lib/toast";

export function Toaster() {
  const toast = useSyncExternalStore(toastStore.subscribe, toastStore.get, () => null);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8">
      {toast && (
        <p key={toast.id} className="animate-toast-in rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-page shadow-lg">
          {toast.text}
        </p>
      )}
    </div>
  );
}
