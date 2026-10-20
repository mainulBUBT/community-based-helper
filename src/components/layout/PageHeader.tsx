"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";

export function PageHeader({ title, actions }: { title?: string; actions?: ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        type="button"
        aria-label={t.common.back}
        onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
        className="-ml-2 flex size-11 items-center justify-center rounded-md hover:bg-surface-2"
      >
        <ChevronLeft size={24} aria-hidden="true" />
      </button>
      {title && <h1 className="flex-1 truncate text-xl font-bold">{title}</h1>}
      <span className={title ? "" : "flex-1"} />
      {actions}
    </div>
  );
}
