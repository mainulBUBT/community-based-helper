"use client";

import { useSyncExternalStore } from "react";
import { toastStore } from "@/lib/toast";

export function Toaster() {
  const message = useSyncExternalStore(toastStore.subscribe, toastStore.get, () => "");
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-20 z-[1100] flex justify-center lg:bottom-6">
      {message && (
        <span key={message} className="animate-toast-in rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-page shadow-lg">
          {message}
        </span>
      )}
    </div>
  );
}
