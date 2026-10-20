"use client";

import { BadgeCheck, CircleHelp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/hooks/useI18n";

export function VerifiedBadge({ verified }: { verified: boolean }) {
  const { t } = useI18n();
  return verified ? (
    <Badge tone="ok" title={t.seller.verified}>
      <BadgeCheck size={15} aria-hidden="true" />
      <span className="sr-only">{t.seller.verified}</span>
    </Badge>
  ) : (
    <Badge tone="neutral">
      <CircleHelp size={14} aria-hidden="true" />
      {t.seller.unverified}
    </Badge>
  );
}
