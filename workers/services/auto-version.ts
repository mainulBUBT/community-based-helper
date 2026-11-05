import { db, must } from "../lib/db";
import { privateSettings } from "../lib/settings";
import { isOpened } from "../lib/variants";
import { stores } from "../stores";
import { isLocalUrl } from "../stores/local";
import { readPage } from "../stores/page";
import type { Store } from "../stores/types";
import { loadCatalog } from "./catalog";
import { markApplied, type ReviewPayload } from "./review";
import { sellersByStore } from "./sellers";
import { upsertOffer } from "./offers";

// মালিকের "ম্যানেজার নিজে করবে" অপশন চালু থাকলে: দোকানে পাওয়া নতুন কনফিগ (Find X9 Pro 12GB/256GB) বাদ না দিয়ে একই পণ্যের অন্য দোকানের পাতায় খোঁজা,
// ২+ দোকানে আসল দাম পেলে ভার্সন আর দাম বসানো। AI নেই: দোকানের লেখা থেকে শুধু সংখ্যা নেওয়া হয়, তাই পাতার লেখা দিয়ে একে ভোলানো যায় না।
// এখন শুধু মোবাইল; অন্য ক্যাটাগরির ঘর (চিপ, connectivity) পাতা থেকে নিশ্চিতভাবে পড়া যায় না, সেগুলো মালিকের জন্য থাকে।

const MIN_SELLERS = 2;
const SPREAD = 1.8;
const PRICE_RANGE = [0.4, 2.5];
const MAX_PRODUCTS = 10;
const MAX_PER_DAY = 5;
const WAIT_MS = 7 * 86_400_000;
const CATEGORIES = ["mobile"];
const RAM = [2, 3, 4, 6, 8, 12, 16, 18, 24, 32];
const STORAGE_GB = [64, 128, 256, 512];
const STORAGE_TB = [1, 2];
const CONDITION_WORD = /\b(?:official|unofficial|intl|international)\b/i;
const PAIR = /(\d+)\s*(?:gb)?\s*[/+|]\s*(\d+)\s*(gb|tb)?/i;
const SIZE = /(\d+)\s*(gb|tb)/gi;

export interface Config {
  ram: string | null;
  storage: string;
}

interface Evidence {
  sellerId: string;
  seller: string;
  url: string;
  condition: string;
  price: number;
  oldPrice: number | null;
  inStock: boolean | null;
  key?: string;
  region: string | null;
}

interface Item {
  id: string;
  payload: ReviewPayload;
  created_at: string;
}

interface VariantRow {
  id: string;
  label: string;
  position: number;
  attributes: { ram?: string; storage?: string };
}

interface OfferRow {
  variant_id: string;
  seller_id: string;
  url: string | null;
  price: number;
  condition: string;
  sellers: { name: string } | null;
}

export interface VersionsResult {
  added: string[];
  waiting: number;
  flagged: number;
}

const storageOf = (value: number, unit: string): string | null => {
  if (unit === "tb") return STORAGE_TB.includes(value) ? `${value}TB` : null;
  return STORAGE_GB.includes(value) ? `${value}GB` : null;
};

// শুধু জানা RAM আর স্টোরেজের মান; রং, ওয়ারেন্টি, ব্যবহৃত বা অফিসিয়াল লেখা অপশন বাদ
export function configOf(label: string): Config | null {
  if (isOpened(label) || CONDITION_WORD.test(label)) return null;
  const pair = PAIR.exec(label);
  if (pair) {
    const ram = Number(pair[1]);
    const storage = storageOf(Number(pair[2]), (pair[3] ?? "gb").toLowerCase());
    return RAM.includes(ram) && storage ? { ram: `${ram}GB`, storage } : null;
  }
  const sizes = [...label.matchAll(SIZE)].map((m) => ({ value: Number(m[1]), unit: m[2].toLowerCase() }));
  if (sizes.length === 1) {
    const storage = storageOf(sizes[0].value, sizes[0].unit);
    return storage ? { ram: null, storage } : null;
  }
  if (sizes.length !== 2) return null;
  const [small, big] = [...sizes].sort((a, b) => (a.unit === b.unit ? a.value - b.value : a.unit === "gb" ? -1 : 1));
  const storage = storageOf(big.value, big.unit);
  return small.unit === "gb" && RAM.includes(small.value) && storage ? { ram: `${small.value}GB`, storage } : null;
}

// পণ্যের অন্য ভার্সনে RAM না থাকলে (iPhone) পাতার RAM বাদ; থাকলে RAM ছাড়া কনফিগ অনিশ্চিত
export function fitConfig(config: Config, siblings: Config[]): Config | null {
  const withRam = siblings.some((s) => s.ram);
  if (withRam && !config.ram) return null;
  return { ram: withRam ? config.ram : null, storage: config.storage };
}

export const configKey = (config: Config) => (config.ram ? `${config.ram} / ${config.storage}` : config.storage);

// ask() এর লেখা অপশনের লাইন: "12GB / 256GB: 98499 (out of stock)"
export function optionLines(options: string | undefined): { label: string; price: number; inStock: boolean | null }[] {
  return (options ?? "").split("\n").flatMap((line) => {
    const match = /^(.*): (\d+)( \(out of stock\))?$/.exec(line.trim());
    return match ? [{ label: match[1], price: Number(match[2]), inStock: match[3] ? false : null }] : [];
  });
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// সব শর্ত কোডে; null মানে যোগ করা যায়, লেখা মানে মালিকের জানা দরকার
export function priceProblem(prices: number[], siblingPrices: number[]): string | null {
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  if (high / low > SPREAD) return `দোকানগুলোর দামে অনেক ফারাক (৳${low} থেকে ৳${high})`;
  if (!siblingPrices.length) return null;
  const typical = median(siblingPrices);
  return low < typical * PRICE_RANGE[0] || high > typical * PRICE_RANGE[1] ? `দাম একই পণ্যের অন্য ভার্সনের (৳${typical}) থেকে অনেক দূরে` : null;
}

// ঢাকার আজকের শুরু
function dhakaToday(now = Date.now()): string {
  const six = 6 * 3_600_000;
  return new Date(Math.floor((now + six) / 86_400_000) * 86_400_000 - six).toISOString();
}

// এগুলো বিপদ নয় (কিছু বসেনি, আইটেম যাচাই বাকিতেই আছে), তাই Telegram নয়, সকালের রিপোর্টে
const flag = (text: string, detail: Record<string, unknown>) => must(db().from("audit_log").insert({ action: "agent.report", detail: { ...detail, text } }));

const patchItem = (item: Item, patch: ReviewPayload) => must(db().from("review_queue").update({ payload: { ...item.payload, ...patch } }).eq("id", item.id).eq("status", "pending"));

async function newVariant(productId: string, config: Config, position: number): Promise<string> {
  const attributes = config.ram ? { ram: config.ram, storage: config.storage } : { storage: config.storage };
  const row = (await must(db().from("variants").insert({ product_id: productId, label: configKey(config), attributes, sku: null, official_price: null, position }).select("id").single())) as { id: string };
  return row.id;
}

// GitHub থেকে লোকাল দোকানের পাতা খোলে না, লোকাল run থেকে শুধু সেগুলোই
const readableHere = (url: string) => isLocalUrl(url) === Boolean(process.env.LOCAL_JOB);

export async function autoVersions(stop: () => boolean = () => false, dry = false, log: (line: string) => void = () => {}): Promise<VersionsResult> {
  const result: VersionsResult = { added: [], waiting: 0, flagged: 0 };
  if (!dry && !(await privateSettings()).managerAuto) return result;
  const query = db().from("review_queue").select("id, payload, created_at").eq("kind", "match").eq("payload->>newVariant", "true").order("created_at");
  const items = (await must(dry ? query.in("status", ["pending", "rejected"]).limit(40) : query.eq("status", "pending").limit(200))) as Item[];
  if (!items.length) return result;

  const today = (await must(db().from("audit_log").select("id").eq("action", "agent.variant").gte("created_at", dhakaToday()))) as unknown[];
  let room = MAX_PER_DAY - today.length;
  const catalog = new Map((await loadCatalog()).map((p) => [p.id, p]));
  const sellers = await sellersByStore(stores);
  const storeOf = new Map<string, Store>(stores.flatMap((store) => (sellers.get(store.id) ? [[sellers.get(store.id)!.id, store] as [string, Store]] : [])));

  const byProduct = new Map<string, Item[]>();
  for (const item of items) if (item.payload.productId) byProduct.set(item.payload.productId, [...(byProduct.get(item.payload.productId) ?? []), item]);

  for (const [productId, group] of [...byProduct].slice(0, MAX_PRODUCTS)) {
    if (stop()) break;
    const product = catalog.get(productId);
    if (!product) continue;
    const name = `${product.brand} ${product.name}`;
    const variants = (await must(db().from("variants").select("id, label, position, attributes").eq("product_id", productId))) as VariantRow[];
    const siblings = variants.map((v) => ({ ram: v.attributes.ram ?? null, storage: v.attributes.storage ?? "" }));
    const have = new Set(siblings.map(configKey));
    const offers = (await must(
      db().from("offers").select("variant_id, seller_id, url, price, condition, sellers(name)").in("variant_id", variants.map((v) => v.id)).eq("published", true).gt("price", 0),
    )) as unknown as OfferRow[];

    // মোবাইলের বাইরে, বা পাতার লেখা থেকে কনফিগ নিশ্চিত নয়: বাতিল নয়, মালিকের জন্য
    const manual = async (item: Item, why: string) => {
      log(`  মালিকের জন্য: ${item.payload.seller}: ${why}`);
      if (dry) return;
      await patchItem(item, { versionWait: "manual" });
      await flag(`${name}: ${item.payload.seller}-এর পাতার নতুন কনফিগ নিজে বসাতে পারিনি (${why})। অ্যাডমিন → যাচাই বাকিতে দেখুন: ${item.payload.url}`, { product: productId, url: item.payload.url });
      result.flagged++;
    };

    const wanted = new Map<string, { config: Config; evidence: Map<string, Evidence>; items: Set<Item> }>();
    log(`${name} (আছে: ${[...have].join(", ")})`);
    for (const item of group) {
      if (item.payload.versionWait === "manual") continue;
      if (!CATEGORIES.includes(product.category ?? "")) {
        await manual(item, `${product.category ?? "?"} এখনো নিজে হয় না`);
        continue;
      }
      const lines = optionLines(item.payload.options);
      const fitted = lines.map((line) => ({ line, config: configOf(line.label) })).map(({ line, config }) => ({ line, config: config && fitConfig(config, siblings) }));
      const fresh = fitted.filter(({ config }) => config && !have.has(configKey(config)));
      if (!fresh.length) {
        // সব অপশন আগে থেকেই ক্যাটালগে আছে: সাধারণ AI যাচাইয়ের কাজ
        if (!fitted.some(({ config }) => config)) await manual(item, "RAM আর স্টোরেজ পড়া যায়নি");
        continue;
      }
      for (const { line, config } of fresh) {
        const key = configKey(config!);
        const entry = wanted.get(key) ?? { config: config!, evidence: new Map(), items: new Set<Item>() };
        entry.items.add(item);
        if (item.payload.sellerId && item.payload.url) {
          entry.evidence.set(item.payload.sellerId, {
            sellerId: item.payload.sellerId,
            seller: item.payload.seller ?? "",
            url: item.payload.url,
            condition: item.payload.condition || "official",
            price: line.price,
            oldPrice: null,
            inStock: line.inStock,
            region: item.payload.region || null,
          });
        }
        wanted.set(key, entry);
      }
    }
    if (!wanted.size) continue;

    // একই পণ্য যে দোকানগুলোতে আছে, তাদের পাতায় নতুন কনফিগ খোঁজা
    const pages = new Map(offers.filter((o) => o.url && storeOf.has(o.seller_id) && readableHere(o.url)).map((o) => [o.seller_id, o]));
    for (const [sellerId, offer] of pages) {
      if (stop()) break;
      if ([...wanted.values()].every((w) => w.evidence.has(sellerId))) continue;
      const store = storeOf.get(sellerId)!;
      const page = await readPage(store, offer.url!, false).catch(() => null);
      for (const option of page?.offers ?? []) {
        const parsed = configOf(option.label);
        const config = parsed && fitConfig(parsed, siblings);
        const entry = config && wanted.get(configKey(config));
        if (!entry || entry.evidence.has(sellerId)) continue;
        entry.evidence.set(sellerId, {
          sellerId,
          seller: offer.sellers?.name ?? store.name,
          url: offer.url!,
          condition: offer.condition,
          price: option.price,
          oldPrice: option.oldPrice,
          inStock: option.inStock,
          key: option.key,
          region: option.region,
        });
      }
    }

    const added = new Set<string>();
    let position = Math.max(-1, ...variants.map((v) => v.position)) + 1;
    for (const [key, { config, evidence }] of wanted) {
      const found = [...evidence.values()];
      log(`  ${key}: ${found.map((e) => `${e.seller} ৳${e.price}`).join(", ") || "কোথাও নেই"}`);
      if (found.length < MIN_SELLERS) continue;
      const problem = priceProblem(found.map((e) => e.price), offers.map((o) => o.price));
      if (problem) {
        log(`  → মালিকের জন্য: ${problem}`);
        if (!dry) {
          await flag(`${name} ${key}: ${found.length} দোকানে পেয়েছি, কিন্তু ${problem}। ${found.map((e) => e.url).join(" ")}`, { product: productId, config: key });
          for (const item of wanted.get(key)!.items) await patchItem(item, { versionWait: "manual" });
          result.flagged++;
        }
        continue;
      }
      if (room <= 0) {
        log("  → আজকের সীমা শেষ");
        continue;
      }
      log(`  → যোগ হবে`);
      room--;
      added.add(key);
      result.added.push(`${name} ${key}`);
      if (dry) continue;
      const variantId = await newVariant(productId, config, position++);
      for (const e of found) await upsertOffer({ variantId, sellerId: e.sellerId, condition: e.condition, url: e.url }, e);
      await must(
        db().from("audit_log").insert({
          action: "agent.variant",
          detail: { agent: "manager", product_id: productId, variant_id: variantId, label: key, reason: `${found.length} দোকানে আসল দাম`, evidence: found.map((e) => e.url) },
        }),
      );
    }

    if (dry) continue;
    const now = Date.now();
    for (const item of group) {
      if (item.payload.versionWait === "manual") continue;
      const asks = [...wanted].filter(([, entry]) => entry.items.has(item)).map(([key]) => key);
      if (!asks.length) continue;
      if (asks.every((key) => added.has(key))) {
        await must(db().from("review_queue").update({ status: "approved", payload: { ...item.payload, decidedBy: "manager", decidedWhy: `নতুন ভার্সন যোগ: ${asks.join(", ")}` }, resolved_at: new Date().toISOString() }).eq("id", item.id).eq("status", "pending"));
        await markApplied(item.id);
        continue;
      }
      const since = item.payload.versionWait ? Date.parse(item.payload.versionWait) : now;
      if (!item.payload.versionFlagged && now - since > WAIT_MS) {
        await flag(`${name} ${asks.join(", ")}: ৭ দিন খুঁজেও ২ দোকান পাইনি। শুধু ${item.payload.seller}-এ আছে: ${item.payload.url}`, { product: productId, url: item.payload.url });
        await patchItem(item, { versionWait: new Date(since).toISOString(), versionFlagged: "true" });
        result.flagged++;
      } else if (!item.payload.versionWait) {
        await patchItem(item, { versionWait: new Date(now).toISOString() });
      }
      result.waiting++;
    }
  }
  return result;
}
