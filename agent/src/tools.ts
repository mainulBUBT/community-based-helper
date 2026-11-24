import type { ManagerEnv } from "./env";
import { patch, privateSettings, rest, rpc } from "./supabase";
import { sendMessage } from "./telegram";

export type Tone = "ok" | "bad" | "wait";
export interface Step {
  call: string;
  result: string;
  tone: Tone;
}

interface Tool {
  access: "read" | "owner" | "auto";
  description: string;
  parameters: Record<string, unknown>;
  run: (env: ManagerEnv, args: Record<string, unknown>) => Promise<{ data: unknown; result: string; tone: Tone }>;
}

const digits = "০১২৩৪৫৬৭৮৯";
export const bn = (value: number) => String(value).replace(/\d/g, (d) => digits[Number(d)]);
const noArgs = { type: "object", properties: {} };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textArg(args: Record<string, unknown>, key: string, maxLength: number): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) throw new Error(`${key} is required and must be at most ${maxLength} characters`);
  return value.trim();
}

function onlyKeys(args: Record<string, unknown>, allowed: string[]): void {
  const unexpected = Object.keys(args).find((key) => !allowed.includes(key));
  if (unexpected) throw new Error(`Unexpected argument: ${unexpected}`);
}

function productVariants(value: unknown): { label: string; attributes: Record<string, string> }[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new Error("Provide between 1 and 20 variants");
  return value.map((item) => {
    if (!record(item) || Object.keys(item).some((key) => key !== "label" && key !== "attributes")) throw new Error("Variant fields must be limited to label and attributes");
    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!label || label.length > 100) throw new Error("Variant label is required and must be at most 100 characters");
    const raw = item.attributes ?? {};
    if (!record(raw)) throw new Error("Variant attributes must be an object");
    const attributes: Record<string, string> = {};
    for (const [key, entry] of Object.entries(raw)) {
      if (typeof entry !== "string") throw new Error("Variant attributes must be strings");
      attributes[key] = entry;
    }
    return { label, attributes };
  });
}

function evidenceUrls(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) throw new Error("Provide 2 to 6 seller product-page URLs");
  return value.map((entry) => {
    if (typeof entry !== "string") throw new Error("Evidence URLs must be strings");
    const url = new URL(entry);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Evidence URLs must use HTTP or HTTPS");
    return url.toString();
  });
}

export interface JobRow {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  run_requested_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_message: string | null;
}

interface ProductRow {
  slug: string;
  brand: string;
  name: string;
  variants: { label: string; offers: { price: number; in_stock: boolean | null; published: boolean; sellers: { name: string } | null }[] }[];
}

interface WeakRow {
  slug: string;
  name: string;
  category: string;
  release_year: number | null;
  in_stock: number;
  sellers: number;
  last_checked: string | null;
  views: number;
}

interface AddedProductRow {
  product_id: string;
  slug: string;
  variants_created: number;
}

interface PublishedProductRow {
  product_id: string;
  slug: string;
  name: string;
}

const OLD_YEARS = 3;
const STALE_DAYS = 7;

// PostgREST filter এর ভেতরে বসে, তাই শুধু অক্ষর, সংখ্যা আর ফাঁকা
const words = (query: string) => query.replace(/[^\p{L}\p{N}\s.-]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 4);

// Scheduled reports get read-only tools; product mutations use bounded database RPCs.
export const RUNNABLE = ["prices", "discover", "promos", "rebuild"];

// GitHub সময় শেষে মেরে ফেললে "running" থেকে যায়; workers/jobs/run.ts-ও ২ ঘণ্টা পরে সেটাকে মৃত ধরে
const STUCK_AFTER = 2 * 3_600_000;

export async function queueJob(env: ManagerEnv, id: string): Promise<{ queued: boolean; name?: string }> {
  const [job] = await rest<Pick<JobRow, "name" | "run_requested_at" | "last_run_at" | "last_status">[]>(env, `jobs?select=name,run_requested_at,last_run_at,last_status&id=eq.${id}`);
  if (!job) return { queued: false };
  const waiting = job.run_requested_at && (!job.last_run_at || job.run_requested_at > job.last_run_at);
  const running = job.last_status === "running" && job.last_run_at && Date.now() - Date.parse(job.last_run_at) < STUCK_AFTER;
  if (running || waiting) return { queued: false, name: job.name };
  await patch(env, `jobs?id=eq.${id}`, { run_requested_at: new Date().toISOString() });
  return { queued: true, name: job.name };
}

export const TOOLS: Record<string, Tool> = {
  jobs_status: {
    access: "read",
    description: "সাইটের নিয়মিত কাজগুলোর (দাম আনা, নতুন পণ্য খোঁজা, অফার, সাইট বানানো) অবস্থা: শেষ কখন চলেছে, ফল কী, বন্ধ বা লাইনে আছে কিনা",
    parameters: noArgs,
    async run(env) {
      const jobs = await rest<JobRow[]>(env, "jobs?select=id,name,enabled,schedule,run_requested_at,last_run_at,last_status,last_message&order=id");
      const failed = jobs.filter((job) => job.enabled && job.last_status === "failed").length;
      return { data: jobs, result: `${bn(jobs.length)}টা কাজ · ${bn(failed)}টা ব্যর্থ`, tone: failed ? "bad" : "ok" };
    },
  },
  review_queue: {
    access: "read",
    description: "যাচাই বাকির তালিকা: কোন ধরনের কয়টা (match, anomaly, submission), আর সবচেয়ে পুরনো কয়েকটা",
    parameters: noArgs,
    async run(env) {
      const rows = await rest<{ kind: string; payload: Record<string, unknown>; created_at: string }[]>(env, "review_queue?select=kind,payload,created_at&status=eq.pending&order=created_at&limit=200");
      const byKind = Object.fromEntries([...new Set(rows.map((r) => r.kind))].map((kind) => [kind, rows.filter((r) => r.kind === kind).length]));
      const oldest = rows.slice(0, 5).map(({ payload, ...row }) => ({ ...row, payload: Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "phone")) }));
      return { data: { pending: rows.length, byKind, oldest }, result: `${bn(rows.length)}টা যাচাই বাকি`, tone: rows.length ? "wait" : "ok" };
    },
  },
  find_price: {
    access: "read",
    description: "কোনো পণ্যের দাম খোঁজা: কোন দোকানে কত, সবচেয়ে সস্তা কোনটা",
    parameters: { type: "object", properties: { query: { type: "string", description: "পণ্যের নাম, যেমন Samsung A57" } }, required: ["query"] },
    async run(env, args) {
      const terms = words(String(args.query ?? ""));
      if (!terms.length) return { data: [], result: "কী খুঁজব বোঝা যায়নি", tone: "bad" };
      const filter = terms.map((w) => `or(name.ilike.*${w}*,brand.ilike.*${w}*)`).join(",");
      const products = await rest<ProductRow[]>(
        env,
        `products?select=slug,brand,name,variants(label,offers(price,in_stock,published,sellers(name)))&and=(${encodeURIComponent(filter)})&order=popularity.desc&limit=5`,
      );
      const data = products.map((p) => ({
        name: `${p.brand} ${p.name}`,
        link: `https://dordam.app/product/${p.slug}/`,
        cheapest: p.variants
          .flatMap((v) => v.offers.filter((o) => o.published).map((o) => ({ variant: v.label, seller: o.sellers?.name, price: o.price, inStock: o.in_stock })))
          .sort((a, b) => a.price - b.price)
          .slice(0, 5),
      }));
      return { data, result: `${bn(data.length)}টা পণ্য পেয়েছি`, tone: data.length ? "ok" : "wait" };
    },
  },
  visitor_searches: {
    access: "read",
    description: "ভিজিটররা সাইটে কী খুঁজেছে (বেশি থেকে কম)",
    parameters: { type: "object", properties: { days: { type: "number", description: "কত দিনের, ১ থেকে ৩০" } } },
    async run(env, args) {
      const days = Math.min(30, Math.max(1, Number(args.days) || 7));
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const rows = await rest<{ path: string; visitor: string }[]>(env, `page_views?select=path,visitor&created_at=gte.${since}&path=like.*q=*&order=created_at.desc&limit=1000`);
      const counts = new Map<string, Set<string>>();
      for (const row of rows) {
        const raw = /^(?:\/en)?\/(?:search|category\/[^/]+)\/\?(?:.*&)?q=([^&]+)/.exec(row.path)?.[1];
        if (!raw) continue;
        let query = raw;
        try {
          query = decodeURIComponent(raw.replace(/\+/g, " ")).trim().toLowerCase();
        } catch {}
        counts.set(query, (counts.get(query) ?? new Set()).add(row.visitor));
      }
      const top = [...counts].map(([query, visitors]) => ({ query, visitors: visitors.size })).sort((a, b) => b.visitors - a.visitors).slice(0, 15);
      return { data: { days, top }, result: `${bn(counts.size)}টা আলাদা খোঁজ`, tone: "ok" };
    },
  },
  weak_products: {
    access: "read",
    description:
      "যে পণ্য সাইটে রাখার মানে কম, কারণসহ: স্টকসহ দাম ২টার কম দোকানে (নিয়ম ভাঙে), দাম ৭ দিনের বেশি যাচাই হয়নি, গত ৩০ দিনে কেউ খোলেনি, ৩ বছরের বেশি পুরনো মডেল। মালিককে লুকানো বা বাদের পরামর্শ দিতে",
    parameters: noArgs,
    async run(env) {
      const rows = await rpc<WeakRow[]>(env, "weak_products");
      const year = new Date().getFullYear();
      const stale = Date.now() - STALE_DAYS * 86_400_000;
      const items = rows.map((r) => ({
        name: r.name,
        category: r.category,
        link: `https://dordam.app/product/${r.slug}/`,
        reasons: [
          r.in_stock < 2 && `স্টকসহ দোকান ${bn(r.in_stock)}টা (মোট দামসহ ${bn(r.sellers)}টা)`,
          r.last_checked && Date.parse(r.last_checked) < stale && "দাম ৭ দিনের বেশি যাচাই হয়নি",
          r.views === 0 && "৩০ দিনে কেউ খোলেনি",
          r.release_year && r.release_year <= year - OLD_YEARS && `${bn(r.release_year)} সালের মডেল`,
        ].filter(Boolean),
      }));
      const breaksRule = rows.filter((r) => r.in_stock < 2).length;
      return {
        data: { total: items.length, breaksRule, items: items.slice(0, 40) },
        result: `${bn(items.length)}টা দুর্বল পণ্য · ${bn(breaksRule)}টা নিয়ম ভাঙে`,
        tone: breaksRule ? "bad" : items.length ? "wait" : "ok",
      };
    },
  },
  my_actions: {
    access: "read",
    description: "গত ৩ দিনে তুমি নিজে কী করেছ: কোন পণ্যে কোন ভার্সন যোগ করেছ (প্রমাণের লিংকসহ), আর কোন আইটেম নিজে মেটাতে না পেরে যাচাই বাকিতে রেখেছ (সকালের রিপোর্টে বলার জন্য)",
    parameters: noArgs,
    async run(env) {
      const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
      const rows = await rest<{ action: string; detail: unknown; created_at: string }[]>(env, `audit_log?select=action,detail,created_at&action=like.agent.*&created_at=gte.${since}&order=created_at.desc&limit=30`);
      const added = rows.filter((r) => r.action === "agent.variant").length;
      return { data: rows, result: `${bn(added)}টা ভার্সন যোগ · ${bn(rows.length - added)}টা অন্য খবর`, tone: "ok" };
    },
  },
  add_hidden_product: {
    access: "owner",
    description:
      "মালিক স্পষ্টভাবে নতুন পণ্য যোগ করতে বললে লুকানো পণ্য ও তার variants যোগ করা। brand, name, active category, প্রমাণিত variant label/attributes, কারণ, এবং অন্তত ২টি আলাদা active seller-এর product-page URL লাগবে। কোনো দাম বা SKU লেখে না; সফল হলে discover job queue হয়। তথ্য বা প্রমাণ অসম্পূর্ণ হলে আগে মালিককে জিজ্ঞেস করো।",
    parameters: {
      type: "object",
      properties: {
        brand: { type: "string", maxLength: 80 },
        name: { type: "string", maxLength: 120 },
        category: { type: "string" },
        release_year: { type: "integer" },
        variants: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object",
            properties: {
              label: { type: "string", maxLength: 100 },
              attributes: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["label", "attributes"],
            additionalProperties: false,
          },
        },
        reason: { type: "string", maxLength: 400 },
        evidence_urls: { type: "array", minItems: 2, maxItems: 6, items: { type: "string", format: "uri" } },
      },
      required: ["brand", "name", "category", "variants", "reason", "evidence_urls"],
      additionalProperties: false,
    },
    async run(env, args) {
      onlyKeys(args, ["brand", "name", "category", "release_year", "variants", "reason", "evidence_urls"]);
      let releaseYear: number | null = null;
      if (args.release_year !== undefined && args.release_year !== null) {
        if (typeof args.release_year !== "number") throw new Error("release_year must be an integer");
        releaseYear = args.release_year;
      }
      if (releaseYear !== null && (!Number.isInteger(releaseYear) || releaseYear < 1990 || releaseYear > new Date().getFullYear() + 1)) {
        throw new Error("release_year is outside the allowed range");
      }
      const rows = await rpc<AddedProductRow[]>(env, "agent_add_hidden_product", {
        p_brand: textArg(args, "brand", 80),
        p_name: textArg(args, "name", 120),
        p_category: textArg(args, "category", 80),
        p_release_year: releaseYear,
        p_variants: productVariants(args.variants),
        p_reason: textArg(args, "reason", 400),
        p_evidence_urls: evidenceUrls(args.evidence_urls),
      });
      const product = rows[0];
      if (!product) throw new Error("Product creation returned no result");
      return {
        data: product,
        result: `পণ্য ${product.slug} লুকিয়ে যোগ হয়েছে; discover লাইনে দেওয়া হয়েছে`,
        tone: "ok",
      };
    },
  },
  publish_ready_candidates: {
    access: "auto",
    description:
      "শুধু Manager-এর নিজের hidden candidate, যেগুলো database-এর সব hard gate পাস করেছে সেগুলো চালু করা: প্রতিটি variant-এ ২+ active seller-এর আসল বর্তমান দাম, price ratio সর্বোচ্চ ১.৮, ছবি আছে, discover শেষ, pending review নেই, duplicate নেই, active category আছে; ঢাকার দিনে সর্বোচ্চ ৫টি। অন্য product বদলায় না।",
    parameters: noArgs,
    async run(env, args) {
      onlyKeys(args, []);
      const rows = await rpc<PublishedProductRow[]>(env, "agent_publish_ready_candidates");
      return {
        data: { published: rows },
        result: rows.length ? `${bn(rows.length)}টা যাচাই-পাস পণ্য চালু: ${rows.map((row) => row.name).join(", ")}` : "এখন চালু করার মতো যাচাই-পাস পণ্য নেই",
        tone: rows.length ? "ok" : "wait",
      };
    },
  },
  run_job: {
    access: "owner",
    description:
      "একটা নিয়মিত কাজ এখনই চালাতে লাইনে দেওয়া (অ্যাডমিনের \"এখনই চালান\"-এর মতো), শুধু মালিক চাইলে। prices: দাম আনা (শেষে যাচাই বাকি থেকে AI নিজে নিশ্চিতগুলো সিদ্ধান্ত নেয়, প্রতিবার সর্বোচ্চ ৩০টা), discover: নতুন পণ্য খোঁজা, promos: অফার পড়া, rebuild: সাইট বানানো। যাচাই বাকি সরাসরি অনুমোদন বা বাদ করার টুল নেই",
    parameters: { type: "object", properties: { job: { type: "string", enum: RUNNABLE } }, required: ["job"] },
    async run(env, args) {
      const id = String(args.job ?? "");
      if (!RUNNABLE.includes(id)) return { data: { queued: false }, result: "এই কাজ চালানো যায় না", tone: "bad" };
      const { queued, name } = await queueJob(env, id);
      if (!name) return { data: { queued: false }, result: "কাজটা পাওয়া যায়নি", tone: "bad" };
      if (!queued) return { data: { queued: false, reason: "already running or queued" }, result: `${name} আগেই চলছে বা লাইনে আছে`, tone: "wait" };
      return { data: { queued: true }, result: `${name} লাইনে দেওয়া হয়েছে`, tone: "ok" };
    },
  },
  send_telegram: {
    access: "owner",
    description: "মালিকের Telegram-এ মেসেজ পাঠানো। শুধু মালিক চাইলে, যেমন \"রিপোর্টটা Telegram-এ দাও\"",
    parameters: { type: "object", properties: { text: { type: "string", description: "যা পাঠাবে" } }, required: ["text"] },
    async run(env, args) {
      const { telegramBotToken: token, alertChatId: chat } = await privateSettings(env);
      const text = String(args.text ?? "").trim();
      if (!token || !chat || !text) return { data: { sent: false }, result: "Telegram সেট করা নেই", tone: "bad" };
      const status = await sendMessage(token, chat, text);
      return { data: { sent: status === 200, status }, result: status === 200 ? "Telegram-এ পাঠানো হয়েছে" : `Telegram HTTP ${bn(status)}`, tone: status === 200 ? "ok" : "bad" };
    },
  },
};

export const toolSpecs = (ownerActions = true) =>
  Object.entries(TOOLS)
    .filter(([, tool]) => ownerActions || tool.access === "read")
    .map(([name, tool]) => ({
      type: "function",
      function: { name, description: tool.description, parameters: tool.parameters },
    }));
