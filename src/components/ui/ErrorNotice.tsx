"use client";

import { useI18n } from "@/hooks/useI18n";

export function ErrorNotice({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface p-4">
      <p className="font-semibold">{t.common.loadError}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="h-10 rounded-md border border-line px-4 text-sm font-semibold hover:border-brand">
          {t.common.retry}
        </button>
      )}
    </div>
  );
}
