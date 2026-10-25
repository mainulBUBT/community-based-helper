"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { PriceAlertToggle } from "@/components/product/PriceAlertToggle";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useI18n } from "@/hooks/useI18n";
import { useSaved } from "@/hooks/useSaved";
import { listSummaries } from "@/services/catalog";

export function SavedView() {
  const { t, prefix } = useI18n();
  const { slugs } = useSaved();
  const { data, error, loading, reload } = useAsync(listSummaries, []);
  const saved = slugs.map((slug) => data?.find((s) => s.product.slug === slug)).filter((s) => s !== undefined);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">{t.saved.title}</h1>
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error && !data ? (
        <ErrorNotice onRetry={reload} />
      ) : saved.length === 0 ? (
        <EmptyState icon={Bookmark} title={t.saved.empty}>
          <p className="max-w-xs text-sm text-dim">{t.saved.hint}</p>
          <Link href={`${prefix}/search/`} className="mt-1 flex h-11 items-center rounded-md bg-brand px-5 font-bold text-brand-ink">
            {t.saved.cta}
          </Link>
        </EmptyState>
      ) : (
        <>
          <PriceAlertToggle slugs={saved.map((s) => s.product.slug)} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {saved.map((summary) => (
              <ProductCard key={summary.product.id} summary={summary} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
