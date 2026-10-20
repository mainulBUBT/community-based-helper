"use client";

import { ImageIcon } from "lucide-react";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Badge } from "@/components/ui/Badge";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useI18n";
import { listPendingReview, resolveReview } from "@/services/admin/review";
import type { ReviewItem } from "@/types/admin";
import { formatTaka } from "@/utils/format";

const taka = (value?: string) => (value ? formatTaka(Number(value)) : "");

function Actions({ item, yes, no, onDone }: { item: ReviewItem; yes: string; no: string; onDone: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  async function decide(approved: boolean) {
    if (await run(() => resolveReview(item, approved), approved ? t.admin.review.approved : t.admin.review.rejected)) onDone();
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => decide(true)} className={primaryButton}>
        {yes}
      </button>
      <button type="button" disabled={busy} onClick={() => decide(false)} className={secondaryButton}>
        {no}
      </button>
    </div>
  );
}

export default function ReviewPage() {
  const { t, num, ago } = useAdminI18n();
  const { data, error, loading, reload } = useAsync(listPendingReview, []);
  if (loading) return <ListSkeleton />;
  if (error || !data) return <ErrorNotice onRetry={reload} />;

  const matches = data.filter((i) => i.kind === "match");
  const anomalies = data.filter((i) => i.kind === "anomaly");
  const submissions = data.filter((i) => i.kind === "submission");

  return (
    <>
      <PageTitle title={t.admin.review.title} subtitle={t.admin.review.subtitle} />
      <div className="flex flex-col gap-6">
        <Panel title={t.admin.review.matches(num(matches.length))}>
          {matches.length === 0 && <p className="px-5 py-4 text-dim">{t.admin.review.noMatches}</p>}
          <ul className="divide-y divide-line-soft">
            {matches.map((item) => (
              <li key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold">{item.payload.listing}</p>
                  <p className="text-[13px] text-dim">{t.admin.review.atSeller(item.payload.seller, taka(item.payload.price))}</p>
                </div>
                <div>
                  <p className="font-semibold">{item.payload.guess}</p>
                  <p className="text-[13px] text-dim">{item.payload.reason}</p>
                  <Badge tone="gold">{t.admin.review.confidence(num(item.payload.confidence))}</Badge>
                </div>
                <Actions item={item} yes={t.admin.review.matchYes} no={t.admin.review.matchNo} onDone={reload} />
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title={t.admin.review.anomalies(num(anomalies.length))}>
            {anomalies.length === 0 && <p className="px-5 py-4 text-dim">{t.admin.review.empty}</p>}
            <ul className="divide-y divide-line-soft">
              {anomalies.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 px-5 py-4">
                  <p className="font-semibold">
                    {item.payload.product}, {item.payload.seller}
                  </p>
                  <p>
                    <span className="text-dim line-through">{taka(item.payload.from)}</span> {t.admin.review.fromWord}{" "}
                    <strong className="text-gold-text">{taka(item.payload.to)}</strong>
                  </p>
                  <p className="text-[13px] text-dim">{item.payload.reason}</p>
                  <Actions item={item} yes={t.admin.review.anomalyYes} no={t.admin.review.anomalyNo} onDone={reload} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t.admin.review.submissions(num(submissions.length))}>
            {submissions.length === 0 && <p className="px-5 py-4 text-dim">{t.admin.review.empty}</p>}
            <ul className="divide-y divide-line-soft">
              {submissions.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-4">
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-faint">
                    <ImageIcon size={24} aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="font-semibold">{item.payload.seller}</p>
                    <p className="text-sm">
                      {item.payload.product}
                      {item.payload.condition ? `, ${item.payload.condition}` : ""}, <strong>{taka(item.payload.price)}</strong>
                    </p>
                    {item.payload.phone && <p className="text-sm">{t.admin.review.phone(item.payload.phone)}</p>}
                    {item.payload.link && (
                      <a href={item.payload.link} target="_blank" rel="noopener nofollow" className="truncate text-sm text-brand">
                        {item.payload.link}
                      </a>
                    )}
                    <p className="text-[13px] text-dim">{t.admin.review.sentBy(item.payload.from, ago(item.createdAt))}</p>
                    <Actions item={item} yes={t.admin.review.submissionYes} no={t.admin.review.submissionNo} onDone={reload} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
