// সাইটের বেনামি লেখা (ভিজিট, দাম-কমার alert) Supabase এ যায় এই Pages Function দিয়ে: Cloudflare এর DDoS/rate limit সামনে,
// আর DB এই Function এর গোপন header (PROXY_KEY, Vault এ proxy_key) ছাড়া কিছু নেয় না, তাই সরাসরি Supabase এ flood করে লাভ নেই

export interface Env {
  SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  PROXY_KEY?: string;
}

export interface Context {
  request: Request;
  env: Env;
}

const MAX_BODY = 4096;
const hits = new Map<string, { count: number; until: number }>();

// এক isolate এর স্মৃতিতে IP ধরে সীমা: এক IP থেকে ঝড় DB পর্যন্ত যায় না; আসল সীমা Cloudflare এর rate limiting rule
function tooMany(ip: string, limit: number): boolean {
  const now = Date.now();
  if (hits.size > 10_000) hits.clear();
  const slot = hits.get(ip);
  if (!slot || slot.until < now) {
    hits.set(ip, { count: 1, until: now + 60_000 });
    return false;
  }
  return ++slot.count > limit;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try {
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export const str = (value: unknown, max: number): string | null => (typeof value === "string" && value.length <= max ? value : null);

export async function proxy(ctx: Context, limit: number, path: string, body: Record<string, unknown> | null): Promise<Response> {
  const { request, env } = ctx;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const ip = request.headers.get("cf-connecting-ip") ?? "";
  if (ip && tooMany(ip, limit)) return new Response(null, { status: 429 });
  if (!body) return new Response(null, { status: 400 });
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new Response(null, { status: 503 });
  const upstream = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      "content-type": "application/json",
      prefer: "return=minimal",
      "x-proxy-key": env.PROXY_KEY ?? "",
      "x-client-ip": ip,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  // উত্তরের লেখা ফেরত যায় না, শুধু status: ভেতরের error বাইরে আসে না
  return new Response(null, { status: !upstream ? 502 : upstream.ok ? 204 : upstream.status });
}
