"use client";

import { Clock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ProductIcon } from "@/components/product/ProductIcon";
import { SearchHint } from "@/components/search/SearchHint";
import { useI18n } from "@/hooks/useI18n";
import { readRecent, rememberSearch } from "@/lib/recent-searches";
import { listSummaries } from "@/services/catalog";
import type { ProductSummary } from "@/types/catalog";
import { matchesQuery } from "@/utils/catalog";
import { formatTaka } from "@/utils/format";

type Option = { kind: "product"; summary: ProductSummary } | { kind: "recent"; text: string };

interface SearchBoxProps {
  defaultValue?: string;
  variant?: "hero" | "bar";
  examples?: string[];
  onSearch?: (query: string) => void;
}

export function SearchBox({ defaultValue = "", variant = "bar", examples, onSearch }: SearchBoxProps) {
  const router = useRouter();
  const { t, lang, prefix } = useI18n();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [catalog, setCatalog] = useState<ProductSummary[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  const query = text.trim();
  const options: Option[] = query
    ? catalog
        .filter((s) => matchesQuery(s.product, query))
        .slice(0, 6)
        .map((summary) => ({ kind: "product", summary }))
    : recent.map((item) => ({ kind: "recent", text: item }));
  const showList = open && options.length > 0;

  function warmUp() {
    setOpen(true);
    setRecent(readRecent());
    if (!catalog.length) listSummaries().then(setCatalog, () => {});
  }

  // মোবাইলে খোঁজার পরে কিবোর্ড নামিয়ে দেওয়া, যাতে ফল দেখা যায়
  function submit(value: string) {
    rememberSearch(value);
    setOpen(false);
    input.current?.blur();
    if (onSearch) onSearch(value.trim());
    else router.push(`${prefix}/search/${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`);
  }

  function choose(option: Option) {
    if (option.kind === "recent") {
      setText(option.text);
      submit(option.text);
      return;
    }
    rememberSearch(query);
    setOpen(false);
    input.current?.blur();
    router.push(`${prefix}/product/${option.summary.product.slug}/`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (options.length ? (i + step + options.length) % options.length : -1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (event.key === "Enter" && showList && active >= 0) {
      event.preventDefault();
      choose(options[active]);
    }
  }

  const hero = variant === "hero";

  return (
    <div className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className={`flex items-center gap-2 overflow-hidden rounded-lg border-2 border-brand bg-surface pl-3 ${hero ? "h-14" : "h-11"}`}
      >
        <Search size={18} className="shrink-0 text-dim" aria-hidden="true" />
        <div className="relative h-full min-w-0 flex-1">
          {!text && <SearchHint examples={examples} />}
          <input
            ref={input}
            type="search"
            enterKeyHint="search"
            role="combobox"
            aria-label={t.search.label}
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onFocus={warmUp}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            className="h-full w-full bg-transparent text-base text-ink outline-none"
          />
        </div>
        <button type="submit" className={`h-full bg-brand font-bold text-brand-ink hover:bg-brand-hover ${hero ? "px-6" : "px-4 text-sm"}`}>
          {t.search.submit}
        </button>
      </form>

      {showList && (
        <ul id={listId} role="listbox" aria-label={query ? t.search.suggestions : t.search.recent} className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-line bg-surface py-1 text-ink shadow-xl">
          {options.map((option, i) => (
            <li
              key={option.kind === "product" ? option.summary.product.id : option.text}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(option)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-surface-2" : "hover:bg-surface-2/60"}`}
            >
              {option.kind === "product" ? (
                <>
                  <ProductIcon product={option.summary.product} size="xs" />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {option.summary.product.brand} {option.summary.product.name}
                  </span>
                  {option.summary.lowest && <span className="text-sm font-bold">{formatTaka(option.summary.lowest, lang)}</span>}
                </>
              ) : (
                <>
                  <Clock size={16} className="text-faint" aria-hidden="true" />
                  <span className="flex-1 truncate">{option.text}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
