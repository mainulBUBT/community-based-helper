import { sampleDayStats, samplePageStats } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { Breakdown, DashboardCounts, DayStat, OnlineVisitor, PageStat, VisitorInsights } from "@/types/admin";
import { listSummaries } from "../catalog-live";
import { listPendingReview } from "./review";
import { listAllSellers } from "./sellers";

export async function loadDashboardCounts(): Promise<DashboardCounts> {
  if (!supabase) {
    const [review, sellers, summaries] = await Promise.all([listPendingReview(), listAllSellers(), listSummaries(true)]);
    const products = summaries.map((s) => s.product);
    const oldYear = new Date().getFullYear() - 3;
    return {
      review: review.length,
      noPrice: summaries.filter((s) => s.sellerCount === 0).length,
      noImage: products.filter((p) => !p.images?.length).length,
      noSpecs: products.filter((p) => !p.specs?.length).length,
      unverified: sellers.filter((s) => !s.verified).length,
      oldModels: products.filter((p) => p.active !== false && p.releaseYear && p.releaseYear <= oldYear).length,
    };
  }
  const { data, error } = await supabase.rpc("dashboard_counts").single<{ review: number; no_price: number; no_image: number; no_specs: number; unverified: number; old_models: number }>();
  if (error) throw error;
  return { review: data.review, noPrice: data.no_price, noImage: data.no_image, noSpecs: data.no_specs, unverified: data.unverified, oldModels: data.old_models };
}

export async function loadDayStats(days = 30): Promise<DayStat[]> {
  if (!supabase) return sampleDayStats;
  const { data, error } = await supabase.rpc("visitor_stats", { days });
  if (error) throw error;
  return (data as { day: string; views: number; visitors: number }[]).map((row) => ({
    day: row.day,
    views: Number(row.views),
    visitors: Number(row.visitors),
  }));
}

export async function loadTopPages(days = 30): Promise<PageStat[]> {
  if (!supabase) return samplePageStats;
  const { data, error } = await supabase.rpc("top_pages", { days, max_rows: 20 });
  if (error) throw error;
  return (data as { path: string; views: number; visitors: number }[]).map((row) => ({
    path: row.path,
    views: Number(row.views),
    visitors: Number(row.visitors),
  }));
}

export async function loadOnline(): Promise<OnlineVisitor[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("visitors_online");
  if (error) throw error;
  return (data as { path: string; product: string | null; country: string | null; device: string | null; seen_at: string }[]).map((row) => ({
    path: row.path,
    product: row.product,
    country: row.country,
    device: row.device,
    seenAt: row.seen_at,
  }));
}

type Row = Record<string, unknown>;

const breakdown = (rows: unknown, key: string): Breakdown[] =>
  ((rows as Row[] | null) ?? []).map((row) => ({ key: (row[key] as string | null) ?? null, views: Number(row.views ?? row.times ?? 0), visitors: Number(row.visitors ?? 0) }));

const EMPTY: VisitorInsights = { visitors: 0, returning: 0, countries: [], devices: [], referrers: [], products: [], searches: [] };

// শুধু পেজ খুললে হিসাব হয়, সর্বোচ্চ ৯০ দিনের
export async function loadInsights(days = 30): Promise<VisitorInsights> {
  if (!supabase) return EMPTY;
  const { data, error } = await supabase.rpc("visitor_insights", { days });
  if (error) throw error;
  const raw = (data ?? {}) as Row;
  return {
    visitors: Number(raw.visitors ?? 0),
    returning: Number(raw.returning ?? 0),
    countries: breakdown(raw.countries, "country"),
    devices: breakdown(raw.devices, "device"),
    referrers: breakdown(raw.referrers, "referrer"),
    products: ((raw.products as Row[] | null) ?? []).map((row) => ({ key: String(row.name), slug: String(row.slug), views: Number(row.views), visitors: Number(row.visitors) })),
    searches: breakdown(raw.searches, "query").map((s) => ({ ...s, key: s.key ? safeDecode(s.key) : s.key })),
  };
}

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
};
