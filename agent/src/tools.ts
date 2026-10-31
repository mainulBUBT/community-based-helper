import type { ManagerEnv } from "./env";
import { rest } from "./supabase";

export type Tone = "ok" | "bad" | "wait";
export interface Step {
  call: string;
  result: string;
  tone: Tone;
}

interface Tool {
  description: string;
  parameters: Record<string, unknown>;
  run: (env: ManagerEnv, args: Record<string, unknown>) => Promise<{ data: unknown; result: string; tone: Tone }>;
}

const digits = "০১২৩৪৫৬৭৮৯";
const bn = (value: number) => String(value).replace(/\d/g, (d) => digits[Number(d)]);
const noArgs = { type: "object", properties: {} };

interface JobRow {
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

// PostgREST filter এর ভেতরে বসে, তাই শুধু অক্ষর, সংখ্যা আর ফাঁকা
const words = (query: string) => query.replace(/[^\p{L}\p{N}\s.-]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 4);

// ধাপ ১: সব টুল শুধু পড়ে
export const TOOLS: Record<string, Tool> = {
  jobs_status: {
    description: "সাইটের নিয়মিত কাজগুলোর (দাম আনা, নতুন পণ্য খোঁজা, অফার, সাইট বানানো) অবস্থা: শেষ কখন চলেছে, ফল কী, বন্ধ বা লাইনে আছে কিনা",
    parameters: noArgs,
    async run(env) {
      const jobs = await rest<JobRow[]>(env, "jobs?select=id,name,enabled,schedule,run_requested_at,last_run_at,last_status,last_message&order=id");
      const failed = jobs.filter((job) => job.enabled && job.last_status === "failed").length;
      return { data: jobs, result: `${bn(jobs.length)}টা কাজ · ${bn(failed)}টা ব্যর্থ`, tone: failed ? "bad" : "ok" };
    },
  },
  review_queue: {
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
};

export const toolSpecs = Object.entries(TOOLS).map(([name, tool]) => ({
  type: "function",
  function: { name, description: tool.description, parameters: tool.parameters },
}));
