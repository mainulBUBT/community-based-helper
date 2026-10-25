import { hasBackend, supabaseFetch } from "@/lib/supabase-rest";

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

export function trackView(path: string, productId?: string) {
  if (!hasBackend || path.startsWith("/admin")) return;
  const referrer = document.referrer ? new URL(document.referrer).hostname : null;
  void supabaseFetch("/rest/v1/page_views", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify({ visitor: visitorId(), path: path.slice(0, 300), product_id: productId ?? null, referrer }),
    keepalive: true,
  }).catch(() => {});
}
