"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const isInternalNavigation = (event: MouseEvent) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = (event.target as Element | null)?.closest("a");
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return false;
  return url.pathname !== location.pathname || url.search !== location.search;
};

const START = "nav-progress:start";

// লিংক ছাড়া কোড থেকে পাতা বদলালে (খোঁজা, পিছনে যাওয়া) বারটা এটা দিয়ে চালু হয়
export function startNavProgress(href?: string) {
  if (href) {
    const url = new URL(href, location.href);
    if (url.pathname === location.pathname && url.search === location.search) return;
  }
  window.dispatchEvent(new Event(START));
}

export function NavProgress() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) setState("loading");
    };
    const onStart = () => setState("loading");
    document.addEventListener("click", onClick, true);
    window.addEventListener(START, onStart);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START, onStart);
    };
  }, []);

  const location = `${pathname}?${params}`;
  const [seen, setSeen] = useState(location);
  if (seen !== location) {
    setSeen(location);
    if (state === "loading") setState("done");
  }

  useEffect(() => {
    if (state !== "done") return;
    const timer = setTimeout(() => setState("idle"), 300);
    return () => clearTimeout(timer);
  }, [state]);

  if (state === "idle") return null;
  return (
    <div role="progressbar" aria-label="loading" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div className={`h-full bg-gold ${state === "loading" ? "animate-[nav-progress_8s_cubic-bezier(.1,.7,.2,1)_forwards]" : "w-full opacity-0 transition-opacity duration-300"}`} />
    </div>
  );
}
