import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-back"]}
      className="-ml-2 inline-flex h-10 items-center gap-1 self-start rounded-lg pr-3 text-sm text-ink-2 transition-colors hover:text-ink"
    >
      <ChevronLeft size={20} aria-hidden="true" />
      {label}
    </Link>
  );
}
