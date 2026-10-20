import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/config/site";
import { getProductDetail, getSiteSettings, loadCatalog } from "@/services/catalog";
import { formatTaka } from "@/utils/format";
import { ProductView } from "./ProductView";

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
  const title = `${product.brand} ${product.name} এর দাম`;
  const lowest = offers[0]?.price;
  const description = lowest
    ? `${product.brand} ${product.name} এখন ${formatTaka(lowest)} থেকে পাওয়া যাচ্ছে। ${offers.length}টা দোকানের দাম পাশাপাশি দেখুন।`
    : `${product.brand} ${product.name} এর দাম বাংলাদেশের দোকানগুলোতে কত, দেখুন।`;
  const url = `/product/${product.slug}/`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}

export default async function ProductPage({ params }: Props) {
  const detail = await getProductDetail((await params).slug);
  if (!detail) notFound();
  const { name } = await getSiteSettings();
  const { product, offers } = detail;
  const prices = offers.map((o) => o.price);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name}`,
    brand: { "@type": "Brand", name: product.brand },
    url: `${SITE_URL}/product/${product.slug}/`,
    ...(prices.length && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "BDT",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: offers.length,
        seller: { "@type": "Organization", name },
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
