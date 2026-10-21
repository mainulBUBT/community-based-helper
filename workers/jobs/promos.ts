import { db, must } from "../lib/db";
import { StoreBlocked, message } from "../lib/errors";
import { visibleText } from "../lib/html";
import { askJson, llmReady } from "../lib/llm";
import { sellersByStore } from "../services/sellers";
import { pageHtml } from "../stores/page";
import { stores } from "../stores";
import { blockedNote, count } from "./summary";

const PROMO_KINDS = new Set(["discount", "cashback", "emi", "gift", "bundle", "other"]);

const SYSTEM =
  "You read the offers page of a Bangladeshi gadget shop. Reply with JSON {\"promos\": [{\"kind\": \"discount\"|\"cashback\"|\"emi\"|\"gift\"|\"bundle\"|\"other\", \"text\": short Bangla sentence, \"scope\": what it applies to or null, \"endsOn\": \"YYYY-MM-DD\"|null}]}. Only include offers for phones, laptops, tablets or smartwatches that are clearly current. Empty list if none.";

interface Promo {
  kind: string;
  text: string;
  scope: string | null;
  endsOn: string | null;
}

export async function readPromos(): Promise<string> {
  if (!(await llmReady())) throw new Error("LLM key দেওয়া নেই, অফার পড়া যায়নি");
  const sellers = await sellersByStore(stores);
  let added = 0;
  const notes: string[] = [];

  for (const store of stores) {
    const seller = sellers.get(store.id);
    if (!store.promoUrl || !seller) continue;
    try {
      const text = visibleText(await pageHtml(store, store.promoUrl)).slice(0, 8000);
      const { promos = [] } = await askJson<{ promos?: Promo[] }>(SYSTEM, text);
      const existing = (await must(db().from("promos").select("text").eq("seller_id", seller.id))) as { text: string }[];
      const fresh = promos.filter((p) => p.text && !existing.some((e) => e.text === p.text));
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
