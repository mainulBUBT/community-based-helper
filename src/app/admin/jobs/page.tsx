"use client";

import { BadgePercent, Clock, Loader2, Play, RefreshCw, Search, Sparkles, Tag, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AiSetup } from "@/components/admin/AiSetup";
import { Field } from "@/components/admin/Field";
import { Disclosure, StepNumber } from "@/components/admin/Guide";
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

const JOBS: { id: string; icon: LucideIcon }[] = [
  { id: "prices", icon: Tag },
  { id: "discover", icon: Search },
  { id: "rebuild", icon: RefreshCw },
  { id: "promos", icon: BadgePercent },
];
const rank = (job: Job) => {
  const i = JOBS.findIndex((j) => j.id === job.id);
  return i < 0 ? JOBS.length : i;
};

function JobStatus({ state }: { state: JobState }) {
  const { t } = useAdminI18n();
  return (
    <span className={`flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[state]}`}>
      {(state === "running" || state === "queued") && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
      {t.admin.jobs.status[state]}
    </span>
  );
}

function JobCard({ job, now, onChanged }: { job: Job; now: number; onChanged: () => void }) {
  const { t, ago } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const info = t.admin.jobs.info[job.id as keyof typeof t.admin.jobs.info];
  const name = info?.name ?? job.name;
  const Icon = JOBS.find((j) => j.id === job.id)?.icon ?? Clock;
  const state = jobState(job, now);
  const queued = state === "queued";
  const failed = state === "failed";

  return (
    <li className={`flex flex-col rounded-2xl border bg-surface ${failed ? "border-sale/40" : "border-line-soft"}`}>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${failed ? "bg-sale-soft text-sale" : "bg-brand-soft text-brand"}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold">{name}</h3>
              <JobStatus state={state} />
            </div>
            {info && <p className="text-sm text-dim">{info.what}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-dim">
          <span className="flex items-center gap-1.5">
            <Clock size={13} aria-hidden="true" className="shrink-0" />
            {info?.when ?? job.schedule}
          </span>
          {job.lastRunAt && <span>{t.admin.jobs.lastRun(ago(job.lastRunAt))}</span>}
          {AI_JOBS.has(job.id) && (
            <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-text">
              <Sparkles size={12} aria-hidden="true" />
              {t.admin.jobs.usesAi}
            </span>
          )}
        </div>

        {failed && (
          <div className="flex flex-col gap-1 rounded-xl bg-sale-soft px-3.5 py-3 text-[13px] text-ink">
            {job.lastMessage && <p className="break-words">{job.lastMessage}</p>}
            {info && (
              <p>
                <strong>{t.admin.jobs.whatToDo}: </strong>
                {info.ifFails}{" "}
                <Link href="/admin/logs/" className="font-semibold text-brand hover:underline">
                  {t.admin.nav.logs}
                </Link>
              </p>
            )}
          </div>
        )}
        {!failed && job.lastMessage && (
          <Disclosure summary={t.admin.jobs.lastResult}>
            <div className="mt-2 flex flex-col gap-1.5 rounded-xl bg-surface-2/60 px-3.5 py-3 text-[13px]">
              <p className="break-words">{job.lastMessage}</p>
              <Link href="/admin/logs/" className="w-fit font-semibold text-brand hover:underline">
                {t.admin.jobs.allRuns}
              </Link>
            </div>
          </Disclosure>
        )}
        {state === "stuck" && <p className="rounded-xl bg-gold-soft px-3.5 py-3 text-[13px] text-ink">{t.admin.jobs.stuckHint}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <Toggle
            label={t.admin.jobs.enabledAria(name)}
            checked={job.enabled}
            disabled={busy}
            onChange={async (enabled) => {
              if (await run(() => setJobEnabled(job, enabled), enabled ? t.admin.jobs.enabledToast : t.admin.jobs.disabledToast)) onChanged();
            }}
          />
          {t.admin.jobs.autoLabel}
        </label>
        <button
          type="button"
          disabled={!job.enabled || queued || busy}
          title={job.enabled ? undefined : t.admin.jobs.runPausedHint}
          onClick={async () => {
            if (await run(() => requestJobRun(job), t.admin.jobs.runQueuedToast)) onChanged();
          }}
          className={`${secondaryButton} flex shrink-0 items-center gap-1.5`}
        >
          <Play size={14} aria-hidden="true" />
          {queued ? t.admin.jobs.runQueued : t.admin.jobs.runNow}
        </button>
      </div>
    </li>
  );
}

function JobsPanel() {
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
    <ul className="grid gap-4 md:grid-cols-2">
      {[...data].sort((a, b) => rank(a) - rank(b)).map((job) => (
        <JobCard key={job.id} job={job} now={now} onChanged={reload} />
      ))}
    </ul>
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
    const next = { ...initial, telegramBotToken: value("telegramBotToken")?.replace(/\s/g, "") || null, alertChatId: value("alertChatId") };
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
        <Tabs tabs={TABS.map((id) => ({ id, label: t.admin.jobs.tabs[id] }))} active={tab} onChange={setTab} label={t.admin.jobs.title} idPrefix="jobs" />
        <div role="tabpanel" id="jobs-jobs" hidden={tab !== "jobs"}>
          <JobsPanel />
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
