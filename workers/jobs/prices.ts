import { all, db } from "../lib/db";
import { aiRead, aiReadNote } from "../lib/ai-page";
import { Disallowed, NotFound, StoreBlocked, message } from "../lib/errors";
import { groupBy, pool } from "../lib/pool";
import { candidates, single } from "../lib/variants";
import type { Page } from "../stores/page";
import { applyApproved } from "../services/apply-approved";
import { autoReview } from "../services/auto-review";
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
  published: boolean;
  sellers: { name: string; kind: string } | null;
}

interface Tally {
  checked: number;
  changed: number;
  anomaly: number;
  unmatched: number;
  failed: number;
  blocked: number;
  ai: number;
  booking: number;
}

const label = (row: OfferRow) => `${row.variants?.products?.name ?? ""} ${row.variants?.label ?? ""}`.trim();

// এক পাতার সব ভার্সনের দাম বসানো; অন্তত একটা মিললে তবেই পাতার ছবি নেওয়া
async function applyPage(page: Page, group: OfferRow[], storeName: string, tally: Tally, unmatched: string[]) {
  const url = group[0].url;
  let matched: OfferRow | null = null;
  for (const row of group) {
    const siblings = row.variants?.products?.variants.map((v) => v.label) ?? [];
    const target = { product: row.variants?.products?.name ?? "", label: row.variants?.label ?? "", siblings, condition: row.condition, price: row.price, key: row.variant_key };
    const found = single(candidates(page.offers, target, group.length === 1));
    const sellerName = row.sellers?.name ?? storeName;
    if (!found) {
      tally.unmatched++;
      unmatched.push(`${label(row)} (${sellerName})`);
      continue;
    }
    const result = await refreshOffer(
      { id: row.id, variantId: row.variant_id, sellerId: row.seller_id, url, price: row.price, productLabel: label(row), sellerName, hidden: !row.published },
      found,
    );
    matched ??= row;
    tally.checked++;
    if (result === "changed") tally.changed++;
    if (result === "anomaly") tally.anomaly++;
    if (result === "booking") tally.booking++;
  }
  if (matched) await saveProductImage(matched.variant_id, page.image);
}

// প্রতিটা লিংক একবার পড়া হয়, ওই পাতার সব ভার্সনের দাম একসাথে; সবচেয়ে পুরনো যাচাই আগে।
// অ্যাডমিনের হাতে বসানো দামও, যদি বিক্রেতার ওয়েবসাইট থাকে
export async function refreshPrices(): Promise<string> {
  const { applied, failed: notApplied, kept } = await applyApproved();
  const offers = await all<OfferRow>((from, to) =>
    db()
      .from("offers")
      .select("id, variant_id, seller_id, url, price, condition, source, published, variant_key, variants(label, products(name, variants(label))), sellers(name, kind)")
      .in("source", ["site", "admin"])
      .not("url", "is", null)
      .order("checked_at")
      .order("id")
      .range(from, to),
  );
  const rows = offers.filter((row) => row.source === "site" || row.sellers?.kind === "website");
  const tally: Tally = { checked: 0, changed: 0, anomaly: 0, unmatched: 0, failed: 0, blocked: 0, ai: 0, booking: 0 };
  const outOfTime = deadline(25);
  const errors: string[] = [];
  const unmatched: string[] = [];
  const blocked: OfferRow[][] = [];

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
            await applyPage(page, group, store.name, tally, unmatched);
          } catch (error) {
            if (error instanceof NotFound) {
              await markGone(group.map((row) => row.id));
              tally.checked += group.length;
            } else if (error instanceof StoreBlocked) {
              blocked.push(group);
            } else if (error instanceof Disallowed) {
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

  // দোকান GitHub-এর IP আটকালে Gemini-র url_context (Google-এর সার্ভার) দিয়ে পড়ার চেষ্টা, বাকি সব শেষে
  // একটা একটা করে, যাতে AI-র মিনিটের সীমায় না পড়ে। না পড়া গেলে আগের মতো বাদ; সময় ফুরালে পরের বার।
  // পড়া ফলও একই যাচাই আর সীমার ভেতর দিয়ে যায়।
  for (const group of blocked) {
    if (outOfTime()) break;
    const page = await aiRead(group[0].url);
    if (!page) {
      tally.blocked += group.length;
      continue;
    }
    tally.ai += group.length;
    try {
      await applyPage(page, group, storeFor(group[0].url).name, tally, unmatched);
    } catch (error) {
      tally.failed += group.length;
      errors.push(message(error));
    }
  }

  if (rows.length > 0 && tally.checked === 0) throw new Error(`একটা দামও আনা যায়নি${blockedNote()}; ${errors.slice(0, 3).join("; ")}`);
  // সবার শেষে, তাই আজকের অনুমোদন বসে পরের run এ; মাঝে অ্যাডমিন ফিরিয়ে নিতে পারেন
  const reviewed = outOfTime() ? null : await autoReview().catch((error) => ({ approved: 0, rejected: 0, left: 0, errors: [message(error)] }));
  const skipped = rows.length - tally.checked - tally.unmatched - tally.failed - tally.blocked;
  return [
    `${count(tally.checked, "দেখেছে")}, ${count(tally.changed, "দাম বদলেছে")}`,
    tally.anomaly ? `${count(tally.anomaly, "সন্দেহজনক")} যাচাইয়ে` : "",
    tally.booking ? `${count(tally.booking, "বুকিং বা কিস্তির অংক মনে হয়েছে — আগের দামই রাখা হয়েছে")}` : "",
    tally.unmatched ? `${count(tally.unmatched, "ভার্সন পাতায় মেলেনি")}: ${unmatched.slice(0, 5).join(", ")}` : "",
    tally.failed ? `${count(tally.failed, "ব্যর্থ")}: ${errors.slice(0, 3).join("; ")}` : "",
    tally.blocked ? `${count(tally.blocked, "দাম")} দোকান আটকে রাখায় বাদ${aiReadNote()}` : "",
    tally.ai ? `${count(tally.ai, "দাম")} AI পড়া পাতা থেকে` : "",
    skipped > 0 ? `${count(skipped, "সময়ে কুলায়নি, পরের বার")}` : "",
    applied ? `${count(applied, "অনুমোদিত")} বসানো হয়েছে` : "",
    notApplied.length ? `${count(notApplied.length, "অনুমোদিত")} বসানো যায়নি: ${notApplied.slice(0, 3).join("; ")}` : "",
    kept.length ? `${count(kept.length, "অনুমোদিত")} বসানো হয়নি, কারণ ওই ভার্সনে দোকানের অন্য লিংকের দাম আগে থেকেই আছে: ${kept.slice(0, 3).join("; ")}` : "",
    reviewed && reviewed.approved + reviewed.rejected ? `যাচাই বাকি থেকে AI ${count(reviewed.approved, "অনুমোদন")}, ${count(reviewed.rejected, "বাতিল")} (${count(reviewed.left, "মানুষের জন্য")})` : "",
    reviewed?.errors.length ? `AI যাচাইয়ে সমস্যা: ${reviewed.errors.slice(0, 2).join("; ")}` : "",
  ]
    .filter(Boolean)
    .join(", ") + blockedNote();
}
