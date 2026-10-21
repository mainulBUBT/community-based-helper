import { supabase } from "@/lib/supabase";

const DEMO_KEY = "demo-admin";
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ?? "admin@dordam.test";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD ?? "dordam-demo";

export const isDemo = !supabase;

export async function currentAdmin() {
  if (!supabase) return sessionStorage.getItem(DEMO_KEY) ? { email: DEMO_EMAIL } : null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? { email: data.user.email ?? "" } : null;
}

export async function signIn(email: string, password: string, captchaToken?: string) {
  if (!supabase) {
    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) throw new Error("invalid");
    sessionStorage.setItem(DEMO_KEY, "1");
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
  if (error) throw error;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error("not-admin");
  }
}

export async function signOut() {
  sessionStorage.removeItem(DEMO_KEY);
  await supabase?.auth.signOut();
}

export async function sendPasswordReset(email: string, captchaToken?: string) {
  if (!supabase) throw new Error("demo");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/admin/`, captchaToken });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export function onPasswordRecovery(callback: () => void) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") callback();
  });
  return () => data.subscription.unsubscribe();
}
