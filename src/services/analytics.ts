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
