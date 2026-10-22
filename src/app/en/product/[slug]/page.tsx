import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/app/(site)/product/[slug]/ProductView";
import { SITE_URL } from "@/config/site";
import { enMeta } from "@/lib/en-meta";
import { getProductDetail, getSiteSettings, loadCatalog } from "@/services/catalog.server";
import { formatTaka } from "@/utils/format";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const { products } = await loadCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getProductDetail((await params).slug);
  if (!detail) return {};
  const { product, offers } = detail;
  const title = `${product.brand} ${product.name} Price`;
  const lowest = offers[0]?.price;
  const description = lowest
    ? `${product.brand} ${product.name} is now available from ${formatTaka(lowest)}. Compare prices from ${offers.length} stores.`
    : `See how much the ${product.brand} ${product.name} costs at stores in Bangladesh.`;
  return enMeta({ title, description, path: `/en/product/${product.slug}/`, settings: await getSiteSettings() });
}

export default async function EnProductPage({ params }: Props) {
  const detail = await getProductDetail((await params).slug);
  if (!detail) notFound();
  const { nameEn, name } = await getSiteSettings();
  const { product, offers } = detail;
  const prices = offers.map((o) => o.price);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name}`,
    brand: { "@type": "Brand", name: product.brand },
    url: `${SITE_URL}/en/product/${product.slug}/`,
    ...(prices.length && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "BDT",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: offers.length,
        seller: { "@type": "Organization", name: nameEn || name },
      },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductView initial={detail} />
    </>
  );
}
