export interface CatalogVariant {
  id: string;
  label: string;
  sku?: string | null;
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
// পণ্যের ধরন বোঝানো শব্দ: লিস্টিংয়ে থাকলে পণ্যটা এই ক্যাটাগরির হতে হবে ("Nord Buds 4" ইয়ারবাড, Nord 4 ফোন নয়)।
// "monitor", "speaker" নেই: ঘড়ির "Heart Rate Monitor", পিসির "with Monitor", ফোনের "Dual Speaker" এ সঠিক পণ্য বাদ পড়ত
const AUDIO = ["audio", "earbuds", "headphones"];
const KINDS = new Map<string, string[]>(
  Object.entries({
    buds: AUDIO,
    earbud: AUDIO,
    earbuds: AUDIO,
    earphone: AUDIO,
    earphones: AUDIO,
    headphone: AUDIO,
    headphones: AUDIO,
    headset: AUDIO,
    neckband: AUDIO,
    watch: ["watch"],
    smartwatch: ["watch"],
    tab: ["tablet"],
    tablet: ["tablet"],
    pad: ["tablet"],
    laptop: ["laptop"],
    notebook: ["laptop"],
    router: ["router"],
  }),
);
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

// "A6" ভেঙে "a 6" হয় যাতে "Watch8" আর "Watch 8" মেলে; কিন্তু ভাঙা অংশ লিস্টিংয়ে পাশাপাশি থাকতে হবে, নইলে "A54 6/128" এ A6 মিলে যায়
function glued(name: string): string[][] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => tokens(word))
    .filter((parts) => parts.length > 1);
}

const adjacent = (list: string[], parts: string[]) => list.some((_, i) => parts.every((part, j) => list[i + j] === part));

// "with free Buds", "+ Gift" এর পরের অংশ উপহারের, "for Apple Watch" এর পরেরটা কোন যন্ত্রের জন্য — পণ্যের ধরন বোঝায় না
const BUNDLE = /\b(?:with|free|gift|combo|bundle|for)\b|\+\s*free/i;
// এদের নামে "Laptop", "Watch" থাকে কোন যন্ত্রের জন্য সেটা বোঝাতে ("Anker 140W Laptop Charger", "Watch Charger"), ধরন নয়
const FOR_DEVICE = new Set(["charger", "fan", "powerbank"]);

// সিরিজ বা লাইনআপের পাতায় কয়েকটা মডেল একসাথে ("iPhone 17 Series Price"), কোনো একটা পণ্যের দাম নয়।
// "Series" এর পরে মডেল থাকলে সেটা একটা পণ্যেরই নাম ("Watch Series 11", "Watch Series SE")
export const MULTI_MODEL = /\b(?:series(?!\s*(?:\d|se\b))|lineup|line-up|all models)\b/i;

// part number (B7NY9PT, PPADM20S, SM-A576): চিহ্ন বাদে হুবহু থাকলে সেটাই প্রমাণ। ভুল করে "8GB/256GB",
// "Standard" বা "2026" বসালে হাজারো লিস্টিংয়ে মিলে অন্য পণ্য বাদ দিত, তাই অক্ষর আর সংখ্যা দুটোই লাগে, শুধু স্পেক হলে চলে না
const compact = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const SPEC_ONLY = /^(?:\d+(?:gb|tb|mm|ml|g|kg|w|mah|hz|inch)?|[45]g|gb|tb|mm|ml|g|kg|w|mah|hz|inch)$/;

export function usableCode(sku?: string | null): string | null {
  const code = sku ? compact(sku) : "";
  if (code.length < 5 || !/[a-z]/.test(code) || !/\d/.test(code)) return null;
  return tokens(sku!).every((t) => SPEC_ONLY.test(t)) ? null : code;
}

// কোডটা কোনো শব্দের শুরু থেকে হতে হবে ("SM-A576" মেলে "SM-A576B" তে, কিন্তু "XA2692" এর ভেতরের "A2692" নয়)
export function hasCode(text: string, sku?: string | null): boolean {
  const code = usableCode(sku);
  if (!code) return false;
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return words.some((_, i) => words.slice(i).join("").startsWith(code));
}

const BRAND_STOP = new Set(["by", "and", "the", "&", "co"]);

export function brandTokens(brand: string): string[] {
  return tokens(brand).filter((t) => !BRAND_STOP.has(t));
}

// যন্ত্রের নামের ঠিক পরের খালি সংখ্যা প্রজন্ম বা মডেল: "iPad mini 5" ≠ iPad mini (A17 Pro), "MatePad 12 X" ≠ MatePad 11.5"।
// নামে, ভার্সনে (8GB → 8) বা ইঞ্চিতে থাকা সংখ্যা, আর পরে একক (5000 mAh) থাকলে নয়
const GENERATIONAL = new Set(["mobile", "tablet", "laptop", "watch", "audio", "earbuds", "headphones"]);
const UNIT = /^(?:mah|hz|db|w|v|nits?|mp|cm|mm|inch|gb|tb)$/;

function otherModel(title: string, ordered: string[], required: string[], product: CatalogProduct): boolean {
  if (!GENERATIONAL.has(product.category ?? "")) return false;
  const at = Math.max(...required.map((t) => ordered.indexOf(t))) + 1;
  const next = ordered[at];
  if (!next || !/^\d{1,3}$/.test(next) || UNIT.test(ordered[at + 1] ?? "") || inch(title) === Number(next)) return false;
  const known = [product.name, ...product.variants.map((v) => v.label)].flatMap(tokens).map((t) => t.replace(/(gb|tb|mm)$/, ""));
  return !known.includes(next);
}

// ইঞ্চি আর বন্ধনীর চিপ নামের অংশ হলেও দোকানের লিংকে প্রায়ই থাকে না, তাই এগুলো বাধ্যতামূলক নয়, শুধু অমিল হলে বাদ
function productFits(title: string, ordered: string[], product: CatalogProduct, rivals: Set<string>): boolean {
  const listing = new Set(ordered);
  const name = product.name.replace(INCH, " ").replace(/\([^)]*\)/g, " ");
  const required = tokens(name);
  if (!required.every((t) => listing.has(t))) return false;
  if (!glued(name).every((parts) => adjacent(ordered, parts))) return false;
  if (otherModel(title, ordered, required, product)) return false;
  const own = brandTokens(product.brand);
  const hasBrand = own.length > 0 && own.some((t) => listing.has(t));
  // লিস্টিংয়ে অন্য ব্র্যান্ডের নাম থাকলে পাতাটা ওঁদেরই — "Realme Buds 2" এই "Buds 2" নয়
  if (!hasBrand && own.length > 0 && [...listing].some((t) => rivals.has(t))) return false;
  // ছোট নাম ("Buds 2") কটন-বাডস পর্যন্ত মিলে ফেলে — ব্র্যান্ডের নাম পাতায় থাকতেই হবে
  if (own.length > 0 && required.length <= 2 && !hasBrand) return false;
  const labels = new Set([product.name, product.brand, ...product.variants.map((v) => v.label)].flatMap(tokens));
  if ([...listing].some((t) => MODIFIERS.has(t) && !labels.has(t))) return false;
  const head = FOR_DEVICE.has(product.category ?? "") ? [] : tokens(title.split(BUNDLE)[0]);
  if (head.some((t) => KINDS.has(t) && !labels.has(t) && !KINDS.get(t)!.includes(product.category ?? ""))) return false;
  if (MULTI_MODEL.test(title) && !MULTI_MODEL.test(product.name)) return false;
  return sameSpec(title, product.name);
}

// চার্জার-ফ্যান এখন নিজেরাই ক্যাটাগরি — ওদের লিস্টিং accessory-ফাঁদ নয়
const GADGET_CATEGORIES = new Set(["charger", "fan"]);

// লিস্টিংয়ে কোনো ভার্সনের part number থাকলে শুধু সেই পণ্য; অন্য পণ্যের নাম মিললেও নয়
export function findProducts<T extends CatalogProduct>(title: string, catalog: T[]): T[] {
  const accessory = isAccessory(title);
  const listing = tokens(title);
  const brands = new Map(catalog.map((p) => [p.brand, brandTokens(p.brand)]));
  const fit = catalog.filter((p) => {
    if (accessory && !GADGET_CATEGORIES.has(p.category ?? "")) return false;
    const own = brands.get(p.brand) ?? [];
    const rivals = new Set([...brands.values()].flat().filter((t) => !own.includes(t)));
    return productFits(title, listing, p, rivals);
  });
  const coded = catalog.filter((p) => p.variants.some((v) => hasCode(title, v.sku)));
  if (coded.length) return fit.filter((p) => coded.includes(p));
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
  const coded = product.variants.filter((v) => hasCode(title, v.sku));
  if (coded.length === 1) return { kind: "sure", product, variant: coded[0] };
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
