import { all, db } from "../lib/db";
import { Disallowed, NotFound, StoreBlocked, message } from "../lib/errors";
import { groupBy, pool } from "../lib/pool";
import { candidates, single } from "../lib/variants";
import { applyApproved } from "../services/apply-approved";
import { markGone, refreshOffer, saveProductImage } from "../services/offers";
import { readPage } from "../stores/page";
import { storeFor } from "../stores";
import { deadline } from "./budget";
import { blockedNote, count } from "./summary";

interface OfferRow {
  id: string;
  variant_id: string;
  seller_id: string;
  url: string;
  price: number;
  condition: string;
  variant_key: string | null;
  variants: { label: string; products: { name: string; variants: { label: string }[] } | null } | null;
  source: string;
  sellers: { name: string; kind: string } | null;
}

const label = (row: OfferRow) => `${row.variants?.products?.name ?? ""} ${row.variants?.label ?? ""}`.trim();

// প্রতিটা লিংক একবার পড়া হয়, ওই পাতার সব ভার্সনের দাম একসাথে; সবচেয়ে পুরনো যাচাই আগে।
// অ্যাডমিনের হাতে বসানো দামও, যদি বিক্রেতার ওয়েবসাইট থাকে
export async function refreshPrices(): Promise<string> {
  const applied = await applyApproved();
  const offers = await all<OfferRow>((from, to) =>
    db()
      .from("offers")
      .select("id, variant_id, seller_id, url, price, condition, source, variant_key, variants(label, products(name, variants(label))), sellers(name, kind)")
      .in("source", ["site", "admin"])
      .not("url", "is", null)
      .order("checked_at")
      .order("id")
      .range(from, to),
  );
  const rows = offers.filter((row) => row.source === "site" || row.sellers?.kind === "website");
  const tally = { checked: 0, changed: 0, anomaly: 0, unmatched: 0, failed: 0, blocked: 0 };
  const outOfTime = deadline(25);
  const errors: string[] = [];
  const unmatched: string[] = [];

  const pages = [...groupBy(rows, (row) => row.url).values()];
  const perStore = groupBy(pages, (group) => storeFor(group[0].url).id);
  await Promise.all(
    [...perStore.values()].map((groups) =>
      pool(
        groups,
        2,
        async (group) => {
          const { url } = group[0];
          const store = storeFor(url);
          try {
            const page = await readPage(store, url);
            if (!page) throw new Error(`${url}: দাম পাওয়া যায়নি`);
            for (const row of group) {
              const siblings = row.variants?.products?.variants.map((v) => v.label) ?? [];
              const target = { product: row.variants?.products?.name ?? "", label: row.variants?.label ?? "", siblings, condition: row.condition, price: row.price, key: row.variant_key };
              const found = single(candidates(page.offers, target, group.length === 1));
              if (!found) {
                tally.unmatched++;
                unmatched.push(`${label(row)} (${row.sellers?.name ?? store.name})`);
                continue;
              }
              const sellerName = row.sellers?.name ?? store.name;
              const result = await refreshOffer({ id: row.id, variantId: row.variant_id, sellerId: row.seller_id, url, price: row.price, productLabel: label(row), sellerName }, found);
              tally.checked++;
              if (result === "changed") tally.changed++;
              if (result === "anomaly") tally.anomaly++;
            }
            await saveProductImage(group[0].variant_id, page.image);
          } catch (error) {
            if (error instanceof NotFound) {
              await markGone(group.map((row) => row.id));
              tally.checked += group.length;
            } else if (error instanceof StoreBlocked || error instanceof Disallowed) {
              tally.blocked += group.length;
            } else {
              tally.failed += group.length;
              errors.push(message(error));
            }
          }
        },
        outOfTime,
      ),
    ),
  );

  if (rows.length > 0 && tally.checked === 0) throw new Error(`একটা দামও আনা যায়নি${blockedNote()}; ${errors.slice(0, 3).join("; ")}`);
  const skipped = rows.length - tally.checked - tally.unmatched - tally.failed - tally.blocked;
  return [
    `${count(tally.checked, "দেখেছে")}, ${count(tally.changed, "দাম বদলেছে")}`,
    tally.anomaly ? `${count(tally.anomaly, "সন্দেহজনক")} যাচাইয়ে` : "",
    tally.unmatched ? `${count(tally.unmatched, "ভার্সন পাতায় মেলেনি")}: ${unmatched.slice(0, 5).join(", ")}` : "",
    tally.failed ? `${count(tally.failed, "ব্যর্থ")}: ${errors.slice(0, 3).join("; ")}` : "",
    tally.blocked ? `${count(tally.blocked, "দাম")} দোকান আটকে রাখায় বাদ` : "",
    skipped > 0 ? `${count(skipped, "সময়ে কুলায়নি, পরের বার")}` : "",
    applied ? `${count(applied, "অনুমোদিত")} বসানো হয়েছে` : "",
  ]
    .filter(Boolean)
    .join(", ") + blockedNote();
}
