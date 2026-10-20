import { sampleDayStats, samplePageStats } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { DayStat, PageStat } from "@/types/admin";

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
