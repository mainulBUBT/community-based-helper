// Deno আর Node দুই জায়গাতেই চলে (শুধু web API), তাই index.ts ছাড়া এটা লোকালে টেস্ট করা যায়

export interface Verdict {
  success: boolean;
  hostname?: string;
  action?: string;
}

export interface Deps {
  verify: (token: string, ip: string | null) => Promise<Verdict>;
  submit: (payload: Record<string, string>, ip: string | null) => Promise<{ error: string | null }>;
  hostnames: string[];
  origins: string[];
}

const ACTION = "submit-price";
const LIMITS: Record<string, number> = { product: 120, price: 12, seller: 120, phone: 20, link: 500, productId: 64, variantId: 64, from: 20 };
const REQUIRED = ["product", "price", "seller"];
const PRICE = /^[0-9০-৯,]{3,12}$/;
const PHONE = /^[+0-9০-৯ -]{6,20}$/;

function cors(origin: string | null, origins: string[]): Record<string, string> {
  if (!origin || !origins.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "origin",
  };
}

export function clean(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const payload: Record<string, string> = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = (input as Record<string, unknown>)[key];
    if (value == null || value === "") continue;
    if (typeof value !== "string" || value.length > max) return null;
    payload[key] = value.trim();
  }
  if (REQUIRED.some((key) => !payload[key])) return null;
  if (!PRICE.test(payload.price)) return null;
  if (payload.phone && !PHONE.test(payload.phone)) return null;
  if (payload.link && !/^https?:\/\/\S+$/i.test(payload.link)) return null;
  return payload;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const headers = cors(req.headers.get("origin"), deps.origins);
  const reply = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply(405, { error: "method" });

  const body = (await req.json().catch(() => null)) as { payload?: unknown; token?: unknown } | null;
  const payload = clean(body?.payload);
  if (!payload) return reply(400, { error: "invalid" });
  if (typeof body?.token !== "string" || !body.token) return reply(403, { error: "captcha" });

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  const verdict = await deps.verify(body.token, ip).catch((): Verdict => ({ success: false }));
  const host = verdict.hostname ?? "";
  if (!verdict.success || (verdict.action && verdict.action !== ACTION) || !deps.hostnames.includes(host)) return reply(403, { error: "captcha" });

  const { error } = await deps.submit(payload, ip);
  if (error) return reply(/too many/i.test(error) ? 429 : 500, { error: /too many/i.test(error) ? "limit" : "failed" });
  return reply(200, { ok: true });
}

export async function siteverify(secret: string, token: string, ip: string | null): Promise<Verdict> {
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form, signal: AbortSignal.timeout(10_000) });
  return (await res.json()) as Verdict;
}
