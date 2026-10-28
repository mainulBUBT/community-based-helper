import { supabase } from "@/lib/supabase";
import type { UsageStats } from "@/types/admin";

const EMPTY: UsageStats = { dbBytes: 0, viewsToday: 0, alerts: 0, deploysThisMonth: 0, lastJobRun: null, deploy: {} };

export async function loadUsage(): Promise<UsageStats> {
  if (!supabase) return EMPTY;
  const { data, error } = await supabase.rpc("usage_stats");
  if (error) throw error;
  const raw = (data ?? {}) as Partial<UsageStats>;
  return {
    dbBytes: Number(raw.dbBytes ?? 0),
    viewsToday: Number(raw.viewsToday ?? 0),
    alerts: Number(raw.alerts ?? 0),
    deploysThisMonth: Number(raw.deploysThisMonth ?? 0),
    lastJobRun: raw.lastJobRun ?? null,
    deploy: raw.deploy ?? {},
  };
}
