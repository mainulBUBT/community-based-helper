import { CopyButton } from "@/components/ui/CopyButton";

export interface Fact {
  label: string;
  value: string;
  href?: string;
  copy?: boolean;
}

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="divide-y divide-line-soft overflow-hidden rounded-2xl bg-surface">
      {facts.map((fact) => (
        <div key={fact.label} className="flex min-h-14 items-center gap-3 px-4 py-2">
          <dt className="w-24 shrink-0 text-sm text-dim">{fact.label}</dt>
          <dd className="flex-1 text-[15px] font-semibold">
            {fact.href ? (
              <a href={fact.href} className="text-brand hover:text-brand-hover">
                {fact.value}
              </a>
            ) : (
              fact.value
            )}
          </dd>
          {fact.copy && <CopyButton text={fact.value} label={`${fact.label} কপি করুন`} doneMessage={`${fact.label} কপি হয়েছে`} />}
        </div>
      ))}
    </dl>
  );
}
