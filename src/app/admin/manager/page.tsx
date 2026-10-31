"use client";

import { Clock, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { PageTitle, Panel } from "@/components/admin/Panel";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { listJobs } from "@/services/admin/jobs";
import { askManager, loadManager, managerDeployed } from "@/services/admin/manager";
import type { Job, ManagerMessage, ManagerStatus, ManagerStep } from "@/types/admin";
import { jobState, type JobState } from "@/utils/job-state";

const DOT = { ok: "bg-[#32d583]", bad: "bg-[#f97066]", wait: "bg-[#fdb022]", idle: "bg-[#667085]" };
type Dot = keyof typeof DOT;

const JOB_DOT: Record<JobState, Dot> = { ok: "ok", running: "wait", queued: "wait", stuck: "bad", failed: "bad", paused: "idle", never: "idle" };

function Status({ tone, children }: { tone: Dot; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className={`size-2 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function Step({ step }: { step: ManagerStep }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30 font-mono text-[12px]">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-1.5 break-all text-[#98a2b3]">
        <span className="text-live">▸</span> {step.call}
      </div>
      <div className="px-3 py-1.5 text-[#d0d5dd]">
        <Status tone={step.tone}>{step.result}</Status>
      </div>
    </div>
  );
}

function Message({ message }: { message: ManagerMessage }) {
  const { t } = useAdminI18n();
  if (message.role === "schedule")
    return (
      <div className="flex items-center gap-2 self-center rounded-full bg-white/5 px-3 py-1 text-[11px] text-[#98a2b3]">
        <Clock size={12} aria-hidden="true" /> {t.admin.manager.scheduled}
      </div>
    );
  if (message.role === "user") return <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-[#0f766e] px-4 py-2.5 text-[14px] whitespace-pre-line">{message.text}</div>;
  return (
    <div className="flex gap-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-live/15 text-sm" aria-hidden="true">
        🦉
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-[14px] leading-relaxed text-[#e4e7ec]">
        {message.steps.map((step, i) => (
          <Step key={i} step={step} />
        ))}
        <p className="whitespace-pre-line">{message.text}</p>
      </div>
    </div>
  );
}

function Side({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#0c111d] p-4">
      <h3 className="mb-3 text-[11px] font-semibold tracking-wider text-[#667085] uppercase">{title}</h3>
      <div className="flex flex-col gap-2.5 text-[13px] text-[#d0d5dd]">{children}</div>
    </section>
  );
}

function Row({ tone, name, value }: { tone: Dot; name: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Status tone={tone}>{name}</Status>
      <span className="truncate text-right text-[12px] text-[#98a2b3]">{value}</span>
    </div>
  );
}

function Sidebar({ status, jobs }: { status: ManagerStatus; jobs: Job[] }) {
  const { t, lang, num, ago } = useAdminI18n();
  const m = t.admin.manager;
  const [now] = useState(() => Date.now());
  const report = new Date(status.nextReport).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" });
  return (
    <aside className="flex flex-col gap-3 border-t border-white/10 bg-black/10 p-3 lg:border-t-0">
      <Side title={m.connections}>
        <Row tone={status.telegram ? "ok" : "bad"} name="Telegram" value={status.telegram ? m.linked : m.notLinked} />
        {!status.telegram && <p className="text-[12px] text-[#98a2b3]">{m.telegramHint}</p>}
        <Row tone={status.models ? "ok" : "bad"} name={m.model} value={status.models ? m.modelValue(num(status.models)) : m.noModel} />
        <Row tone="ok" name={m.database} value={m.databaseValue} />
      </Side>
      <Side title={m.workers}>
        {jobs.map((job) => {
          const state = jobState(job, now);
          const name = t.admin.jobs.info[job.id as keyof typeof t.admin.jobs.info]?.name ?? job.name;
          return <Row key={job.id} tone={JOB_DOT[state]} name={name} value={state === "ok" && job.lastRunAt ? ago(job.lastRunAt) : t.admin.jobs.status[state]} />;
        })}
      </Side>
      <Side title={m.schedule}>
        <Row tone="idle" name={m.morningReport} value={report} />
      </Side>
    </aside>
  );
}

function Console({ status, jobs }: { status: ManagerStatus; jobs: Job[] }) {
  const { t } = useAdminI18n();
  const m = t.admin.manager;
  const { busy, run } = useAdminAction();
  const [messages, setMessages] = useState(status.history);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, pending]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setPending(message);
    await run(async () => {
      const added = await askManager(message);
      setMessages((prev) => [...prev, ...added]);
    });
    setPending(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101828] text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#32d583] opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#32d583]" />
          </span>
          <span className="font-mono text-sm font-semibold">dordam-manager</span>
          <span className="text-xs text-[#98a2b3]">· {m.online}</span>
        </div>
        <span className="truncate rounded-md bg-white/8 px-2 py-0.5 font-mono text-[11px] text-[#d0d5dd]">{status.model ?? m.noModel}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px]">
        <div className="flex min-h-[520px] flex-col border-white/10 lg:border-r">
          <div className="flex max-h-[640px] flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
            {!messages.length && !pending && <p className="self-center py-10 text-center text-[13px] text-[#98a2b3]">{m.empty}</p>}
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {pending && (
              <>
                <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-[#0f766e] px-4 py-2.5 text-[14px] whitespace-pre-line">{pending}</div>
                <div className="flex items-center gap-2 text-[13px] text-[#98a2b3]">
                  <Loader2 size={14} className="animate-spin text-live" aria-hidden="true" /> {m.thinking}
                </div>
              </>
            )}
            <div ref={end} />
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              placeholder={m.placeholder}
              aria-label={m.placeholder}
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-[14px] text-white placeholder:text-[#667085] focus:border-live focus:outline-none"
            />
            <button type="submit" disabled={busy || !text.trim()} aria-label={m.send} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-live text-[#042f2c] disabled:opacity-50">
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </div>

        <Sidebar status={status} jobs={jobs} />
      </div>
    </div>
  );
}

export default function ManagerPage() {
  const { t } = useAdminI18n();
  const m = t.admin.manager;
  const status = useAsync(loadManager, []);
  const jobs = useAsync(listJobs, []);

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={m.title} subtitle={m.subtitle} />
      {!managerDeployed ? (
        <Panel>
          <div className="flex flex-col gap-1 px-5 py-4">
            <p className="font-semibold">{m.notDeployedTitle}</p>
            <p className="text-sm text-dim">{m.notDeployedBody}</p>
          </div>
        </Panel>
      ) : status.error && !status.data ? (
        <ErrorNotice onRetry={status.reload} />
      ) : !status.data || !jobs.data ? (
        <ListSkeleton rows={4} />
      ) : (
        <Console status={status.data} jobs={jobs.data} />
      )}
    </div>
  );
}
