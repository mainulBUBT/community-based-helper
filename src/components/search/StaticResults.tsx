import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import type { Messages } from "@/i18n/bn";
import type { ProductSummary } from "@/types/catalog";
import { toBnDigits } from "@/utils/format";

interface StaticResultsProps {
  t: Messages;
  prefix: string;
  title: string;
  summaries: ProductSummary[];
}

// ফিল্টার ব্রাউজারে চালু হওয়ার আগের স্ট্যাটিক HTML: শিরোনাম আর প্রথম পাতার পণ্য, যাতে খোঁজার ইঞ্জিন লিস্টটা দেখে
export function StaticResults({ t, prefix, title, summaries }: StaticResultsProps) {
  const count = String(summaries.length);
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-dim">
        <Link href={`${prefix}/`} className="hover:text-brand">
          {t.nav.home}
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="text-ink">{title}</span>
      </nav>
      <div className="flex items-baseline justify-between gap-3 rounded-lg bg-surface px-4 py-3 ring-1 ring-line">
        <h1 className="truncate text-lg font-bold">{title}</h1>
        <span className="shrink-0 text-xs text-dim">{t.search.count(prefix ? count : toBnDigits(count))}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {summaries.slice(0, 24).map((summary) => (
          <ProductCard key={summary.product.id} summary={summary} />
        ))}
      </div>
    </div>
  );
}
