"use client";

import { useState } from "react";
import { PageTitle, Panel } from "@/components/admin/Panel";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { listAudit } from "@/services/admin/audit";
import { listJobs, listRuns } from "@/services/admin/jobs";
import { timeAgo } from "@/utils/format";

const ACTION_LABEL: Record<string, string> = {
  "review.approve": "যাচাইয়ে অনুমোদন",
  "review.reject": "যাচাইয়ে বাদ",
  "seller.create": "নতুন বিক্রেতা",
  "seller.update": "বিক্রেতা বদল",
  "seller.verify": "বিক্রেতা যাচাই",
  "product.create": "নতুন পণ্য",
  "offer.manual": "হাতে দাম বসানো",
  "promo.activate": "অফার চালু",
  "promo.deactivate": "অফার বন্ধ",
  "job.enable": "কাজ চালু",
  "job.pause": "কাজ থামানো",
  "job.run": "কাজ চালাতে বলা",
  "settings.update": "সেটিংস বদল",
};

const summary = (detail: Record<string, unknown> | null) =>
  detail
    ? Object.values(detail)
        .filter((v) => typeof v === "string" || typeof v === "number")
        .slice(0, 3)
        .join(", ")
    : "";

async function loadLogs() {
  const [runs, jobs, audit] = await Promise.all([listRuns(), listJobs(), listAudit()]);
  return { runs, jobNames: new Map(jobs.map((j) => [j.id, j.name])), audit };
}

export default function LogsPage() {
  const [tab, setTab] = useState<"runs" | "audit">("runs");
  const { data, loading } = useAsync(loadLogs, []);

  return (
    <>
      <PageTitle
        title="লগ"
        action={
          <div className="flex gap-2">
            <Chip selected={tab === "runs"} onClick={() => setTab("runs")}>
              কাজের লগ
            </Chip>
            <Chip selected={tab === "audit"} onClick={() => setTab("audit")}>
              অ্যাডমিনের কাজ
            </Chip>
          </div>
        }
      />
      {loading || !data ? (
        <ListSkeleton />
      ) : (
        <Panel>
          <ul className="divide-y divide-line-soft">
            {tab === "runs"
              ? data.runs.map((run) => (
                  <li key={run.id} className="flex items-start gap-3 px-5 py-3">
                    <Badge tone={run.status === "failed" ? "brand" : "ok"}>{run.status === "failed" ? "ব্যর্থ" : "ঠিক আছে"}</Badge>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{data.jobNames.get(run.jobId) ?? run.jobId}</span>
                      <span className="text-[13px] text-dim">{run.message}</span>
                    </div>
                    <span className="shrink-0 text-[13px] text-dim">{timeAgo(run.startedAt)}</span>
                  </li>
                ))
              : data.audit.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{ACTION_LABEL[entry.action] ?? entry.action}</span>
                      <span className="truncate text-[13px] text-dim">{summary(entry.detail)}</span>
                    </div>
                    <span className="shrink-0 text-[13px] text-dim">{timeAgo(entry.createdAt)}</span>
                  </li>
                ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
