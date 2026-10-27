import { createStore } from "@/lib/create-store";
import type { Lang } from "@/lib/preferences";
import { hasBackend } from "@/lib/supabase-rest";

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

// কেন চালু হলো না: "server" মানে সাইটের /api/alerts বন্ধ (Pages এ Supabase সেটিং নেই বা DB সাড়া দিচ্ছে না)
export class AlertError extends Error {
  constructor(readonly reason: "server" | "worker" | "failed") {
    super(reason);
  }
}

// পাতা খোলার পরপরই চাপলে service worker তখনো বসেনি; বসা পর্যন্ত একটু অপেক্ষা, তারপরও না পেলে register করে নেওয়া
async function registration(create: boolean) {
  const current = await navigator.serviceWorker.getRegistration("/");
  if (current || !create) return current ?? null;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));
  navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function subscription(create: boolean) {
  const worker = await registration(create);
  if (!worker) return null;
  const current = await worker.pushManager.getSubscription();
  if (current || !create) return current;
  return worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_KEY!) });
}

// সাইটের নিজের Pages Function (functions/api/alerts.ts) দিয়ে DB র watch_prices / unwatch_prices এ যায়
async function rpc(action: "watch" | "unwatch", body: Record<string, unknown>) {
  const response = await fetch("/api/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...body }) });
  if (!response.ok) throw new AlertError(response.status === 503 || response.status === 502 ? "server" : "failed");
}

function watch(sub: PushSubscription, slugs: string[], lang: Lang) {
  const { endpoint, keys } = sub.toJSON();
  return rpc("watch", { endpoint, p256dh: keys?.p256dh, auth: keys?.auth, slugs: slugs.slice(0, 100), lang });
}

export async function enableAlerts(slugs: string[], lang: Lang) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alertStore.set(permission === "denied" ? "blocked" : "off");
    return;
  }
  const sub = await subscription(true);
  if (!sub) throw new AlertError("worker");
  await watch(sub, slugs, lang);
  flag(true);
  alertStore.set("on");
}

export async function disableAlerts() {
  const sub = await subscription(false);
  if (sub) {
    await rpc("unwatch", { endpoint: sub.endpoint });
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
  else await rpc("unwatch", { endpoint: sub.endpoint, slugs: [slug] });
}
