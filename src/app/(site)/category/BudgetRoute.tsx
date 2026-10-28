import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { budgetFromSlug, budgetSlug } from "@/config/budgets";
import { messages, pageMeta } from "@/lib/page-meta";
import type { Lang } from "@/lib/preferences";
import { getBudgetPage, listBudgets } from "@/services/catalog.server";
import { categoryName } from "@/utils/categories";
import { formatTaka, toBnDigits } from "@/utils/format";
import { breadcrumbData, itemListData } from "@/utils/structured-data";
import { categoryPath } from "@/utils/url";

export async function budgetParams() {
  return (await listBudgets()).map((b) => ({ slug: b.slug, budget: budgetSlug(b.budget) }));
}

// বাংলায় "২০,০০০ টাকার মধ্যে", English এ "৳20,000"
const amountLabel = (amount: number, lang: Lang) => (lang === "bn" ? formatTaka(amount, lang).replace("৳", "") : formatTaka(amount, lang));
const month = (lang: Lang) => new Date().toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { month: "long", year: "numeric" });
const n = (value: number, lang: Lang) => (lang === "bn" ? toBnDigits(value) : String(value));

async function load(slug: string, budget: string) {
  const amount = budgetFromSlug(budget);
  return amount ? getBudgetPage(slug, amount) : null;
}

export async function budgetMetadata(slug: string, budget: string, lang: Lang): Promise<Metadata> {
  const page = await load(slug, budget);
  if (!page) return {};
  const { seo } = messages(lang);
  const name = categoryName(page.category, lang);
  const amount = amountLabel(page.budget, lang);
  const [title, ...fallbacks] = seo.budgetTitles(amount, name, month(lang));
  const from = Math.min(...page.summaries.map((s) => s.lowest!));
  return pageMeta({
    lang,
    path: `/category/${slug}/${budget}/`,
    title,
    shortTitle: fallbacks,
    description: seo.budgetDescription(amount, name, n(page.summaries.length, lang), formatTaka(from, lang)),
    image: page.summaries[0]?.product.images?.[0],
  });
}

export async function BudgetPage({ slug, budget, lang }: { slug: string; budget: string; lang: Lang }) {
  const page = await load(slug, budget);
  if (!page) notFound();
  const t = messages(lang);
  const prefix = lang === "en" ? "/en" : "";
  const name = categoryName(page.category, lang);
  const amount = amountLabel(page.budget, lang);
  const from = Math.min(...page.summaries.map((s) => s.lowest!));
  const others = (await listBudgets(slug)).filter((b) => b.budget !== page.budget);
  const crumbs = [
    { name: t.nav.home, path: `${prefix}/` },
    { name, path: categoryPath(prefix, slug) },
    { name: t.budget.crumb(amount), path: `${categoryPath(prefix, slug)}${budget}/` },
  ];
  return (
    <div className="flex flex-col gap-4">
      <JsonLd data={[breadcrumbData(crumbs), itemListData(page.summaries.map((s) => s.product), prefix)]} />
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-dim">
        {crumbs.slice(0, -1).map((c) => (
          <span key={c.path} className="flex items-center gap-1">
            <Link href={c.path} className="hover:text-brand">
              {c.name}
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
          </span>
        ))}
        <span className="text-ink">{crumbs.at(-1)!.name}</span>
      </nav>
      <div className="flex flex-col gap-2 rounded-lg bg-surface px-4 py-4 ring-1 ring-line md:px-5">
        <h1 className="text-xl font-bold md:text-2xl">{t.budget.title(amount, name)}</h1>
        <p className="text-sm leading-relaxed text-dim">{t.budget.intro(month(lang), amount, name, n(page.summaries.length, lang), formatTaka(from, lang))}</p>
        {others.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-faint">{t.budget.others}:</span>
            {others.map((b) => (
              <Link key={b.budget} href={`${categoryPath(prefix, slug)}${budgetSlug(b.budget)}/`} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink hover:border-brand hover:text-brand">
                {t.budget.chip(amountLabel(b.budget, lang))}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {page.summaries.map((summary, i) => (
          <ProductCard key={summary.product.id} summary={summary} loading={i < 4 ? "eager" : "lazy"} />
        ))}
      </div>
      <Link href={`${categoryPath(prefix, slug)}?max=${page.budget}`} className="self-center rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-brand-text hover:border-brand">
        {t.budget.filters(name)}
      </Link>
    </div>
  );
}
