import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}

export function SectionHeader({ title, subtitle, href, linkLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-bold md:text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-dim">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand hover:text-brand-hover">
          {linkLabel}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
