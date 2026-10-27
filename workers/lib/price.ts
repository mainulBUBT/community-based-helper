import { jsonLd, metaContent } from "./html";

export interface Quote {
  price: number;
  oldPrice: number | null;
  inStock: boolean | null;
  title: string | null;
  image?: string | null;
  via: string;
}

function imageOf(value: unknown): string | null {
  if (typeof value === "string") return value || null;
  if (Array.isArray(value)) return imageOf(value[0]);
  if (value && typeof value === "object") return imageOf((value as Record<string, unknown>).url);
  return null;
}

export function toTaka(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  if (typeof value !== "string") return null;
  const ascii = value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  const match = /\d[\d,]*(?:\.\d+)?/.exec(ascii);
  if (!match) return null;
  const n = Math.round(Number(match[0].replace(/,/g, "")));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// দাম টাকায় না হলে (USD ইত্যাদি) সেই অংক নেওয়া হয় না
const inTaka = (currency: unknown) => currency == null || currency === "" || /^(BDT|TK|৳)$/i.test(String(currency).trim());

function stock(value: unknown): boolean | null {
  if (typeof value !== "string") return null;
  if (/InStock|PreOrder|LimitedAvailability|In Stock/i.test(value)) return true;
  if (/OutOfStock|SoldOut|Discontinued/i.test(value)) return false;
  return null;
}

function walk(node: unknown, visit: (obj: Record<string, unknown>) => void) {
  if (Array.isArray(node)) node.forEach((n) => walk(n, visit));
  else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    visit(obj);
    for (const value of Object.values(obj)) walk(value, visit);
  }
}

function isType(obj: Record<string, unknown>, type: string) {
  const t = obj["@type"];
  return t === type || (Array.isArray(t) && t.includes(type));
}

function products(html: string): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  for (const doc of jsonLd(html)) walk(doc, (obj) => isType(obj, "Product") && found.push(obj));
  return found;
}

// পাতার প্রথম দাম-সহ Product টাই মূল পণ্য; পরেরগুলো সাধারণত পাশের "সম্পর্কিত পণ্য"
function mainProduct(html: string): Record<string, unknown> | null {
  return products(html).find((product) => product.offers != null) ?? null;
}

function fromJsonLd(product: Record<string, unknown>): Quote | null {
  for (const raw of ([] as unknown[]).concat(product.offers ?? [])) {
    const offer = raw as Record<string, unknown>;
    if (!inTaka(offer.priceCurrency)) continue;
    const price = toTaka(offer.price) ?? toTaka(offer.lowPrice);
    if (!price) continue;
    const spec = ([] as unknown[]).concat(offer.priceSpecification ?? []) as Record<string, unknown>[];
    const oldPrice = toTaka(spec.find((s) => String(s.priceType ?? "").includes("StrikethroughPrice"))?.price);
    return {
      price,
      oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
      inStock: stock(offer.availability),
      title: typeof product.name === "string" ? product.name : null,
      image: imageOf(product.image),
      via: "json-ld",
    };
  }
  return null;
}

function fromItemprop(html: string): Quote | null {
  const priceTag = /itemprop=["']price["'][^>]*/i.exec(html)?.[0];
  const content = priceTag && /content=["']([^"']+)/i.exec(priceTag)?.[1];
  const price = toTaka(content ?? metaContent(html, "price") ?? /itemprop=["']price["'][^>]*>([^<]+)/i.exec(html)?.[1]);
  if (!price) return null;
  const availability = /itemprop=["']availability["'][^>]*(?:href|content)=["']([^"']+)/i.exec(html)?.[1];
  return { price, oldPrice: null, inStock: stock(availability), title: null, via: "itemprop" };
}

function fromOpenGraph(html: string): Quote | null {
  if (!inTaka(metaContent(html, "product:price:currency") ?? metaContent(html, "og:price:currency"))) return null;
  const price = toTaka(metaContent(html, "product:price:amount") ?? metaContent(html, "og:price:amount"));
  if (!price) return null;
  return { price, oldPrice: null, inStock: stock(metaContent(html, "product:availability")), title: null, via: "og" };
}

// মূল পণ্য নিজেই স্পষ্ট দাম ০ বললে (Global Brand এর "0.00", দাম ঘোষণা হয়নি) পাতার অন্য অংক পাশের পণ্যের — তখন দাম নেই।
// দাম খালি বা অন্য মুদ্রায় হলে সেটা "দাম নেই" নয়, পাতার itemprop/og থেকে আগের মতো পড়া হয়
export function declaresNoPrice(html: string): boolean {
  const main = mainProduct(html);
  if (!main || fromJsonLd(main)) return false;
  const offers = ([] as unknown[]).concat(main.offers ?? []) as Record<string, unknown>[];
  return offers.some((offer) => [offer.price, offer.lowPrice].some((value) => value !== undefined && value !== null && value !== "" && Number(value) === 0));
}

export function structuredQuote(html: string): Quote | null {
  const main = mainProduct(html);
  const quote = (main ? fromJsonLd(main) : null) ?? (declaresNoPrice(html) ? null : (fromItemprop(html) ?? fromOpenGraph(html)));
  if (quote && !quote.image) quote.image = metaContent(html, "og:image");
  return quote;
}
