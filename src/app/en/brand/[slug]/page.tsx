import type { Metadata } from "next";
import { BrandPage, brandMetadata, brandParams } from "@/app/(site)/brand/BrandRoute";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export const generateStaticParams = brandParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return brandMetadata((await params).slug, "en");
}

export default async function Page({ params }: Props) {
  return <BrandPage slug={(await params).slug} lang="en" />;
}
