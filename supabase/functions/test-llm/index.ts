import { createClient } from "npm:@supabase/supabase-js@2";

// অ্যাডমিনের "পরীক্ষা": AI কে ব্রাউজার থেকে নয়, এখান থেকে ডাকা হয়।
// সেভ করা key ব্রাউজারে ফেরে না, আর অনেক OpenAI-compatible সার্ভিস ব্রাউজারকে CORS দেয় না।

const env = (name: string, fallback = "") => Deno.env.get(name) ?? fallback;
const origins = env("ALLOWED_ORIGINS", "https://dordam.app,https://www.dordam.app,https://dordam.pages.dev")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const providerKey = (url: string) => url.trim().replace(/\/+$/, "");
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> =
    origin && origins.includes(origin)
      ? {
          "access-control-allow-origin": origin,
          "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
          "access-control-allow-methods": "POST, OPTIONS",
          vary: "origin",
        }
      : {};
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply(405, { error: "method" });

  const caller = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { authorization: req.headers.get("authorization") ?? "" } },
    auth: { persistSession: false },
  });
  const { data: admin } = await caller.rpc("is_admin");
  if (admin !== true) return reply(403, { error: "admin only" });

  const body = await req.json().catch(() => null);
  const baseUrl = providerKey(text(body?.baseUrl));
  const model = text(body?.model);
  if (!/^https:\/\//i.test(baseUrl) || !model) return reply(400, { error: "Base URL আর model লাগবে" });

  let apiKey = text(body?.apiKey);
  if (!apiKey) {
    const { data } = await db.from("private_settings").select("value").maybeSingle();
    apiKey = text(data?.value?.llmKeys?.[baseUrl]);
  }
  if (!apiKey) return reply(200, { error: "এই প্রোভাইডারের key সেভ নেই" });

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with: ok" }] }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return reply(200, { error: `${res.status} ${await res.text()}`.slice(0, 300) });
    const answer = await res.json();
    return reply(200, { reply: String(answer?.choices?.[0]?.message?.content ?? "").trim() });
  } catch (error) {
    return reply(200, { error: String(error).slice(0, 300) });
  }
});
