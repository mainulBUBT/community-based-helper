import { SITE_URL } from "@/config/site";
import type { OfferView, Product, Seller } from "@/types/catalog";

const absolute = (path: string) => new URL(path, SITE_URL).href;

const validUntil = () => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

export function productData(product: Product, offers: OfferView[], path: string, description: string, alternateName: string | null = null) {
  const available = offers.filter((o) => o.inStock !== false);
  const shown = available.length ? available : offers;
  const prices = shown.map((o) => o.price);
  const priceValidUntil = validUntil();
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name}`,
    description: description.slice(0, 5000),
    ...(alternateName && { alternateName }),
    brand: { "@type": "Brand", name: product.brand },
    url: absolute(path),
    ...(product.images?.length && { image: product.images.slice(0, 4).map(absolute) }),
    ...(prices.length && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "BDT",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: offers.length,
        availability: available.length ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        offers: shown.slice(0, 20).map((o) => ({
          "@type": "Offer",
          price: o.price,
          priceCurrency: "BDT",
          availability: o.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          priceValidUntil,
          url: o.url || absolute(path),
          seller: { "@type": "Organization", name: o.seller.name },
        })),
      },
    }),
  };
}

export function breadcrumbData(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absolute(item.path) })),
  };
}

export function itemListData(products: Product[], prefix: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absolute(`${prefix}/product/${p.slug}/`), name: `${p.brand} ${p.name}` })),
  };
}

// হোমে: সাইটের নাম আর Google এর সাইট-সার্চ বক্সের জন্য খোঁজার ঠিকানা
export function websiteData(name: string, prefix: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name,
      url: absolute(`${prefix}/`),
      potentialAction: { "@type": "SearchAction", target: `${absolute(`${prefix}/search/`)}?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
    { "@context": "https://schema.org", "@type": "Organization", name, url: absolute("/"), logo: absolute("/icons/icon-512.png") },
  ];
}

export function faqData(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function sellerData(seller: Seller, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: seller.name,
    url: absolute(path),
    ...(seller.logo && { image: absolute(seller.logo) }),
    ...(seller.website && { sameAs: seller.website }),
    ...(seller.phone && { telephone: seller.phone }),
    ...(seller.area && { address: { "@type": "PostalAddress", addressLocality: seller.area, addressCountry: "BD" } }),
  };
}
