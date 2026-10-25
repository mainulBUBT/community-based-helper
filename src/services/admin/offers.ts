import { loadSampleCatalog, samplePromos } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { Condition, Offer, OfferSource, Promo } from "@/types/catalog";
import { canonicalRegion } from "@/utils/region";
import { loadCatalog } from "../catalog-live";
import { toOffer, toPromo } from "../mappers";
import { logAction } from "./audit";

export interface ManualOffer {
  variantId: string;
  sellerId: string;
  condition: Condition;
  region: string | null;
  price: number;
  url: string | null;
  source?: OfferSource;
}

async function refresh(action: string, detail: Record<string, unknown>) {
  await loadCatalog(true);
  await logAction(action, detail);
}

export async function saveManualOffer(manual: ManualOffer) {
  const input = { ...manual, region: canonicalRegion(manual.region) };
  const checkedAt = new Date().toISOString();
  const { source = "admin", ...fields } = input;
  if (!supabase) {
    const { sampleOffers } = await loadSampleCatalog();
    const existing = sampleOffers.find((o) => o.variantId === input.variantId && o.sellerId === input.sellerId && o.condition === input.condition);
    if (existing) Object.assign(existing, { oldPrice: existing.price, price: input.price, checkedAt, url: input.url, region: input.region, source });
    else sampleOffers.push({ ...fields, id: `o${Date.now()}`, oldPrice: null, inStock: null, source, published: true, checkedAt });
  } else {
    const { error } = await supabase.from("offers").upsert(
      {
        variant_id: input.variantId,
        seller_id: input.sellerId,
        condition: input.condition,
        region: input.region,
        price: input.price,
        url: input.url,
        source,
        checked_at: checkedAt,
      },
      { onConflict: "variant_id,seller_id,condition" },
    );
    if (error) throw error;
  }
  await refresh("offer.manual", { ...input });
}

export async function listOffersFor(variantIds: string[]): Promise<Offer[]> {
  if (!supabase) return (await loadSampleCatalog()).sampleOffers.filter((o) => variantIds.includes(o.variantId)).map((o) => ({ ...o }));
  const { data, error } = await supabase.from("offers").select("*").in("variant_id", variantIds).order("price");
  if (error) throw error;
  return data.map(toOffer);
}

// সন্দেহজনক দামের অফার সাইটে লুকানো থাকে বলে সাধারণ ক্যাটালগে আসে না; কোন ভার্সনের, তা আলাদা করে আনা
export async function offerVariants(offerIds: string[]): Promise<Map<string, string>> {
  if (!offerIds.length) return new Map();
  if (!supabase) {
    const { sampleOffers } = await loadSampleCatalog();
    return new Map(sampleOffers.filter((o) => offerIds.includes(o.id)).map((o) => [o.id, o.variantId]));
  }
  const { data, error } = await supabase.from("offers").select("id, variant_id").in("id", offerIds);
  if (error) throw error;
  return new Map(data.map((row) => [String(row.id), String(row.variant_id)]));
}

export async function updateOffer(offer: Offer, patch: Partial<Pick<Offer, "price" | "inStock" | "published" | "url" | "region">>) {
  if (!supabase) Object.assign((await loadSampleCatalog()).sampleOffers.find((o) => o.id === offer.id)!, patch);
  else {
    const row: Record<string, unknown> = {};
    if (patch.price !== undefined) row.price = patch.price;
    if (patch.inStock !== undefined) row.in_stock = patch.inStock;
    if (patch.published !== undefined) row.published = patch.published;
    if (patch.url !== undefined) row.url = patch.url;
    if (patch.region !== undefined) row.region = canonicalRegion(patch.region);
    const { error } = await supabase.from("offers").update(row).eq("id", offer.id);
    if (error) throw error;
  }
  await refresh("offer.update", { offer: offer.id, ...patch });
}

export async function deleteOffer(offer: Offer) {
  if (!supabase) {
    const { sampleOffers } = await loadSampleCatalog();
    sampleOffers.splice(sampleOffers.findIndex((o) => o.id === offer.id), 1);
  } else {
    const { error } = await supabase.from("offers").delete().eq("id", offer.id);
    if (error) throw error;
  }
  await refresh("offer.delete", { offer: offer.id, price: offer.price });
}

export async function listAllPromos(): Promise<Promo[]> {
  if (!supabase) return samplePromos.map((p) => ({ ...p }));
  const { data, error } = await supabase.from("promos").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toPromo);
}

export async function savePromo(promo: Promo) {
  const isNew = !promo.id;
  if (!supabase) {
    if (isNew) samplePromos.unshift({ ...promo, id: `pr${Date.now()}` });
    else Object.assign(samplePromos.find((p) => p.id === promo.id)!, promo);
  } else {
    const row = { seller_id: promo.sellerId, kind: promo.kind, text: promo.text, scope: promo.scope, ends_on: promo.endsOn, active: promo.active };
    const { error } = isNew ? await supabase.from("promos").insert(row) : await supabase.from("promos").update(row).eq("id", promo.id);
    if (error) throw error;
  }
  await refresh(isNew ? "promo.create" : promo.active ? "promo.activate" : "promo.update", { text: promo.text });
}

export async function deletePromo(promo: Promo) {
  if (!supabase) samplePromos.splice(samplePromos.findIndex((p) => p.id === promo.id), 1);
  else {
    const { error } = await supabase.from("promos").delete().eq("id", promo.id);
    if (error) throw error;
  }
  await refresh("promo.delete", { text: promo.text });
}
