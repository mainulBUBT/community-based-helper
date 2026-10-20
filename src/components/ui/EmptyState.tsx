import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line bg-surface px-6 py-12 text-center">
      <Icon size={28} className="text-faint" aria-hidden="true" />
      <p className="text-base font-semibold">{title}</p>
      {children}
    </div>
  );
}
