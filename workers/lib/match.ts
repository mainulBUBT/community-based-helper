export interface CatalogVariant {
  id: string;
  label: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  variants: CatalogVariant[];
}

export type Match =
  | { kind: "sure"; product: CatalogProduct; variant: CatalogVariant }
  | { kind: "ambiguous"; product: CatalogProduct; variants: CatalogVariant[] };

const MODIFIERS = new Set(["pro", "max", "plus", "ultra", "mini", "lite", "fe", "fold", "flip", "edge", "air", "neo", "se", "prime", "power", "turbo", "4g", "5g"]);
const ACCESSORIES = /\b(for|case|cover|protector|glass|film|charger|adapter|cable|strap|skin|holder|stand|pouch|sleeve|lens|tempered|magsafe|airtag|earbuds?|headphones?|keyboard|mouse|pencil|dock|hub|refurbished|used)\b/;
const SIZE = /^\d+(gb|tb|mm)$/;

export function tokens(text: string): string[] {
  const prepared = text
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/(\d+)\s*(?:gb)?\s*\/\s*(\d+)\s*(gb|tb)/g, "$1gb $2$3")
    .replace(/(\d+)\s*(gb|tb|mm)\b/g, " $1$2 ");
  return prepared
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .flatMap((t) => (SIZE.test(t) ? [t] : t.split(/(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z]{2,})/)));
}

function productFits(listing: Set<string>, product: CatalogProduct): boolean {
  const name = tokens(product.name);
  const brand = new Set(tokens(product.brand));
  if (!name.every((t) => listing.has(t))) return false;
  const own = new Set([...name, ...brand]);
  return ![...listing].some((t) => MODIFIERS.has(t) && !own.has(t));
}

function sizes(list: Iterable<string>) {
  return [...list].filter((t) => SIZE.test(t));
}

function variantFits(listing: Set<string>, variant: CatalogVariant): "yes" | "no" | "maybe" {
  const own = tokens(variant.label);
  const listingSizes = sizes(listing);
  const ownSizes = sizes(own);
  if (listingSizes.some((s) => s.endsWith("mm") && ownSizes.some((o) => o.endsWith("mm")) && !ownSizes.includes(s))) return "no";
  if (ownSizes.some((s) => !listing.has(s))) return listingSizes.length ? "no" : "maybe";
  return own.every((t) => listing.has(t)) ? "yes" : "maybe";
}

export function isAccessory(title: string): boolean {
  return ACCESSORIES.test(title.toLowerCase());
}

export function matchListing(title: string, catalog: CatalogProduct[]): Match | null {
  if (isAccessory(title)) return null;
  const listing = new Set(tokens(title));
  const products = catalog
    .filter((p) => productFits(listing, p))
    .sort((a, b) => tokens(b.name).length - tokens(a.name).length);
  const product = products[0];
  if (!product || product.variants.length === 0) return null;
  const verdicts = product.variants.map((v) => ({ v, fit: variantFits(listing, v) }));
  const yes = verdicts.filter((x) => x.fit === "yes");
  const maybe = verdicts.filter((x) => x.fit === "maybe");
  if (yes.length === 1) return { kind: "sure", product, variant: yes[0].v };
  if (yes.length === 0 && maybe.length === 1 && product.variants.length === 1) return { kind: "sure", product, variant: maybe[0].v };
  const open = [...yes, ...maybe].map((x) => x.v);
  return open.length ? { kind: "ambiguous", product, variants: open } : null;
}
