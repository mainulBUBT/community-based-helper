"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useAdminI18n } from "@/hooks/useAdminI18n";

export function StepNumber({ n }: { n: number }) {
  const { num } = useAdminI18n();
  return <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-ink">{num(n)}</span>;
}

export function Disclosure({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-brand [&::-webkit-details-marker]:hidden">
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180" />
        {summary}
      </summary>
      {children}
    </details>
  );
}

export function GuidePanel({ title, steps }: { title: string; steps: { title: string; body: string }[] }) {
  return (
    <section className="rounded-2xl border border-brand/30 bg-brand-soft/40 px-5 py-4">
      <Disclosure summary={title}>
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <StepNumber n={i + 1} />
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{step.title}</span>
                <span className="text-[13px] text-dim">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Disclosure>
    </section>
  );
}
