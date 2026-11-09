import type { ReactNode } from "react";

export function Panel({ title, subtitle, id, children }: { title: string; subtitle?: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-32 flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-col gap-0.5 border-b border-line-soft px-4 py-3.5 md:px-5 md:py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <span className="text-[13px] text-dim">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}
