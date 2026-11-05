"use client";

import { Plus, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { SearchBox } from "@/components/admin/ListSearch";
import { secondaryButton } from "@/components/admin/Panel";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import type { Product } from "@/types/catalog";
import { categoryName } from "@/utils/categories";
import { matchesQuery } from "@/utils/search";

const MAX_SHOWN = 30;

function ProductList({ products, icon: Icon, label, onPick }: { products: Product[]; icon: LucideIcon; label: (name: string) => string; onPick: (slug: string) => void }) {
  const { lang } = useAdminI18n();
  const { categories } = useAdminCategories();
  return (
    <ul className="max-h-96 divide-y divide-line-soft overflow-y-auto rounded-lg border border-line-soft">
      {products.map((product) => (
        <li key={product.slug} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{`${product.brand} ${product.name}`}</span>
            <span className="text-xs text-dim">{categoryName(categories.find((c) => c.slug === product.category), lang)}</span>
          </span>
          <button
            type="button"
            aria-label={label(product.name)}
            onClick={() => onPick(product.slug)}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line hover:border-brand hover:text-brand"
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ProductPicker({ products, selected, onChange }: { products: Product[]; selected: string[]; onChange: (selected: string[]) => void }) {
  const { t, num } = useAdminI18n();
  const { categories } = useAdminCategories();
  const [query, setQuery] = useState("");
  const text = t.admin.collections;
  const words = query.trim();
  const matches = words ? products.filter((p) => !selected.includes(p.slug) && matchesQuery(p, words, categories)) : [];
  const chosen = selected.flatMap((slug) => products.find((p) => p.slug === slug) ?? []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <SearchBox value={query} onChange={setQuery} placeholder={text.searchProducts} />
          {matches.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange([...selected, ...matches.map((p) => p.slug)]);
                setQuery("");
              }}
              className={secondaryButton}
            >
              {text.addAll(num(matches.length))}
            </button>
          )}
        </div>
        {matches.length > 0 && <ProductList products={matches.slice(0, MAX_SHOWN)} icon={Plus} label={text.add} onPick={(slug) => onChange([...selected, slug])} />}
        {words && !matches.length && <p className="text-sm text-dim">{t.admin.common.noMatch}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{text.selected(num(chosen.length))}</span>
        {chosen.length > 0 ? (
          <ProductList products={chosen} icon={X} label={text.remove} onPick={(slug) => onChange(selected.filter((s) => s !== slug))} />
        ) : (
          <p className="text-sm text-dim">{text.emptyHint}</p>
        )}
      </div>
    </div>
  );
}
