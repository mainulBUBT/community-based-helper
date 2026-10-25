import type { ReactNode } from "react";

export function Shelf({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-sm ring-1 ring-line-soft md:p-6">
      {children}
    </section>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[10.5px] font-bold tracking-[1.3px] text-accent uppercase">
      <span className="h-0.5 w-3.5 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </span>
  );
}
