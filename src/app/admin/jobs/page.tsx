"use client";

import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AiSetup } from "@/components/admin/AiSetup";
import { Field } from "@/components/admin/Field";
import { Disclosure, GuidePanel, StepNumber } from "@/components/admin/Guide";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Tabs } from "@/components/admin/Tabs";
import { Toggle } from "@/components/admin/Toggle";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { listJobs, requestJobRun, setJobEnabled } from "@/services/admin/jobs";
import { loadPrivateSettings, savePrivateSettings } from "@/services/admin/settings";
import type { Job, PrivateSettings } from "@/types/admin";
import { jobState, type JobState } from "@/utils/job-state";

const AI_JOBS = new Set(["discover", "promos"]);

const TABS = ["jobs", "ai", "telegram"] as const;
type Tab = (typeof TABS)[number];

const TONE: Record<JobState, string> = {
  ok: "bg-ok-soft text-ok",
  running: "bg-brand-soft text-brand-text",
  queued: "bg-surface-2 text-dim",
  stuck: "bg-gold-soft text-gold-text",
  failed: "bg-sale-soft text-sale",
  paused: "bg-surface-2 text-dim",
  never: "bg-surface-2 text-dim",
};

const STATES = Object.keys(TONE) as JobState[];

function JobStatus({ state }: { state: JobState }) {
  const { t } = useAdminI18n();
  return (
    <span className={`flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[state]}`}>
      {(state === "running" || state === "queued") && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
      {t.admin.jobs.status[state]}
    </span>
  );
}

function StatusLegend() {
  const { t } = useAdminI18n();
  return (
    <div className="border-b border-line-soft px-5 py-3">
      <Disclosure summary={t.admin.jobs.statusLegend}>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {STATES.map((state) => (
            <li key={state} className="flex flex-col gap-1 text-[13px] sm:flex-row sm:items-center sm:gap-2">
              <JobStatus state={state} />
              <span className="text-dim">{t.admin.jobs.statusHelp[state]}</span>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}

function JobRow({ job, now, onChanged }: { job: Job; now: number; onChanged: () => void }) {
  const { t, ago } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const info = t.admin.jobs.info[job.id as keyof typeof t.admin.jobs.info];
  const name = info?.name ?? job.name;
  const state = jobState(job, now);
  const queued = state === "queued";
  const runHint = !job.enabled ? t.admin.jobs.runPausedHint : queued ? t.admin.jobs.runQueuedHint : null;

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{name}</h3>
        <JobStatus state={state} />
        {AI_JOBS.has(job.id) && (
          <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-text">
            <Sparkles size={12} aria-hidden="true" />
            {t.admin.jobs.usesAi}
          </span>
        )}
      </div>
      {info && <p className="text-sm text-dim">{info.what}</p>}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-surface-2/50 px-3 py-2.5 text-[13px] sm:px-4">
        <div>
          <dt className="text-dim">{t.admin.jobs.schedule}</dt>
          <dd className="font-semibold">{job.schedule}</dd>
        </div>
        <div>
          <dt className="text-dim">{t.admin.jobs.lastRun}</dt>
          <dd className="font-semibold">{job.lastRunAt ? ago(job.lastRunAt) : t.admin.jobs.neverRan}</dd>
        </div>
        {job.lastMessage && (
          <div className="col-span-2">
            <dt className="text-dim">{t.admin.jobs.lastResult}</dt>
            <dd className="break-words">{job.lastMessage}</dd>
          </div>
        )}
      </dl>

      {state === "failed" && info && (
        <p className="rounded-xl border border-sale/20 bg-sale-soft px-4 py-3 text-[13px] text-ink">
          <strong>{t.admin.jobs.whatToDo}: </strong>
          {info.ifFails}{" "}
          <Link href="/admin/logs/" className="font-semibold text-brand hover:underline">
            {t.admin.nav.logs}
          </Link>
        </p>
      )}
      {state === "stuck" && <p className="rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-[13px] text-ink">{t.admin.jobs.stuckHint}</p>}

      <div className="flex flex-col gap-1.5 border-t border-line-soft pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Toggle
              label={t.admin.jobs.enabledAria(name)}
              checked={job.enabled}
              disabled={busy}
              onChange={async (enabled) => {
                if (await run(() => setJobEnabled(job, enabled), enabled ? t.admin.jobs.enabledToast : t.admin.jobs.disabledToast)) onChanged();
              }}
            />
            <span className="text-sm font-semibold">{t.admin.jobs.autoLabel}</span>
          </div>
          <button
            type="button"
            disabled={!job.enabled || queued || busy}
            onClick={async () => {
              if (await run(() => requestJobRun(job), t.admin.jobs.runQueuedToast)) onChanged();
            }}
            className={`${secondaryButton} shrink-0`}
          >
            {queued ? t.admin.jobs.runQueued : t.admin.jobs.runNow}
          </button>
        </div>
        {runHint && <span className="text-xs text-dim">{runHint}</span>}
      </div>

      {info && (
        <Disclosure summary={t.admin.jobs.details}>
          <dl className="mt-2 flex flex-col gap-2 text-[13px]">
            <div>
              <dt className="font-semibold">{t.admin.jobs.onRunLabel}</dt>
              <dd className="text-dim">{info.onRun}</dd>
            </div>
            <div>
              <dt className="font-semibold">{t.admin.jobs.ifFailsLabel}</dt>
              <dd className="text-dim">{info.ifFails}</dd>
            </div>
          </dl>
        </Disclosure>
      )}
    </li>
  );
}

function JobsPanel() {
  const { t } = useAdminI18n();
  const { data, loading, reload } = useAsync(listJobs, []);
  const [now, setNow] = useState(() => Date.now());
  const active = (data ?? []).some((job) => ["running", "queued"].includes(jobState(job, now)));

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      reload();
    }, 15000);
    return () => clearInterval(timer);
  }, [active, reload]);

  if (loading || !data) return <ListSkeleton rows={3} />;
  return (
    <Panel title={t.admin.jobs.regularJobs}>
      {active && <p className="border-b border-line-soft bg-brand-soft px-5 py-2.5 text-[13px] text-brand-text">{t.admin.jobs.autoRefresh}</p>}
      <StatusLegend />
      <ul className="divide-y divide-line-soft">
        {data.map((job) => (
          <JobRow key={job.id} job={job} now={now} onChanged={reload} />
        ))}
      </ul>
    </Panel>
  );
}

// ব্রাউজার/পাসওয়ার্ড ম্যানেজার এই ফর্মকে লগইন ভেবে token এ পাসওয়ার্ড বসিয়ে দেয়
const NO_AUTOFILL = { autoComplete: "off", "data-1p-ignore": true, "data-lpignore": "true", "data-form-type": "other" } as const;

function TelegramForm({ initial, onSaved }: { initial: PrivateSettings; onSaved: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim() || null;
    const next = { ...initial, telegramBotToken: value("telegramBotToken"), alertChatId: value("alertChatId") };
    if (await run(() => savePrivateSettings(next, t.admin.jobs.auditSection), t.admin.common.saved)) onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Panel title={t.admin.jobs.telegramTitle}>
        <div className="flex flex-col gap-3 border-b border-line-soft bg-surface-2/50 px-5 py-4 text-sm">
          <p className="text-dim">{t.admin.jobs.telegramHint}</p>
          <ol className="flex flex-col gap-3">
            {t.admin.jobs.telegramSteps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <StepNumber n={i + 1} />
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field
            label={t.admin.jobs.botToken}
            name="telegramBotToken"
            type="password"
            {...NO_AUTOFILL}
            autoComplete="new-password"
            hint={initial.telegramBotToken ? t.admin.jobs.secretSaved(initial.telegramBotToken) : undefined}
          />
          <Field label={t.admin.jobs.chatId} name="alertChatId" inputMode="numeric" {...NO_AUTOFILL} defaultValue={initial.alertChatId ?? ""} />
        </div>
      </Panel>
      <button type="submit" disabled={busy} className={`${primaryButton} w-full sm:w-fit`}>
        {t.admin.common.save}
      </button>
    </form>
  );
}

export default function JobsAdminPage() {
  const { t } = useAdminI18n();
  const { data, error, reload } = useAsync(loadPrivateSettings, []);
  const [tab, setTab] = useState<Tab>("jobs");
  const settingsView = (view: (settings: PrivateSettings) => ReactNode) =>
    data ? view(data) : error ? <ErrorNotice onRetry={reload} /> : <ListSkeleton rows={2} />;
  return (
    <>
      <PageTitle title={t.admin.jobs.title} subtitle={t.admin.jobs.subtitle} />
      <div className="flex flex-col gap-6">
        <GuidePanel title={t.admin.jobs.guideTitle} steps={t.admin.jobs.guide} />
        <Tabs tabs={TABS.map((id) => ({ id, label: t.admin.jobs.tabs[id] }))} active={tab} onChange={setTab} label={t.admin.jobs.title} idPrefix="jobs" />
        <div role="tabpanel" id="jobs-jobs" hidden={tab !== "jobs"} className="flex flex-col gap-6">
          <JobsPanel />
          <GuidePanel title={t.admin.jobs.flowTitle} steps={t.admin.jobs.flow} />
        </div>
        {/* সেভের পরে আবার বসে, যাতে সেভ করা মান দেখায় */}
        <div role="tabpanel" id="jobs-ai" hidden={tab !== "ai"}>
          {settingsView((settings) => <AiSetup key={JSON.stringify(settings)} settings={settings} onSaved={reload} />)}
        </div>
        <div role="tabpanel" id="jobs-telegram" hidden={tab !== "telegram"}>
          {settingsView((settings) => <TelegramForm key={JSON.stringify(settings)} initial={settings} onSaved={reload} />)}
        </div>
      </div>
    </>
  );
}
