"use client";

import { SearchX, WifiOff } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { EmptyState } from "./EmptyState";

export function OfflineNotice() {
  const { t } = useI18n();
  return (
    <EmptyState icon={WifiOff} title={t.offline.title}>
      <p className="text-sm text-dim">{t.offline.body}</p>
    </EmptyState>
  );
}

export function NotFoundNotice() {
  const { t, prefix } = useI18n();
  return (
    <EmptyState icon={SearchX} title={t.notFound.title}>
      <Link href={`${prefix}/`} className="flex h-11 items-center rounded-md bg-brand px-5 font-bold text-brand-ink">
        {t.notFound.cta}
      </Link>
    </EmptyState>
  );
}
