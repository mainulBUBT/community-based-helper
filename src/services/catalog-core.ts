import { findCheaperAlternatives } from "@/utils/alternatives";
import { byPrice, byStock } from "@/utils/catalog";
import { isReplica } from "@/utils/categories";
import type { SiteSettings } from "@/types/admin";
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
    .sort((a, b) => byStock(a, b) || byPrice(a, b));
}

// কার্ডের দাম সব ধরন মিলিয়ে সবচেয়ে কম, স্টকে থাকা দোকান থেকে; কোথাও স্টক না থাকলে তবেই সব দোকান থেকে
function cardOffer(catalog: Catalog, product: Product) {
  const variantIds = new Set(product.variants.map((v) => v.id));
  const offers = catalog.offers.filter((o) => variantIds.has(o.variantId));
  const available = offers.filter((o) => o.inStock !== false);
  const pool = available.length ? available : offers;
  const best = pool.length ? pool.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  return { offers, best };
}

export function summarize(catalog: Catalog, product: Product): ProductSummary {
  const { offers, best } = cardOffer(catalog, product);
  const lowest = best?.price ?? null;
  const warranty = catalog.categories.find((c) => c.slug === product.category)?.warranty !== false;
  // আনঅফিসিয়াল বা কপির দামের পাশে অফিসিয়াল দাম দেখিয়ে "ছাড়" বলা যায় না
  const listed = best && (warranty ? best.condition === "official" : !isReplica(best.condition));
  const listPrice = listed ? product.variants.find((v) => v.id === best.variantId)?.officialPrice : null;
  const reference = Math.max(best?.oldPrice ?? 0, listPrice ?? 0);
  const compareAt = lowest && reference > lowest ? reference : null;
  return {
    product,
    lowest,
    condition: best?.condition ?? null,
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

export interface ComparePick {
  summary: ProductSummary;
  offers: OfferView[];
  variantLabel: string;
}

export interface HomeData {
  summaries: ProductSummary[];
  sellers: Seller[];
  settings: SiteSettings;
  comparisons: ComparePick[];
}

export type CatalogLoader = (fresh?: boolean) => Promise<Catalog>;
export type HistoryLoader = (offerIds: string[]) => Promise<PricePoint[]>;

// হোম পেজের "লাইভ তুলনা" কার্ডের জন্য: একই ভ্যারিয়েন্ট, দোকান সবচেয়ে বেশি যেখানে আছে।
export function pickComparisons(catalog: Catalog, limit = 6): ComparePick[] {
  const sellers = new Map(catalog.sellers.map((s) => [s.id, s]));
  const variantOwner = new Map<string, string>();
  for (const product of catalog.products) {
    for (const variant of product.variants) variantOwner.set(variant.id, product.id);
  }

  // ভ্যারিয়েন্ট অনুযায়ী দোকান আলাদা করি — ভিন্ন ভ্যারিয়েন্টের দাম তুলনা করা ঠিক নয়।
  const byVariant = new Map<string, Map<string, Offer>>();
  for (const offer of catalog.offers) {
    if (!sellers.has(offer.sellerId)) continue;
    if (!variantOwner.has(offer.variantId)) continue;
    let perSeller = byVariant.get(offer.variantId);
    if (!perSeller) {
      perSeller = new Map();
      byVariant.set(offer.variantId, perSeller);
    }
    const kept = perSeller.get(offer.sellerId);
    if (!kept || offer.price < kept.price) perSeller.set(offer.sellerId, offer);
  }

  const groups = [...byVariant.entries()]
    .filter(([, perSeller]) => perSeller.size > 1)
    .map(([variantId, perSeller]) => {
      const productId = variantOwner.get(variantId)!;
      const product = catalog.products.find((p) => p.id === productId)!;
      const offers = [...perSeller.values()];
      return { variantId, product, offers: viewOffers(catalog, offers) };
    });

  // একই পণ্যের একাধিক ভ্যারিয়েন্ট থাকলে সবচেয়ে বেশি দোকানের ভ্যারিয়েন্টটাই রাখি।
  const byProduct = new Map<string, (typeof groups)[number]>();
  for (const group of groups) {
    const kept = byProduct.get(group.product.id);
    if (!kept || group.offers.length > kept.offers.length) byProduct.set(group.product.id, group);
  }

  return [...byProduct.values()]
    .map((group) => ({
      summary: summarize(catalog, group.product),
      offers: group.offers.slice(0, 4),
      variantLabel:
        group.product.variants.find((v) => v.id === group.variantId)?.label ?? "",
    }))
    .filter((pick) => pick.offers.length > 1 && pick.summary.lowest)
    .sort((a, b) => b.offers.length - a.offers.length)
    .slice(0, limit);
}

// একই API সব উৎসের জন্য: বেক করা JSON (সাইট) আর লাইভ Supabase (অ্যাডমিন) দুটোই এখান থেকে বানে।
export function makeService(load: CatalogLoader, loadHistory: HistoryLoader = () => Promise.resolve([])) {
  const listSummaries = (includeHidden = false) =>
    load().then((catalog) => {
      const visible = new Set(catalog.categories.map((c) => c.slug));
      return catalog.products.filter((p) => includeHidden || visible.has(p.category)).map((product) => summarize(catalog, product));
    });

  const listCategories = () => load().then((catalog) => catalog.categories);
  const listSellers = () => load().then((catalog) => catalog.sellers);
  // কয়েকটা পাঠানো হয়, কোনটা দেখাবে সেটা ব্রাউজার প্রতিবার পাতা খুললে বাছে (static পাতায় build এর বাছাই সবার কাছে এক থাকত)
  const listComparisons = () => load().then((catalog) => pickComparisons(catalog, 12));

  const getProductDetail = async (slug: string): Promise<ProductDetail | null> => {
    const catalog = await load();
    const product = catalog.products.find((p) => p.slug === slug);
    if (!product) return null;
    const variantIds = new Set(product.variants.map((v) => v.id));
    const offers = viewOffers(catalog, catalog.offers.filter((o) => variantIds.has(o.variantId)));
    const category = catalog.categories.find((c) => c.slug === product.category) ?? null;
    const alternatives = buildAlternatives(catalog, product, category);
    // পাতা খোলে কার্ডের দামের ভার্সনে, যাতে কার্ডে যা দেখা গেল ভেতরেও তাই থাকে
    const startVariant = cardOffer(catalog, product).best?.variantId ?? null;
    return { product, category, offers, history: await loadHistory(offers.map((o) => o.id)), alternatives, startVariant };
  };

  const getSellerDetail = async (id: string) => {
    const catalog = await load();
    const seller = catalog.sellers.find((s) => s.id === id);
    if (!seller) return null;
    const variants = new Map(catalog.products.flatMap((p) => p.variants.map((v) => [v.id, { product: p, variant: v }] as const)));
    const listings = catalog.offers
      .filter((o) => o.sellerId === id && variants.has(o.variantId))
      .map((offer) => ({ offer, ...variants.get(offer.variantId)! }))
      .sort((a, b) => byStock(a.offer, b.offer) || b.product.popularity - a.product.popularity);
    return { seller, listings, promos: catalog.promos.filter((p) => p.sellerId === id) };
  };

  return { loadCatalog: load, listSummaries, listCategories, listSellers, listComparisons, getProductDetail, getSellerDetail };
}
