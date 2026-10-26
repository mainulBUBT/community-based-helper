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
  "You read the offers page of a Bangladeshi online shop. Reply with JSON {\"promos\": [{\"kind\": \"discount\"|\"cashback\"|\"emi\"|\"gift\"|\"bundle\"|\"other\", \"text\": short Bangla sentence, \"scope\": what it applies to or null, \"endsOn\": \"YYYY-MM-DD\"|null}]}. Include every offer that is clearly current (any product: gadgets, appliances, food, beauty, etc.); skip ones whose dates have passed. Empty list if none.";

interface Promo {
  kind: string;
  text: string;
  scope: string | null;
  endsOn: string | null;
}

// AI প্রতিদিন একই অফার একটু অন্যভাবে লেখে; বিরামচিহ্ন আর বড়-ছোট হাতের অক্ষর বাদ দিয়ে মেলানো
const sameText = (text: unknown) =>
  String(text)
    .slice(0, 300)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export async function readPromos(): Promise<string> {
  if (!(await llmReady())) throw new Error("LLM key দেওয়া নেই, অফার পড়া যায়নি");
  const sellers = await sellersByStore(stores);
  let added = 0;
  const notes: string[] = [];

  for (const store of stores) {
    const seller = sellers.get(store.id);
    if (!store.promoUrl || !seller) continue;
    try {
      const text = mainText(await pageHtml(store, store.promoUrl)).slice(0, 8000);
      const { promos = [] } = await askJson<{ promos?: Promo[] }>(SYSTEM, text);
      const existing = (await must(db().from("promos").select("text").eq("seller_id", seller.id))) as { text: string }[];
      const seen = new Set(existing.map((e) => sameText(e.text)));
      const fresh = promos.filter((p) => {
        if (!p.text || seen.has(sameText(p.text))) return false;
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
              ends_on: /^\d{4}-\d{2}-\d{2}$/.test(p.endsOn ?? "") ? p.endsOn : null,
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
