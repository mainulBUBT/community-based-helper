import { Pagination } from "@/components/ui/Pagination";
import { useAdminI18n } from "@/hooks/useAdminI18n";

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-10 min-w-56 flex-1 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
    />
  );
}

export function ListFooter({ noMatch, page, pages, onPage }: { noMatch: boolean; page: number; pages: number; onPage: (page: number) => void }) {
  const { t, num } = useAdminI18n();
  if (noMatch) return <p className="px-5 py-4 text-dim">{t.admin.common.noMatch}</p>;
  if (pages <= 1) return null;
  return (
    <div className="border-t border-line-soft p-4">
      <Pagination page={page} pages={pages} onChange={onPage} labels={t.common.pager} format={num} />
    </div>
  );
}
