"use client";

import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/hooks/useI18n";
import type { Alternative } from "@/types/catalog";
import { ProductCard } from "./ProductCard";

export function AlternativeCard({ alternative }: { alternative: Alternative }) {
  const { t } = useI18n();
  const label = alternative.specLabel || t.product.similarType;
  return <ProductCard summary={alternative.summary} badge={<Badge tone="neutral">{label}</Badge>} />;
}
