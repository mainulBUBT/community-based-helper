"use client";

import { useState } from "react";
import { PageTitle, Panel } from "@/components/admin/Panel";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import type { AdminMessages } from "@/i18n/admin-bn";
import { listAudit } from "@/services/admin/audit";
import { listJobs, listRuns } from "@/services/admin/jobs";

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
  const { t, ago } = useAdminI18n();
  const [tab, setTab] = useState<"runs" | "audit">("runs");
  const { data, loading } = useAsync(loadLogs, []);
  const actionLabel = (action: string) => t.admin.logs.actions[action as keyof AdminMessages["logs"]["actions"]] ?? action;

  return (
    <>
      <PageTitle
        title={t.admin.logs.title}
        action={
          <div className="flex gap-2">
            <Chip selected={tab === "runs"} onClick={() => setTab("runs")}>
              {t.admin.logs.runsTab}
            </Chip>
            <Chip selected={tab === "audit"} onClick={() => setTab("audit")}>
              {t.admin.logs.auditTab}
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
                    <Badge tone={run.status === "failed" ? "brand" : run.status === "running" ? "neutral" : "ok"}>{run.status === "failed" ? t.admin.logs.failed : run.status === "running" ? t.admin.logs.running : t.admin.logs.ok}</Badge>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{data.jobNames.get(run.jobId) ?? run.jobId}</span>
                      <span className="text-[13px] text-dim">{run.message}</span>
                    </div>
                    <span className="shrink-0 text-[13px] text-dim">{ago(run.startedAt)}</span>
                  </li>
                ))
              : data.audit.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">{actionLabel(entry.action)}</span>
                      <span className="truncate text-[13px] text-dim">{summary(entry.detail)}</span>
                    </div>
                    <span className="shrink-0 text-[13px] text-dim">{ago(entry.createdAt)}</span>
                  </li>
                ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
