"use client";

import { WifiOff } from "lucide-react";
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
