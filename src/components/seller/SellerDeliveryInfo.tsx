"use client";

import { Panel } from "@/components/ui/Panel";
import { useI18n } from "@/hooks/useI18n";
import type { SellerDelivery } from "@/types/catalog";
import { dayRange, formatTaka } from "@/utils/format";

export function SellerDeliveryInfo({ delivery }: { delivery: SellerDelivery }) {
  const { t, num, lang } = useI18n();
  const fee = (amount: number) => (amount ? formatTaka(amount, lang) : t.product.deliveryFree);
  const days = dayRange(delivery.minDays, delivery.maxDays);
  const rows = [
    delivery.dhaka != null && { label: t.seller.deliveryDhaka, value: [fee(delivery.dhaka), days && t.product.deliveryDays(num(days))].filter(Boolean).join(" · ") },
    delivery.outside != null && { label: t.seller.deliveryOutside, value: fee(delivery.outside) },
    delivery.cod != null && { label: t.seller.cod, value: delivery.cod ? t.seller.yes : t.seller.no },
    delivery.returnDays != null && { label: t.seller.returns, value: t.seller.returnDays(num(delivery.returnDays)) },
  ].filter((row): row is { label: string; value: string } => Boolean(row));
  if (!rows.length) return null;

  return (
    <Panel title={t.seller.deliveryTitle}>
      <dl className="divide-y divide-line-soft">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 px-4 py-3 text-sm md:px-5">
            <dt className="text-dim">{row.label}</dt>
            <dd className="text-right font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
