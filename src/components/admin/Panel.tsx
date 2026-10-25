import type { ReactNode } from "react";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-dim">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line-soft bg-surface">
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "ink" }: { label: string; value: ReactNode; hint?: string; tone?: "ink" | "gold" | "brand" }) {
  const color = { ink: "text-ink", gold: "text-gold-text", brand: "text-brand" }[tone];
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line-soft bg-surface p-4">
      <span className="text-sm text-dim">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </div>
  );
}

export const primaryButton = "h-10 rounded-xl bg-brand px-4 text-sm font-bold text-brand-ink disabled:opacity-60";
export const secondaryButton = "h-10 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:border-brand disabled:opacity-60";
