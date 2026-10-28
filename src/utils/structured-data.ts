import { SITE_URL } from "@/config/site";
import type { OfferView, Product } from "@/types/catalog";

const absolute = (path: string) => new URL(path, SITE_URL).href;

export function productData(product: Product, offers: OfferView[], path: string, description: string, alternateName: string | null = null) {
  const available = offers.filter((o) => o.inStock !== false);
  const prices = (available.length ? available : offers).map((o) => o.price);
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
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
}
