"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Field, SecretField } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { SpecialSyncPanel } from "@/components/admin/SpecialSyncPanel";
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

function FlowPanel() {
  const { t, num } = useAdminI18n();
  return (
    <Panel title={t.admin.jobs.flowTitle}>
      <ol className="grid gap-px bg-line-soft sm:grid-cols-2 xl:grid-cols-4">
        {t.admin.jobs.flow.map((step, i) => (
          <li key={step.title} className="flex gap-3 bg-surface px-5 py-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-ink">{num(i + 1)}</span>
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">{step.title}</span>
              <span className="text-[13px] text-dim">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

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

function JobStatus({ state }: { state: JobState }) {
  const { t } = useAdminI18n();
  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[state]}`}>
      {(state === "running" || state === "queued") && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
      {t.admin.jobs.status[state]}
    </span>
  );
}

function JobsPanel() {
  const { t, ago } = useAdminI18n();
  const { busy, run } = useAdminAction();
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
      {active && <p className="flex items-center gap-2 border-b border-line-soft bg-brand-soft px-5 py-2.5 text-[13px] text-brand-text">{t.admin.jobs.autoRefresh}</p>}
      <ul className="divide-y divide-line-soft">
        {data.map((job) => {
          const info = t.admin.jobs.info[job.id as keyof typeof t.admin.jobs.info];
          const state = jobState(job, now);
          const failed = state === "failed";
          return (
            <li key={job.id} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-wrap items-start gap-4">
                <Toggle
                  label={t.admin.jobs.enabledAria(info?.name ?? job.name)}
                  checked={job.enabled}
                  disabled={busy}
                  onChange={async (enabled) => {
                    if (await run(() => setJobEnabled(job, enabled), enabled ? t.admin.jobs.enabledToast : t.admin.jobs.disabledToast)) reload();
                  }}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {info?.name ?? job.name}
                    <JobStatus state={state} />
                    {AI_JOBS.has(job.id) && (
                      <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-text">
                        <Sparkles size={12} aria-hidden="true" />
                        {t.admin.jobs.usesAi}
                      </span>
                    )}
                  </p>
                  {info && <p className="text-sm">{info.what}</p>}
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
              </div>
              {failed && info && (
                <p className="rounded-lg border border-sale/20 bg-sale-soft px-3.5 py-2.5 text-[13px] text-ink">
                  <strong>{t.admin.jobs.whatToDo}: </strong>
                  {info.ifFails}{" "}
                  <Link href="/admin/logs/" className="font-semibold text-brand underline-offset-2 hover:underline">
                    {t.admin.nav.logs}
                  </Link>
                </p>
              )}
              {state === "stuck" && (
                <p className="rounded-lg border border-gold/30 bg-gold-soft px-3.5 py-2.5 text-[13px] text-ink">{t.admin.jobs.stuckHint}</p>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// ব্রাউজার/পাসওয়ার্ড ম্যানেজার এই ফর্মকে লগইন ভেবে model এ ইমেইল আর key তে পাসওয়ার্ড বসিয়ে দেয়
const NO_AUTOFILL = { autoComplete: "off", "data-1p-ignore": true, "data-lpignore": "true", "data-form-type": "other" } as const;

// AI আর Telegram একই ফর্মে, দুই ট্যাবেই মাউন্ট থাকে যাতে ট্যাব বদলালে লেখা না হারায়
function SettingsForm({ initial, onSaved, tab, onTab }: { initial: PrivateSettings; onSaved: () => void; tab: Tab; onTab: (tab: Tab) => void }) {
  const { t } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState("");
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
    if (!llm.apiKey) return setTestResult(t.admin.jobs.testNeedsKey);
    setTestResult(t.admin.jobs.testing);
    try {
      const reply = await testLlm(llm);
      setTestResult(t.admin.jobs.testOk(reply));
    } catch (error) {
      setTestResult(t.admin.jobs.testFailed((error as Error).message));
    }
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
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-semibold">{t.admin.jobs.presets}</span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setBaseUrl(preset.baseUrl);
                      setModel(preset.model);
                    }}
                    className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold ${baseUrl === preset.baseUrl ? "border-brand bg-brand-soft" : "border-line hover:border-brand"}`}
                  >
                    {preset.name}
                    {savedKey(preset.baseUrl) && <Check size={14} className="text-ok" aria-label={t.admin.jobs.keySaved} />}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setBaseUrl("");
                    setModel("");
                  }}
                  className={`h-9 rounded-lg border px-3 text-sm font-semibold ${PRESETS.some((p) => p.baseUrl === baseUrl) ? "border-line hover:border-brand" : "border-brand bg-brand-soft"}`}
                >
                  {t.admin.jobs.customProvider}
                </button>
              </div>
              <span className="text-xs text-dim">{t.admin.jobs.presetHint}</span>
            </div>
            <div className="md:col-span-2">
              <Field label={t.admin.jobs.baseUrl} name="baseUrl" type="url" {...NO_AUTOFILL} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required hint={t.admin.jobs.baseUrlHint} />
            </div>
            <Field label={t.admin.jobs.model} name="model" {...NO_AUTOFILL} value={model} onChange={(e) => setModel(e.target.value)} required />
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
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <button type="button" onClick={(e) => onTest(e.currentTarget.form)} className={secondaryButton}>
                {t.admin.jobs.testConnection}
              </button>
              {testResult && <p className="text-sm">{testResult}</p>}
            </div>
          </div>
        </Panel>
      </div>
      <div role="tabpanel" id="jobs-telegram" data-tab="telegram" hidden={tab !== "telegram"}>
        <Panel title={t.admin.jobs.telegramTitle}>
          <p className="border-b border-line-soft px-5 py-3 text-sm text-dim">{t.admin.jobs.telegramHint}</p>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field
              label={t.admin.jobs.botToken}
              name="telegramBotToken"
              type="password"
              {...NO_AUTOFILL}
              autoComplete="new-password"
              hint={initial.telegramBotToken ? t.admin.jobs.secretSaved(initial.telegramBotToken) : undefined}
            />
            <Field label={t.admin.jobs.chatId} name="alertChatId" {...NO_AUTOFILL} defaultValue={initial.alertChatId ?? ""} />
          </div>
        </Panel>
      </div>
      <button type="submit" disabled={busy} className={`${primaryButton} self-start`}>
        {t.admin.common.save}
      </button>
    </form>
  );
}

export default function JobsAdminPage() {
  const { t } = useAdminI18n();
  const { data, error, reload } = useAsync(loadPrivateSettings, []);
  const [tab, setTab] = useState<Tab>("jobs");
  return (
    <>
      <PageTitle title={t.admin.jobs.title} />
      <div className="flex flex-col gap-6">
        <Tabs tabs={TABS.map((id) => ({ id, label: t.admin.jobs.tabs[id] }))} active={tab} onChange={setTab} label={t.admin.jobs.title} idPrefix="jobs" />
        <div role="tabpanel" id="jobs-jobs" hidden={tab !== "jobs"} className="flex flex-col gap-6">
          <FlowPanel />
          <JobsPanel />
          <SpecialSyncPanel onJobTriggered={reload} />
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
