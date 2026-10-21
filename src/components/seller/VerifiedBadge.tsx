"use client";

import { CircleHelp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/hooks/useI18n";

const SEAL =
  "M12 1.5l2.3 1.7 2.8-.3 1.1 2.6 2.6 1.1-.3 2.8 1.7 2.3-1.7 2.3.3 2.8-2.6 1.1-1.1 2.6-2.8-.3L12 22.5l-2.3-1.7-2.8.3-1.1-2.6-2.6-1.1.3-2.8L1.8 12l1.7-2.3-.3-2.8 2.6-1.1 1.1-2.6 2.8.3z";

export function VerifiedBadge({ verified, size = 16 }: { verified: boolean; size?: number }) {
  const { t } = useI18n();
  return verified ? (
    <span title={t.seller.verified} className="inline-flex shrink-0 text-verified">
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d={SEAL} fill="currentColor" />
        <path d="M7.8 12.3l2.8 2.8 5.6-5.8" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">{t.seller.verified}</span>
    </span>
  ) : (
    <Badge tone="neutral">
      <CircleHelp size={14} aria-hidden="true" />
      {t.seller.unverified}
    </Badge>
  );
}
