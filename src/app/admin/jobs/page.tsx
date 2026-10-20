"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { listJobs, requestJobRun, setJobEnabled } from "@/services/admin/jobs";
import { loadPrivateSettings, savePrivateSettings, testLlm } from "@/services/admin/settings";
import type { PrivateSettings } from "@/types/admin";
import { timeAgo } from "@/utils/format";

function JobsPanel() {
  const { data, loading, reload } = useAsync(listJobs, []);
  if (loading || !data) return <ListSkeleton rows={3} />;
  return (
    <Panel title="নিয়মিত কাজ">
      <ul className="divide-y divide-line-soft">
        {data.map((job) => (
          <li key={job.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <Toggle
              label={`${job.name} চালু`}
              checked={job.enabled}
              onChange={async (enabled) => {
                await setJobEnabled(job, enabled);
                showToast(enabled ? "কাজটা চালু হলো" : "কাজটা থামানো হলো");
                reload();
              }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {job.name}
                {job.lastStatus === "failed" && <Badge tone="brand">শেষবার ব্যর্থ</Badge>}
              </p>
              <p className="text-[13px] text-dim">
                {job.runner} এ, {job.schedule}। {job.lastRunAt ? `শেষ চলেছে ${timeAgo(job.lastRunAt)}` : "এখনো চলেনি"}
                {job.lastMessage ? `: ${job.lastMessage}` : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={!job.enabled || Boolean(job.runRequestedAt)}
              onClick={async () => {
                await requestJobRun(job);
                showToast("পরের সুযোগেই চালানো হবে");
                reload();
              }}
              className={secondaryButton}
            >
              {job.runRequestedAt ? "চালানোর অপেক্ষায়" : "এখনই চালান"}
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function SettingsForm({ initial }: { initial: PrivateSettings }) {
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
      await savePrivateSettings(read(event.currentTarget), "AI ও সতর্কবার্তা");
      showToast("সেভ হলো");
    } catch {
      showToast("সেভ করা গেল না");
    } finally {
      setBusy(false);
    }
  }

  async function onTest(form: HTMLFormElement | null) {
    if (!form) return;
    setTestResult("পরীক্ষা চলছে…");
    try {
      const reply = await testLlm(read(form).llm);
      setTestResult(`কাজ করছে। উত্তর এসেছে: ${reply}`);
    } catch (error) {
      setTestResult(`কাজ করছে না: ${(error as Error).message}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Panel title="AI (OpenAI-compatible)">
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Base URL" name="baseUrl" type="url" defaultValue={initial.llm.baseUrl} required hint="Gemini, Groq, OpenRouter, Cloudflare Workers AI বা Ollama, যেটার /v1 ঠিকানা দেবেন" />
          </div>
          <Field label="মডেল" name="model" defaultValue={initial.llm.model} required />
          <Field label="API key" name="apiKey" type="password" autoComplete="off" defaultValue={initial.llm.apiKey ?? ""} />
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <button type="button" onClick={(e) => onTest(e.currentTarget.form)} className={secondaryButton}>
              সংযোগ পরীক্ষা করুন
            </button>
            {testResult && <p className="text-sm">{testResult}</p>}
          </div>
        </div>
      </Panel>
      <Panel title="Telegram সতর্কবার্তা">
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Bot token" name="telegramBotToken" type="password" autoComplete="off" defaultValue={initial.telegramBotToken ?? ""} />
          <Field label="কোন chat এ যাবে (chat id)" name="alertChatId" defaultValue={initial.alertChatId ?? ""} />
        </div>
      </Panel>
      <button type="submit" disabled={busy} className={`${primaryButton} self-start`}>
        সেভ করুন
      </button>
    </form>
  );
}

export default function JobsAdminPage() {
  const { data } = useAsync(loadPrivateSettings, []);
  return (
    <>
      <PageTitle title="কাজ ও AI" />
      <div className="flex flex-col gap-6">
        <JobsPanel />
        {data ? <SettingsForm initial={data} /> : <ListSkeleton rows={2} />}
      </div>
    </>
  );
}
