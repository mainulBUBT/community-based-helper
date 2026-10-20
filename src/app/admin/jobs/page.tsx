"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useI18n";
import { showToast } from "@/lib/toast";
import { listJobs, requestJobRun, setJobEnabled } from "@/services/admin/jobs";
import { loadPrivateSettings, savePrivateSettings, testLlm } from "@/services/admin/settings";
import type { PrivateSettings } from "@/types/admin";

function JobsPanel() {
  const { t, ago } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const { data, loading, reload } = useAsync(listJobs, []);
  if (loading || !data) return <ListSkeleton rows={3} />;
  return (
    <Panel title={t.admin.jobs.regularJobs}>
      <ul className="divide-y divide-line-soft">
        {data.map((job) => (
          <li key={job.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <Toggle
              label={t.admin.jobs.enabledAria(job.name)}
              checked={job.enabled}
              disabled={busy}
              onChange={async (enabled) => {
                if (await run(() => setJobEnabled(job, enabled), enabled ? t.admin.jobs.enabledToast : t.admin.jobs.disabledToast)) reload();
              }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {job.name}
                {job.lastStatus === "failed" && <Badge tone="brand">{t.admin.jobs.lastFailed}</Badge>}
              </p>
              <p className="text-[13px] text-dim">
                {t.admin.jobs.runsOn(job.runner, job.schedule)} {job.lastRunAt ? t.admin.jobs.lastRan(ago(job.lastRunAt)) : t.admin.jobs.neverRan}
                {job.lastMessage ? `: ${job.lastMessage}` : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={!job.enabled || Boolean(job.runRequestedAt) || busy}
              onClick={async () => {
                if (await run(() => requestJobRun(job), t.admin.jobs.runQueuedToast)) reload();
              }}
              className={secondaryButton}
            >
              {job.runRequestedAt ? t.admin.jobs.runQueued : t.admin.jobs.runNow}
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function SettingsForm({ initial }: { initial: PrivateSettings }) {
  const { t } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState("");

  function read(form: HTMLFormElement): PrivateSettings {
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "").trim() || null;
    return {
      llm: { baseUrl: value("baseUrl") ?? "", model: value("model") ?? "", apiKey: value("apiKey") },
      telegramBotToken: value("telegramBotToken"),
      alertChatId: value("alertChatId"),
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await savePrivateSettings(read(event.currentTarget), t.admin.jobs.auditSection);
      showToast(t.admin.common.saved);
    } catch {
      showToast(t.admin.common.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onTest(form: HTMLFormElement | null) {
    if (!form) return;
    setTestResult(t.admin.jobs.testing);
    try {
      const reply = await testLlm(read(form).llm);
      setTestResult(t.admin.jobs.testOk(reply));
    } catch (error) {
      setTestResult(t.admin.jobs.testFailed((error as Error).message));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Panel title={t.admin.jobs.aiTitle}>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label={t.admin.jobs.baseUrl} name="baseUrl" type="url" defaultValue={initial.llm.baseUrl} required hint={t.admin.jobs.baseUrlHint} />
          </div>
          <Field label={t.admin.jobs.model} name="model" defaultValue={initial.llm.model} required />
          <Field label={t.admin.jobs.apiKey} name="apiKey" type="password" autoComplete="off" defaultValue={initial.llm.apiKey ?? ""} />
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button type="button" onClick={(e) => onTest(e.currentTarget.form)} className={secondaryButton}>
              {t.admin.jobs.testConnection}
            </button>
            {testResult && <p className="text-sm">{testResult}</p>}
          </div>
        </div>
      </Panel>
      <Panel title={t.admin.jobs.telegramTitle}>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label={t.admin.jobs.botToken} name="telegramBotToken" type="password" autoComplete="off" defaultValue={initial.telegramBotToken ?? ""} />
          <Field label={t.admin.jobs.chatId} name="alertChatId" defaultValue={initial.alertChatId ?? ""} />
        </div>
      </Panel>
      <button type="submit" disabled={busy} className={`${primaryButton} self-start`}>
        {t.admin.common.save}
      </button>
    </form>
  );
}

export default function JobsAdminPage() {
  const { t } = useAdminI18n();
  const { data } = useAsync(loadPrivateSettings, []);
  return (
    <>
      <PageTitle title={t.admin.jobs.title} />
      <div className="flex flex-col gap-6">
        <JobsPanel />
        {data ? <SettingsForm initial={data} /> : <ListSkeleton rows={2} />}
      </div>
    </>
  );
}
