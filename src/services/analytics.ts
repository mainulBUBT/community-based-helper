import { hasBackend } from "@/lib/supabase-rest";

const VISITOR_KEY = "visitor-id";

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

// সরাসরি Supabase এ নয়, সাইটের নিজের Pages Function দিয়ে (functions/api/track.ts): Cloudflare এর rate limit সামনে থাকে
export function trackView(path: string, productId?: string) {
  if (!hasBackend || path.startsWith("/admin")) return;
  const referrer = document.referrer ? new URL(document.referrer).hostname : null;
  void fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ visitor: visitorId(), path: path.slice(0, 300), product_id: productId ?? null, referrer }),
    keepalive: true,
  }).catch(() => {});
}

// পেজ ভিউ নয় এমন ঘটনা (ব্যানারের দেখা-ক্লিক): page_views এ source চিহ্ন দিয়ে যায়, অ্যাডমিন → ভিজিটরে গোনা হয়
export function trackEvent(source: string, path: string) {
  if (!hasBackend || !path.startsWith("/") || path.startsWith("//")) return;
  void fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ visitor: visitorId(), path: path.slice(0, 300), product_id: null, referrer: null, source }),
    keepalive: true,
  }).catch(() => {});
}
