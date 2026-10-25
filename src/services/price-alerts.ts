import { createStore } from "@/lib/create-store";
import type { Lang } from "@/lib/preferences";
import { hasBackend, supabaseFetch } from "@/lib/supabase-rest";

export type AlertState = "unsupported" | "install" | "blocked" | "off" | "on";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const FLAG_KEY = "price-alerts";

export const alertStore = createStore<AlertState>("unsupported");

function flag(next?: boolean): boolean {
  try {
    if (next !== undefined) {
      if (next) localStorage.setItem(FLAG_KEY, "on");
      else localStorage.removeItem(FLAG_KEY);
    }
    return localStorage.getItem(FLAG_KEY) === "on";
  } catch {
    return false;
  }
}

// iPhone এ push শুধু Home Screen এ যোগ করা সাইটে চলে
const needsInstall = () =>
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
  !matchMedia("(display-mode: standalone)").matches;

export function readAlertState(): AlertState {
  if (!hasBackend || !VAPID_KEY || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return "unsupported";
  if (!("PushManager" in window) || !("Notification" in window)) return needsInstall() ? "install" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  return Notification.permission === "granted" && flag() ? "on" : "off";
}

const keyBytes = (base64url: string) => {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64url.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
};

async function subscription(create: boolean) {
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return null;
  const current = await registration.pushManager.getSubscription();
  if (current || !create) return current;
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_KEY!) });
}

async function rpc(name: string, body: Record<string, unknown>) {
  const response = await supabaseFetch(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
}

function watch(sub: PushSubscription, slugs: string[], lang: Lang) {
  const { endpoint, keys } = sub.toJSON();
  return rpc("watch_prices", { p_endpoint: endpoint, p_p256dh: keys?.p256dh, p_auth: keys?.auth, p_slugs: slugs.slice(0, 100), p_lang: lang });
}

export async function enableAlerts(slugs: string[], lang: Lang) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alertStore.set(permission === "denied" ? "blocked" : "off");
    return;
  }
  const sub = await subscription(true);
  if (!sub) throw new Error("no service worker");
  await watch(sub, slugs, lang);
  flag(true);
  alertStore.set("on");
}

export async function disableAlerts() {
  const sub = await subscription(false);
  if (sub) {
    await rpc("unwatch_prices", { p_endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
  flag(false);
  alertStore.set(readAlertState());
}

// চালু থাকলে নতুন সেভ করা পণ্যও দেখা হয়, সরালে বাদ
export async function syncAlert(slug: string, saved: boolean, lang: Lang) {
  if (readAlertState() !== "on") return;
  const sub = await subscription(false);
  if (!sub) return;
  if (saved) await watch(sub, [slug], lang);
  else await rpc("unwatch_prices", { p_endpoint: sub.endpoint, p_slugs: [slug] });
}
