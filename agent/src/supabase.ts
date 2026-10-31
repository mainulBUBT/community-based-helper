import type { StoredSettings } from "../../workers/lib/models";
import type { ManagerEnv } from "./env";

// নতুন ধরনের key (sb_secret_…) JWT নয়, তাই Authorization এ যায় না
function headers(env: ManagerEnv, bearer?: string): HeadersInit {
  const key = env.SUPABASE_SERVICE_KEY;
  const auth = bearer ?? (key.startsWith("sb_") ? null : key);
  return { apikey: key, ...(auth ? { authorization: `Bearer ${auth}` } : {}) };
}

export async function rest<T>(env: ManagerEnv, path: string): Promise<T> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: headers(env), signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
  return res.json();
}

export async function privateSettings(env: ManagerEnv): Promise<StoredSettings> {
  const rows = await rest<{ value: StoredSettings }[]>(env, "private_settings?select=value&limit=1");
  return rows[0]?.value ?? {};
}

// অ্যাডমিন পাতা থেকে আসা ডাক: লগইন করা ব্যবহারকারী admins এ আছেন কিনা
export async function isAdmin(env: ManagerEnv, token: string): Promise<boolean> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: headers(env, token), signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return false;
  const user = (await res.json()) as { id?: string };
  if (!user.id || !/^[0-9a-f-]{36}$/.test(user.id)) return false;
  return (await rest<unknown[]>(env, `admins?select=user_id&user_id=eq.${user.id}`)).length > 0;
}
