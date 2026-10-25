import { createClient } from "npm:@supabase/supabase-js@2";
import { handle, siteverify } from "./handler.ts";

const env = (name: string, fallback = "") => Deno.env.get(name) ?? fallback;
const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const secret = env("TURNSTILE_SECRET");

Deno.serve((req) =>
  handle(req, {
    verify: (token, ip) => siteverify(secret, token, ip),
    submit: async (payload, ip) => {
      const { error } = await db.rpc("submit_price", { payload, ip });
      return { error: error?.message ?? null };
    },
    hostnames: list(env("TURNSTILE_HOSTNAMES", "dordam.app,www.dordam.app,dordam.pages.dev")),
    origins: list(env("ALLOWED_ORIGINS", "https://dordam.app,https://www.dordam.app,https://dordam.pages.dev")),
  }),
);
