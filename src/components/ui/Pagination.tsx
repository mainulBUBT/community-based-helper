import { ChevronLeft, ChevronRight } from "lucide-react";

export function paginate<T>(items: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { page: current, pages, items: items.slice((current - 1) * size, current * size) };
}

function pageList(page: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
}

interface Props {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  labels: { prev: string; next: string; nav: string };
  format?: (n: number) => string;
}

export function Pagination({ page, pages, onChange, labels, format = String }: Props) {
  if (pages <= 1) return null;
  const cell = "flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors";
  return (
    <nav aria-label={labels.nav} className="flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={labels.prev} className={`${cell} border-line bg-surface hover:border-dim disabled:opacity-40`}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      {pageList(page, pages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-dim">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={`${cell} ${p === page ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:border-dim"}`}
          >
            {format(p)}
          </button>
        ),
      )}
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={labels.next} className={`${cell} border-line bg-surface hover:border-dim disabled:opacity-40`}>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
