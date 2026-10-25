import webpush, { type PushSubscription } from "web-push";
import { db, must } from "../lib/db";
import { bn } from "../lib/bn";
import { groupBy, pool } from "../lib/pool";
import { count } from "../jobs/summary";

export interface DueAlert {
  endpoint: string;
  p256dh: string;
  auth: string;
  lang: "bn" | "en";
  product_id: string;
  slug: string;
  name: string;
  old_price: number;
  new_price: number;
}

export interface PushMessage {
  subscription: PushSubscription;
  rows: DueAlert[];
  payload: { title: string; body: string; url: string; tag: string };
}

const taka = (amount: number, lang: "bn" | "en") => `৳${lang === "bn" ? bn(amount.toLocaleString("en-IN")) : amount.toLocaleString("en-IN")}`;

// এক ব্রাউজারে একসাথে কয়েকটার দাম কমলে একটাই নোটিফিকেশন, সেভ করা পাতায় নিয়ে যায়
export function buildMessages(rows: DueAlert[]): PushMessage[] {
  return [...groupBy(rows, (row) => row.endpoint).values()].map((list) => {
    const [first] = list;
    const { lang } = first;
    const prefix = lang === "en" ? "/en" : "";
    const single = list.length === 1;
    const title = single
      ? lang === "en"
        ? `${first.name} price dropped`
        : `${first.name} এর দাম কমেছে`
      : lang === "en"
        ? `${list.length} saved products got cheaper`
        : `সেভ করা ${bn(list.length)}টা পণ্যের দাম কমেছে`;
    const body = single
      ? lang === "en"
        ? `Now ${taka(first.new_price, lang)}, was ${taka(first.old_price, lang)}`
        : `এখন ${taka(first.new_price, lang)}, আগে ছিল ${taka(first.old_price, lang)}`
      : list
          .slice(0, 3)
          .map((row) => `${row.name}: ${taka(row.new_price, lang)}`)
          .join(", ");
    return {
      subscription: { endpoint: first.endpoint, keys: { p256dh: first.p256dh, auth: first.auth } },
      rows: list,
      payload: { title, body, url: single ? `${prefix}/product/${first.slug}/` : `${prefix}/saved/`, tag: "price-drop" },
    };
  });
}

type Send = (subscription: PushSubscription, payload: string) => Promise<unknown>;

// সাইট deploy হওয়ার পরে চলে, যাতে নোটিফিকেশনে চাপ দিলে নতুন দামই দেখায়
export async function sendPriceAlerts(send?: Send): Promise<string> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!send) {
    if (!publicKey || !privateKey) return "";
    webpush.setVapidDetails(process.env.NEXT_PUBLIC_SITE_URL || "https://dordam.app", publicKey, privateKey);
    send = (subscription, payload) => webpush.sendNotification(subscription, payload, { TTL: 24 * 3600, urgency: "normal" });
  }
  const rows = (await must(db().rpc("due_price_alerts"))) as DueAlert[];
  if (!rows.length) return "";

  let sent = 0;
  let gone = 0;
  let failed = 0;
  const now = new Date().toISOString();
  await pool(buildMessages(rows), 5, async (message) => {
    try {
      await send(message.subscription, JSON.stringify(message.payload));
      sent++;
      for (const row of message.rows) {
        await must(db().from("price_alerts").update({ price: row.new_price, notified_at: now }).eq("endpoint", row.endpoint).eq("product_id", row.product_id));
      }
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      // ব্রাউজার অনুমতি তুলে নিলে বা ঠিকানা মেয়াদোত্তীর্ণ হলে push সার্ভিস 404/410 দেয়
      if (status === 404 || status === 410) {
        gone++;
        await must(db().from("price_alerts").delete().eq("endpoint", message.subscription.endpoint));
      } else failed++;
    }
  });
  return [
    sent ? `${count(sent, "দাম কমার নোটিফিকেশন")} পাঠানো হয়েছে` : "",
    gone ? `${count(gone, "বন্ধ ব্রাউজার")} বাদ` : "",
    failed ? `${count(failed, "নোটিফিকেশন")} যায়নি, পরের বার` : "",
  ]
    .filter(Boolean)
    .join(", ");
}
