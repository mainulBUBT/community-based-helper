import { db, must } from "../lib/db";
import { Disallowed, NotFound, StoreBlocked, message } from "../lib/errors";
import { groupBy, pool } from "../lib/pool";
import { applyApproved } from "../services/apply-approved";
import { markGone, saveQuote } from "../services/offers";
import { readQuote } from "../stores/page";
import { storeFor } from "../stores";
import { deadline } from "./budget";
import { blockedNote, count } from "./summary";

const BATCH = 400;

interface OfferRow {
  id: string;
  variant_id: string;
  seller_id: string;
  url: string;
  variants: { label: string; products: { name: string } | null } | null;
  sellers: { name: string } | null;
}

export function refreshPrices(rendered: boolean) {
  return async () => {
    const applied = await applyApproved();
    const rows = (await must(
      db()
        .from("offers")
        .select("id, variant_id, seller_id, url, variants(label, products(name)), sellers(name)")
        .eq("source", "site")
        .not("url", "is", null)
        .order("checked_at")
        .limit(BATCH * 3),
    )) as unknown as OfferRow[];
    const due = rows.filter((r) => storeFor(r.url)?.rendered === rendered).slice(0, BATCH);
    const tally = { checked: 0, changed: 0, anomaly: 0, failed: 0 };
    const outOfTime = deadline(rendered ? 40 : 20);
    const errors: string[] = [];

    const perStore = groupBy(due, (row) => storeFor(row.url)!.id);
    await Promise.all(
      [...perStore.values()].map((rows) => pool(rows, 2, async (row) => {
        const store = storeFor(row.url)!;
        try {
          const quote = await readQuote(store, row.url);
          if (!quote) throw new Error(`${row.url}: দাম পাওয়া যায়নি`);
          const result = await saveQuote(
            {
              variantId: row.variant_id,
              sellerId: row.seller_id,
              url: row.url,
              productLabel: `${row.variants?.products?.name ?? ""} ${row.variants?.label ?? ""}`.trim(),
              sellerName: row.sellers?.name ?? store.name,
            },
            quote,
          );
          tally.checked++;
          if (result === "changed") tally.changed++;
          if (result === "anomaly") tally.anomaly++;
        } catch (error) {
          if (error instanceof NotFound) {
            await markGone(row.id);
            tally.checked++;
          } else if (!(error instanceof StoreBlocked) && !(error instanceof Disallowed)) {
            tally.failed++;
            errors.push(message(error));
          }
        }
      }, outOfTime)),
    );

    if (due.length > 0 && tally.checked === 0) throw new Error(`একটা দামও আনা যায়নি${blockedNote()}; ${errors.slice(0, 3).join("; ")}`);
    return [
      `${count(tally.checked, "দেখেছে")}, ${count(tally.changed, "দাম বদলেছে")}`,
      tally.anomaly ? `${count(tally.anomaly, "সন্দেহজনক")} যাচাইয়ে` : "",
      tally.failed ? `${count(tally.failed, "ব্যর্থ")}` : "",
      applied ? `${count(applied, "অনুমোদিত")} বসানো হয়েছে` : "",
    ]
      .filter(Boolean)
      .join(", ") + blockedNote();
  };
}
