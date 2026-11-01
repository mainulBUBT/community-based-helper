import type { Metadata } from "next";
import { BudgetPage, budgetMetadata, budgetParams } from "@/app/(site)/category/BudgetRoute";

interface Props {
  params: Promise<{ slug: string; budget: string }>;
}

export const dynamicParams = false;

export const generateStaticParams = budgetParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, budget } = await params;
  return budgetMetadata(slug, budget, "en");
}

export default async function Page({ params }: Props) {
  const { slug, budget } = await params;
  return <BudgetPage slug={slug} budget={budget} lang="en" />;
}
