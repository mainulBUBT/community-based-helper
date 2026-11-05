"use client";

import { secondaryButton } from "@/components/admin/Panel";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { useAsync } from "@/hooks/useAsync";
import { listJobs, requestJobRun } from "@/services/admin/jobs";

export function PublishButton() {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const { data } = useAsync(listJobs, []);
  const rebuild = data?.find((job) => job.id === "rebuild");
  if (!rebuild) return null;
  return (
    <button type="button" disabled={busy} onClick={() => run(() => requestJobRun(rebuild), t.admin.jobs.runQueuedToast)} className={secondaryButton}>
      {t.admin.collections.publish}
    </button>
  );
}
