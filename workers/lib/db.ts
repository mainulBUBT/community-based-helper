import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  client ??= createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export async function must<T>(query: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw error instanceof Error ? error : new Error(JSON.stringify(error));
  return data;
}

// Supabase একবারে ১০০০ সারির বেশি দেয় না
export async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>, size = 1000): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const batch = ((await must(page(from, from + size - 1))) ?? []) as T[];
    rows.push(...batch);
    if (batch.length < size) return rows;
  }
}
