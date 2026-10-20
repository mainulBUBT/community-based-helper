import { supabase } from "@/lib/supabase";

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
  if (!supabase || path.startsWith("/admin")) return;
  void supabase.from("page_views").insert({
    visitor: visitorId(),
    path: path.slice(0, 300),
    product_id: productId ?? null,
    referrer: document.referrer ? new URL(document.referrer).hostname : null,
  });
}
