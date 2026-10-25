import type { Metadata } from "next";
import { CategoryPage, categoryMetadata, categoryParams } from "@/app/(site)/category/CategoryRoute";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export const generateStaticParams = categoryParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return categoryMetadata((await params).slug, "en");
}

export default async function Page({ params }: Props) {
  return <CategoryPage slug={(await params).slug} lang="en" />;
}
