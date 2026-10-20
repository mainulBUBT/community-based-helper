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
  if (typeof value === "number") return value > 0 ? Math.round(value) : null;
  if (typeof value !== "string") return null;
  const ascii = value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  const match = /\d[\d,]*(?:\.\d+)?/.exec(ascii);
  if (!match) return null;
  const n = Math.round(Number(match[0].replace(/,/g, "")));
  return n > 0 ? n : null;
}

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

function fromJsonLd(html: string): Quote | null {
  for (const product of products(html)) {
    for (const raw of ([] as unknown[]).concat(product.offers ?? [])) {
      const offer = raw as Record<string, unknown>;
      const price = toTaka(offer.price ?? offer.lowPrice);
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
  }
  return null;
}

function fromItemprop(html: string): Quote | null {
  const price = toTaka(metaContent(html, "price") ?? /itemprop=["']price["'][^>]*>([^<]+)/i.exec(html)?.[1]);
  if (!price) return null;
  const availability = /itemprop=["']availability["'][^>]*(?:href|content)=["']([^"']+)/i.exec(html)?.[1];
  return { price, oldPrice: null, inStock: stock(availability), title: null, via: "itemprop" };
}

function fromOpenGraph(html: string): Quote | null {
  const price = toTaka(metaContent(html, "product:price:amount") ?? metaContent(html, "og:price:amount"));
  if (!price) return null;
  return { price, oldPrice: null, inStock: stock(metaContent(html, "product:availability")), title: null, via: "og" };
}

export function structuredQuote(html: string): Quote | null {
  const quote = fromJsonLd(html) ?? fromItemprop(html) ?? fromOpenGraph(html);
  if (quote && !quote.image) quote.image = metaContent(html, "og:image");
  return quote;
}
