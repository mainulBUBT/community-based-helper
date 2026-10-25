import type { Metadata } from "next";
import { ProductPage, productMetadata, productParams } from "@/app/(site)/product/[slug]/ProductRoute";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export const generateStaticParams = productParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return productMetadata((await params).slug, "en");
}

export default async function Page({ params }: Props) {
  return <ProductPage slug={(await params).slug} lang="en" />;
}
