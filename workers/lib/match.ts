export interface CatalogVariant {
  id: string;
  label: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  category?: string | null;
  variants: CatalogVariant[];
}

export type Match =
  | { kind: "sure"; product: CatalogProduct; variant: CatalogVariant }
  | { kind: "ambiguous"; product: CatalogProduct; variants: CatalogVariant[] };

const MODIFIERS = new Set(["pro", "max", "plus", "ultra", "mini", "lite", "fe", "fold", "flip", "edge", "air", "neo", "se", "prime", "power", "turbo", "4g", "5g"]);
const ACCESSORIES = /\b(for|case|cover|protector|glass|film|charger|adapter|cable|strap|skin|holder|stand|pouch|sleeve|lens|tempered|magsafe|airtag|keyboard|mouse|pencil|dock|hub|shockproof|bumper|airbag|privacy|holster|wallet|refurbished|used)\b/;
const INCH = /(\d{1,2}(?:\.\d{1,2})?)\s*(?:["”]|''|-?\s*inch)/i;
const CHIP = /\b(m\d|a1\d)(?:[\s-]+(pro|max|ultra))?\b/i;
export const SIZE = /^\d+(gb|tb|mm)$/;
const COLORS = new Set(["black", "white", "blue", "green", "red", "purple", "pink", "gold", "silver", "graphite", "sage", "tan", "orange", "yellow", "gray", "grey", "midnight", "starlight", "titanium", "cream", "lavender", "mint", "cyan"]);

export function tokens(text: string): string[] {
  const prepared = text
    .toLowerCase()
    .replace(/\bwi[\s-]?fi\b/g, "wifi")
    .replace(/\b(wifi|gps)\s*(?:\+|plus|and|&)\s*(?:cellular|cell|lte)\b/g, "$1 cellular")
    .replace(/(\d+)\s*(?:gb|tb)?\s*\+\s*(\d+)\s*(?:gb|tb)?/g, "$1gb $2gb")
    .replace(/\+/g, " plus ")
    .replace(/(\d+)\s*(?:gb)?\s*\/\s*(\d+)\s*(gb|tb)/g, "$1gb $2$3")
    .replace(/(\d+)\s*(gb|tb|mm)\b/g, " $1$2 ");
  return prepared
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .flatMap((t) => (SIZE.test(t) ? [t] : t.split(/(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z]{2,})/)));
}

export function inch(text: string): number | null {
  const size = INCH.exec(text)?.[1];
  return size ? Math.floor(Number(size)) : null;
}

export function chip(text: string): string | null {
  const found = CHIP.exec(text);
  return found ? `${found[1]} ${found[2] ?? ""}`.trim().toLowerCase() : null;
}

export function sameSpec(a: string, b: string): boolean {
  return [inch, chip].every((read) => {
    const x = read(a);
    const y = read(b);
    return x === null || y === null || x === y;
  });
}

const BRAND_STOP = new Set(["by", "and", "the", "&", "co"]);

export function brandTokens(brand: string): string[] {
  return tokens(brand).filter((t) => !BRAND_STOP.has(t));
}

// ইঞ্চি আর বন্ধনীর চিপ নামের অংশ হলেও দোকানের লিংকে প্রায়ই থাকে না, তাই এগুলো বাধ্যতামূলক নয়, শুধু অমিল হলে বাদ
function productFits(title: string, listing: Set<string>, product: CatalogProduct, rivals: Set<string>): boolean {
  const required = tokens(product.name.replace(INCH, " ").replace(/\([^)]*\)/g, " "));
  if (!required.every((t) => listing.has(t))) return false;
  const own = brandTokens(product.brand);
  const hasBrand = own.length > 0 && own.some((t) => listing.has(t));
  // লিস্টিংয়ে অন্য ব্র্যান্ডের নাম থাকলে পাতাটা ওঁদেরই — "Realme Buds 2" এই "Buds 2" নয়
  if (!hasBrand && own.length > 0 && [...listing].some((t) => rivals.has(t))) return false;
  // ছোট নাম ("Buds 2") কটন-বাডস পর্যন্ত মিলে ফেলে — ব্র্যান্ডের নাম পাতায় থাকতেই হবে
  if (own.length > 0 && required.length <= 2 && !hasBrand) return false;
  const labels = new Set([product.name, product.brand, ...product.variants.map((v) => v.label)].flatMap(tokens));
  if ([...listing].some((t) => MODIFIERS.has(t) && !labels.has(t))) return false;
  return sameSpec(title, product.name);
}

// চার্জার-ফ্যান এখন নিজেরাই ক্যাটাগরি — ওদের লিস্টিং accessory-ফাঁদ নয়
const GADGET_CATEGORIES = new Set(["charger", "fan"]);

export function findProducts(title: string, catalog: CatalogProduct[]): CatalogProduct[] {
  const accessory = isAccessory(title);
  const listing = new Set(tokens(title));
  const brands = new Map(catalog.map((p) => [p.brand, brandTokens(p.brand)]));
  const fit = catalog.filter((p) => {
    if (accessory && !GADGET_CATEGORIES.has(p.category ?? "")) return false;
    const own = brands.get(p.brand) ?? [];
    const rivals = new Set([...brands.values()].flat().filter((t) => !own.includes(t)));
    return productFits(title, listing, p, rivals);
  });
  const best = Math.max(...fit.map((p) => tokens(p.name).length));
  return fit.filter((p) => tokens(p.name).length === best);
}

function sizes(list: Iterable<string>) {
  return [...list].filter((t) => SIZE.test(t));
}

function colors(list: Iterable<string>) {
  return [...list].filter((t) => COLORS.has(t));
}

function variantFits(listing: Set<string>, variant: CatalogVariant): "yes" | "no" | "maybe" {
  const own = tokens(variant.label);
  const listingSizes = sizes(listing);
  const ownSizes = sizes(own);
  if (listingSizes.some((s) => s.endsWith("mm") && ownSizes.some((o) => o.endsWith("mm")) && !ownSizes.includes(s))) return "no";
  if (ownSizes.some((s) => !listing.has(s))) return listingSizes.length ? "no" : "maybe";
  const listingColors = colors(listing);
  const ownColors = colors(own);
  if (ownColors.some((c) => !listing.has(c))) return listingColors.length ? "no" : "maybe";
  return own.every((t) => listing.has(t)) ? "yes" : "maybe";
}

export function isAccessory(title: string): boolean {
  return ACCESSORIES.test(title.toLowerCase());
}

export function matchListing(title: string, catalog: CatalogProduct[]): Match | null {
  const products = findProducts(title, catalog);
  const product = products.length === 1 ? products[0] : null;
  if (!product || product.variants.length === 0) return null;
  const listing = new Set(tokens(title));
  const verdicts = product.variants.map((v) => ({ v, fit: variantFits(listing, v) }));
  // "128GB Wi-Fi" আর "128GB Wi-Fi + Cellular" দুটোই মিললে বেশি নির্দিষ্টটা
  const fits = verdicts.filter((x) => x.fit === "yes");
  const most = Math.max(...fits.map((x) => tokens(x.v.label).length));
  const yes = fits.filter((x) => tokens(x.v.label).length === most);
  const maybe = verdicts.filter((x) => x.fit === "maybe");
  if (yes.length === 1) return { kind: "sure", product, variant: yes[0].v };
  if (yes.length === 0 && maybe.length === 1 && product.variants.length === 1) return { kind: "sure", product, variant: maybe[0].v };
  const open = [...yes, ...maybe].map((x) => x.v);
  return open.length ? { kind: "ambiguous", product, variants: open } : null;
}
