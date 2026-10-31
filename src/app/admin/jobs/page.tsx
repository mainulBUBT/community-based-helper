"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Field, SecretField } from "@/components/admin/Field";
import { Disclosure, GuidePanel, StepNumber } from "@/components/admin/Guide";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Tabs } from "@/components/admin/Tabs";
import { Toggle } from "@/components/admin/Toggle";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { showToast } from "@/lib/toast";
import { listJobs, requestJobRun, setJobEnabled } from "@/services/admin/jobs";
import { loadPrivateSettings, providerKey, savePrivateSettings, testLlm } from "@/services/admin/settings";
import type { Job, PrivateSettings } from "@/types/admin";

const AI_JOBS = new Set(["discover", "promos"]);

const TABS = ["jobs", "ai", "telegram"] as const;
type Tab = (typeof TABS)[number];

const PRESETS = [
  { name: "Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.5-flash" },
  { name: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free" },
  { name: "Cloudflare", baseUrl: "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1", model: "@cf/meta/llama-3.1-8b-instruct" },
];

const STUCK_AFTER = 2 * 3600000;

type JobState = "ok" | "running" | "queued" | "stuck" | "failed" | "paused" | "never";

function jobState(job: Job, now: number): JobState {
  if (!job.enabled) return "paused";
  if (job.runRequestedAt && (!job.lastRunAt || job.runRequestedAt > job.lastRunAt)) return "queued";
  if (job.lastStatus === "running") return job.lastRunAt && now - new Date(job.lastRunAt).getTime() > STUCK_AFTER ? "stuck" : "running";
  if (!job.lastRunAt) return "never";
  return job.lastStatus === "failed" ? "failed" : "ok";
}

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

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <StepNumber n={n} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h3 className="pt-0.5 font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

type TestResult = { tone: "ok" | "fail" | "info"; text: string } | null;

const TEST_TONE = {
  ok: "border-ok/30 bg-ok-soft text-ink",
  fail: "border-sale/20 bg-sale-soft text-ink",
  info: "border-line-soft bg-surface-2 text-dim",
};

// ব্রাউজার/পাসওয়ার্ড ম্যানেজার এই ফর্মকে লগইন ভেবে model এ ইমেইল আর key তে পাসওয়ার্ড বসিয়ে দেয়
const NO_AUTOFILL = { autoComplete: "off", "data-1p-ignore": true, "data-lpignore": "true", "data-form-type": "other" } as const;

// AI আর Telegram একই ফর্মে, দুই ট্যাবেই মাউন্ট থাকে যাতে ট্যাব বদলালে লেখা না হারায়
function SettingsForm({ initial, onSaved, tab, onTab }: { initial: PrivateSettings; onSaved: () => void; tab: Tab; onTab: (tab: Tab) => void }) {
  const { t } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [baseUrl, setBaseUrl] = useState(initial.llm.baseUrl);
  const [model, setModel] = useState(initial.llm.model);
  const ready = Boolean(initial.llm.baseUrl && initial.llm.model && initial.llm.apiKey);
  const savedKey = (url: string) => initial.llmKeys?.[providerKey(url)] ?? null;

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
      onSaved();
    } catch {
      showToast(t.admin.common.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onTest(form: HTMLFormElement | null) {
    if (!form) return;
    const llm = read(form).llm;
    if (!llm.apiKey) return setTestResult({ tone: "fail", text: t.admin.jobs.testNeedsKey });
    setTestResult({ tone: "info", text: t.admin.jobs.testing });
    try {
      const reply = await testLlm(llm);
      setTestResult({ tone: "ok", text: t.admin.jobs.testOk(reply) });
    } catch (error) {
      setTestResult({ tone: "fail", text: t.admin.jobs.testFailed((error as Error).message) });
    }
  }

  function pickProvider(url: string, presetModel: string) {
    setBaseUrl(url);
    setModel(presetModel);
    setTestResult(null);
  }

  return (
    <form
      onSubmit={onSubmit}
      onInvalidCapture={(event) => {
        const form = event.currentTarget;
        const owner = (event.target as HTMLElement).closest("[data-tab]")?.getAttribute("data-tab") as Tab | null;
        if (owner && owner !== tab) {
          onTab(owner);
          setTimeout(() => form.reportValidity());
        }
      }}
      hidden={tab === "jobs"}
      className="flex flex-col gap-6"
    >
      <div role="tabpanel" id="jobs-ai" data-tab="ai" hidden={tab !== "ai"}>
        <Panel
          title={t.admin.jobs.aiTitle}
          action={
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ready ? "bg-ok-soft text-ok" : "bg-gold-soft text-gold-text"}`}>
              {ready ? t.admin.jobs.aiReady : t.admin.jobs.aiMissing}
            </span>
          }
        >
          <div className="grid gap-4 border-b border-line-soft bg-surface-2/50 p-5 text-sm md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold">{t.admin.jobs.aiUses}</span>
              <ul className="list-disc space-y-1 pl-5 text-dim">
                {t.admin.jobs.aiUseList.map((use) => (
                  <li key={use}>{use}</li>
                ))}
              </ul>
            </div>
            <p className="text-dim">{t.admin.jobs.aiWithout}</p>
          </div>
          <div className="flex flex-col gap-6 p-5">
            <Step n={1} title={t.admin.jobs.stepProvider}>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    aria-pressed={baseUrl === preset.baseUrl}
                    onClick={() => pickProvider(preset.baseUrl, preset.model)}
                    className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${baseUrl === preset.baseUrl ? "border-brand bg-brand-soft" : "border-line hover:border-brand"}`}
                  >
                    {preset.name}
                    {savedKey(preset.baseUrl) && <Check size={14} className="text-ok" aria-label={t.admin.jobs.keySaved} />}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={!PRESETS.some((p) => p.baseUrl === baseUrl)}
                  onClick={() => pickProvider("", "")}
                  className={`h-10 rounded-xl border px-3 text-sm font-semibold ${PRESETS.some((p) => p.baseUrl === baseUrl) ? "border-line hover:border-brand" : "border-brand bg-brand-soft"}`}
                >
                  {t.admin.jobs.customProvider}
                </button>
              </div>
              <span className="text-xs text-dim">{t.admin.jobs.presetHint}</span>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t.admin.jobs.baseUrl} name="baseUrl" type="url" {...NO_AUTOFILL} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required hint={t.admin.jobs.baseUrlHint} />
                <Field label={t.admin.jobs.model} name="model" {...NO_AUTOFILL} value={model} onChange={(e) => setModel(e.target.value)} required hint={t.admin.jobs.modelHint} />
              </div>
            </Step>
            <Step n={2} title={t.admin.jobs.stepKey}>
              {/* প্রোভাইডার বদলালে ঘর খালি হয়, আর দেখায় ওই প্রোভাইডারের নিজের সেভ করা key */}
              <SecretField
                key={providerKey(baseUrl)}
                label={t.admin.jobs.apiKey}
                name="apiKey"
                defaultValue={savedKey(baseUrl) ?? ""}
                {...NO_AUTOFILL}
                autoComplete="new-password"
                show={t.admin.jobs.showKey}
                hide={t.admin.jobs.hideKey}
                hint={savedKey(baseUrl) ? t.admin.jobs.keySavedHere : t.admin.jobs.noKeyForProvider}
              />
            </Step>
            <Step n={3} title={t.admin.jobs.stepTest}>
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={(e) => onTest(e.currentTarget.form)} disabled={testResult?.tone === "info"} className={`${secondaryButton} w-full sm:w-fit`}>
                  {t.admin.jobs.testConnection}
                </button>
                <span className="text-xs text-dim">{t.admin.jobs.testHint}</span>
              </div>
              {testResult && (
                <p role="status" className={`rounded-xl border px-4 py-3 text-sm break-words ${TEST_TONE[testResult.tone]}`}>
                  {testResult.text}
                </p>
              )}
            </Step>
            <Step n={4} title={t.admin.jobs.stepSave}>
              <p className="text-sm text-dim">{t.admin.jobs.stepSaveHint}</p>
            </Step>
          </div>
        </Panel>
      </div>
      <div role="tabpanel" id="jobs-telegram" data-tab="telegram" hidden={tab !== "telegram"}>
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
      </div>
      <div className="flex flex-col gap-1.5">
        <button type="submit" disabled={busy} className={`${primaryButton} w-full sm:w-fit`}>
          {t.admin.common.save}
        </button>
        <span className="text-xs text-dim">{t.admin.jobs.saveHint}</span>
      </div>
    </form>
  );
}

export default function JobsAdminPage() {
  const { t } = useAdminI18n();
  const { data, error, reload } = useAsync(loadPrivateSettings, []);
  const [tab, setTab] = useState<Tab>("jobs");
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
        {/* সেভের পরে ফর্ম আবার বসে, যাতে সেভ করা মান দেখায় */}
        {data ? (
          <SettingsForm key={JSON.stringify(data)} initial={data} onSaved={reload} tab={tab} onTab={setTab} />
        ) : (
          tab !== "jobs" && (error ? <ErrorNotice onRetry={reload} /> : <ListSkeleton rows={2} />)
        )}
      </div>
    </>
  );
}
