import { findCheaperAlternatives } from "@/utils/alternatives";
import { byPrice } from "@/utils/catalog";
import type { Alternative, CategoryInfo, Offer, OfferView, PricePoint, Product, ProductDetail, ProductSummary, Promo, Seller } from "@/types/catalog";

export interface Catalog {
  categories: CategoryInfo[];
  products: Product[];
  sellers: Seller[];
  offers: Offer[];
  promos: Promo[];
}

export function viewOffers(catalog: Catalog, offers: Offer[]): OfferView[] {
  const sellers = new Map(catalog.sellers.map((s) => [s.id, s]));
  return offers
    .filter((offer) => sellers.has(offer.sellerId))
    .map((offer) => ({
      ...offer,
      seller: sellers.get(offer.sellerId)!,
      promos: catalog.promos.filter((p) => p.sellerId === offer.sellerId),
    }))
    .sort(byPrice);
}

export function summarize(catalog: Catalog, product: Product): ProductSummary {
  const variantIds = new Set(product.variants.map((v) => v.id));
  const offers = catalog.offers.filter((o) => variantIds.has(o.variantId));
  const official = offers.filter((o) => o.condition === "official");
  const priced = official.length ? official : offers;
  const best = priced.length ? priced.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const lowest = best?.price ?? null;
  const listPrice = best ? product.variants.find((v) => v.id === best.variantId)?.officialPrice : null;
  const reference = Math.max(best?.oldPrice ?? 0, listPrice ?? 0);
  const compareAt = lowest && reference > lowest ? reference : null;
  return {
    product,
    lowest,
    lowestAny: offers.length ? Math.min(...offers.map((o) => o.price)) : null,
    compareAt,
    inStock: offers.some((o) => o.inStock !== false),
    sellerCount: new Set(offers.map((o) => o.sellerId)).size,
    drop: compareAt && lowest ? compareAt - lowest : null,
  };
}

function buildAlternatives(catalog: Catalog, product: Product, category: CategoryInfo | null): Record<string, Alternative[]> {
  const axes = category?.axes ?? [];
  const offersByVariant = new Map<string, Offer[]>();
  for (const offer of catalog.offers) {
    const list = offersByVariant.get(offer.variantId);
    if (list) list.push(offer);
    else offersByVariant.set(offer.variantId, [offer]);
  }
  const candidates = catalog.products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .map((p) => ({
      product: p,
      summary: summarize(catalog, p),
      offers: p.variants.flatMap((v) => offersByVariant.get(v.id) ?? []),
    }));
  const result: Record<string, Alternative[]> = {};
  for (const variant of product.variants) {
    result[variant.id] = findCheaperAlternatives({
      current: product,
      currentVariant: variant,
      currentOffers: offersByVariant.get(variant.id) ?? [],
      candidates,
      axes,
    });
  }
  return result;
}

export type CatalogLoader = (fresh?: boolean) => Promise<Catalog>;
export type HistoryLoader = (offerIds: string[]) => Promise<PricePoint[]>;

// একই API সব উৎসের জন্য: বেক করা JSON (সাইট) আর লাইভ Supabase (অ্যাডমিন) দুটোই এখান থেকে বানে।
export function makeService(load: CatalogLoader, loadHistory: HistoryLoader = () => Promise.resolve([])) {
  const listSummaries = (includeHidden = false) =>
    load().then((catalog) => {
      const visible = new Set(catalog.categories.map((c) => c.slug));
      return catalog.products.filter((p) => includeHidden || visible.has(p.category)).map((product) => summarize(catalog, product));
    });

  const listCategories = () => load().then((catalog) => catalog.categories);
  const listSellers = () => load().then((catalog) => catalog.sellers);

  const getProductDetail = async (slug: string): Promise<ProductDetail | null> => {
    const catalog = await load();
    const product = catalog.products.find((p) => p.slug === slug);
    if (!product) return null;
    const variantIds = new Set(product.variants.map((v) => v.id));
    const offers = viewOffers(catalog, catalog.offers.filter((o) => variantIds.has(o.variantId)));
    const category = catalog.categories.find((c) => c.slug === product.category) ?? null;
    const alternatives = buildAlternatives(catalog, product, category);
    return { product, category, offers, history: await loadHistory(offers.map((o) => o.id)), alternatives };
  };

  const getSellerDetail = async (id: string) => {
    const catalog = await load();
    const seller = catalog.sellers.find((s) => s.id === id);
    if (!seller) return null;
    const variants = new Map(catalog.products.flatMap((p) => p.variants.map((v) => [v.id, { product: p, variant: v }] as const)));
    const listings = catalog.offers
      .filter((o) => o.sellerId === id && variants.has(o.variantId))
      .map((offer) => ({ offer, ...variants.get(offer.variantId)! }))
      .sort((a, b) => b.product.popularity - a.product.popularity);
    return { seller, listings, promos: catalog.promos.filter((p) => p.sellerId === id) };
  };

  return { loadCatalog: load, listSummaries, listCategories, listSellers, getProductDetail, getSellerDetail };
}
