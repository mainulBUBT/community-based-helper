import { db, must } from "../lib/db";
import { StoreBlocked, message } from "../lib/errors";
import { mainText } from "../lib/html";
import { askJson, llmReady } from "../lib/llm";
import { sellersByStore } from "../services/sellers";
import { pageHtml } from "../stores/page";
import { stores } from "../stores";
import { blockedNote, count } from "./summary";

const PROMO_KINDS = new Set(["discount", "cashback", "emi", "gift", "bundle", "other"]);

const SYSTEM =
  "You read the offers page of a Bangladeshi online shop. Reply with JSON {\"promos\": [{\"kind\": \"discount\"|\"cashback\"|\"emi\"|\"gift\"|\"bundle\"|\"other\", \"text\": short Bangla sentence, \"scope\": what it applies to or null, \"endsOn\": \"YYYY-MM-DD\"|null, \"type\": our product type it applies to, \"other\" if none of ours, null if it applies to every order, \"brand\": the brand in English as written, null if any brand}]}. Include only offers that are clearly current and concrete: a taka amount, a percentage, a coupon code, a named free item, or 0% EMI. Skip vague ones like \"attractive discount\", \"free gift\" or \"cashback\" with no amount or item. Skip offers for product types or brands not in the given list, ones whose dates have passed, and ones already in the saved list (the same offer counts even if worded differently). Only offers actually written in the text; never invent or guess. Empty list if none.";
// এর কম লেখা মানে অফারগুলো পরে JavaScript দিয়ে আসে; তখন AI কে দিলে সে বানিয়ে লেখে
const MIN_TEXT = 200;

interface Promo {
  kind: string;
  text: string;
  scope: string | null;
  endsOn: string | null;
  type: string | null;
  brand: string | null;
}

type Catalog = Map<string, Set<string>>;

// AI প্রতিদিন একই অফার একটু অন্যভাবে লেখে; বিরামচিহ্ন আর বড়-ছোট হাতের অক্ষর বাদ দিয়ে মেলানো
const sameText = (text: unknown) =>
  String(text)
    .slice(0, 300)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

async function catalogBrands(): Promise<Catalog> {
  const rows = (await must(db().from("products").select("category, brand").eq("active", true))) as { category: string; brand: string }[];
  const catalog: Catalog = new Map();
  for (const { category, brand } of rows) catalog.set(category, (catalog.get(category) ?? new Set()).add(brand.toLowerCase()));
  return catalog;
}

// AI কে বলা সত্ত্বেও তালিকার বাইরের ব্র্যান্ড বা ধরনের অফার আনে, তাই মেলানো কোডে
function inCatalog({ type, brand }: Promo, catalog: Catalog): boolean {
  if (type && !catalog.has(type)) return false;
  if (!brand) return true;
  const brands = type ? [catalog.get(type)!] : [...catalog.values()];
  return brands.some((set) => set.has(brand.toLowerCase()));
}

// AI মাঝে মাঝে বছর ভুল লেখে (২০২৬ এর জায়গায় ২০৩০); এক বছরের বেশি দূরের তারিখ বিশ্বাসযোগ্য নয়
function endsOn(value: string | null, today: string): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const limit = new Date(Date.parse(today) + 366 * 86_400_000).toISOString().slice(0, 10);
  return value >= today && value <= limit ? value : null;
}

export async function readPromos(): Promise<string> {
  if (!(await llmReady())) throw new Error("LLM key দেওয়া নেই, অফার পড়া যায়নি");
  const today = new Date().toISOString().slice(0, 10);
  await must(db().from("promos").delete().lt("ends_on", today));
  const sellers = await sellersByStore(stores);
  const catalog = await catalogBrands();
  const brands = [...catalog].map(([type, names]) => `${type} (${[...names].join(", ")})`).join("; ");
  let added = 0;
  const notes: string[] = [];

  for (const store of stores) {
    const seller = sellers.get(store.id);
    if (!store.promoUrl || !seller) continue;
    try {
      const text = mainText(await pageHtml(store, store.promoUrl)).slice(0, 8000);
      if (text.length < MIN_TEXT) {
        notes.push(`${store.name}: অফার পাতায় লেখা নেই (JavaScript দিয়ে আসে)`);
        continue;
      }
      const existing = (await must(db().from("promos").select("text").eq("seller_id", seller.id))) as { text: string }[];
      const saved = existing.map((e) => `- ${e.text}`).join("\n") || "none";
      const { promos = [] } = await askJson<{ promos?: Promo[] }>(SYSTEM, `Today: ${today}\n\nProduct types and brands we compare: ${brands}\n\nSaved offers:\n${saved}\n\nOffers page:\n${text}`);
      const seen = new Set(existing.map((e) => sameText(e.text)));
      const fresh = promos.filter((p) => {
        if (!p.text || seen.has(sameText(p.text)) || !inCatalog(p, catalog)) return false;
        seen.add(sameText(p.text));
        return true;
      });
      if (fresh.length === 0) continue;
      await must(
        db()
          .from("promos")
          .insert(
            fresh.map((p) => ({
              seller_id: seller.id,
              kind: PROMO_KINDS.has(p.kind ?? "") ? p.kind : "other",
              text: String(p.text).slice(0, 300),
              scope: p.scope ? String(p.scope).slice(0, 120) : null,
              ends_on: endsOn(p.endsOn, today),
              active: false,
            })),
          ),
      );
      added += fresh.length;
    } catch (error) {
      if (!(error instanceof StoreBlocked)) notes.push(`${store.name}: ${message(error)}`);
    }
  }
  return [`${count(added, "নতুন অফার")} যাচাইয়ে`, ...notes].join("; ") + blockedNote();
}
