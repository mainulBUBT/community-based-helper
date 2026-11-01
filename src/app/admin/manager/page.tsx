"use client";

import { ChevronDown, Clock, Loader2, Send } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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

const dhakaDay = (at: string | number) => new Date(at).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

function DayDivider({ at }: { at: string }) {
  const { t, lang } = useAdminI18n();
  const [now] = useState(() => Date.now());
  const day = dhakaDay(at);
  const label =
    day === dhakaDay(now)
      ? t.admin.manager.today
      : day === dhakaDay(now - 86_400_000)
        ? t.time.yesterday
        : new Date(at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", timeZone: "Asia/Dhaka" });
  return (
    <div className="flex items-center gap-3 text-[11px] text-[#98a2b3]">
      <span className="h-px flex-1 bg-white/10" />
      {label}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

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
      <div className="px-3 py-1.5 wrap-anywhere text-[#d0d5dd]">
        <Status tone={step.tone}>{step.result}</Status>
      </div>
    </div>
  );
}

function Message({ message }: { message: ManagerMessage }) {
  const { t, lang } = useAdminI18n();
  const time = (
    <time dateTime={message.at} className="text-[11px] text-[#667085]">
      {new Date(message.at).toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-GB", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" })}
    </time>
  );
  if (message.role === "schedule")
    return (
      <div className="flex items-center gap-2 self-center rounded-full bg-white/5 px-3 py-1 text-[11px] text-[#98a2b3]">
        <Clock size={12} aria-hidden="true" /> {t.admin.manager.scheduled} · {time}
      </div>
    );
  if (message.role === "user")
    return (
      <div className="flex max-w-[85%] flex-col items-end gap-1 self-end">
        <div className="rounded-2xl rounded-br-md bg-[#0f766e] px-4 py-2.5 text-[14px] wrap-anywhere whitespace-pre-line">{message.text}</div>
        {time}
      </div>
    );
  return (
    <div className="flex gap-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-live/15 text-sm" aria-hidden="true">
        🦉
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-[14px] leading-relaxed text-[#e4e7ec]">
        {message.steps.map((step, i) => (
          <Step key={i} step={step} />
        ))}
        <p className="wrap-anywhere whitespace-pre-line">{message.text}</p>
        {time}
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
      <span className="shrink-0 text-right text-[12px] text-[#98a2b3]">{value}</span>
    </div>
  );
}

function Sidebar({ status, jobs }: { status: ManagerStatus; jobs: Job[] }) {
  const { t, lang, num, ago } = useAdminI18n();
  const m = t.admin.manager;
  const [now] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const trouble = status.telegram !== "ok" || !status.models || jobs.some((job) => JOB_DOT[jobState(job, now)] === "bad");
  const report = new Date(status.nextReport).toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" });
  return (
    <aside className="min-w-0 border-t border-white/10 bg-black/10 xl:overflow-y-auto xl:border-t-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left text-[13px] text-[#d0d5dd] xl:hidden">
        <span className={`size-2 shrink-0 rounded-full ${DOT[trouble ? "bad" : "ok"]}`} aria-hidden="true" />
        <span className="flex-1">{m.details}</span>
        <ChevronDown size={16} className={open ? "rotate-180" : ""} aria-hidden="true" />
      </button>
      <div className={`${open ? "grid" : "hidden"} gap-3 px-3 pb-3 md:grid-cols-2 xl:flex xl:flex-col xl:p-3`}>
        <Side title={m.connections}>
          <Row tone={status.telegram === "ok" ? "ok" : "bad"} name="Telegram" value={status.telegram === "ok" ? m.linked : m.notLinked} />
          {status.telegram !== "ok" && <p className="text-[12px] text-[#98a2b3]">{status.telegram === "rejected" ? m.telegramRejected : m.telegramHint}</p>}
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
      </div>
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
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages, pending]);

  async function send(value: string) {
    const message = value.trim();
    if (!message || busy) return;
    setText("");
    setPending(message);
    const sent = await run(async () => {
      const added = await askManager(message);
      setMessages((prev) => [...prev, ...added]);
    });
    if (!sent) setText((current) => current || message);
    setPending(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send(text);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101828] text-white xl:h-[calc(100dvh-11rem)] xl:min-h-[520px]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#32d583] opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#32d583]" />
          </span>
          <span className="font-mono text-sm font-semibold">dordam-manager</span>
          <span className="text-xs text-[#98a2b3]">· {m.online}</span>
        </div>
        <span className="min-w-0 truncate rounded-md bg-white/8 px-2 py-0.5 font-mono text-[11px] text-[#d0d5dd]">{status.model ?? m.noModel}</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_300px] xl:grid-rows-[minmax(0,1fr)]">
        <div className="flex h-[72dvh] min-h-[420px] min-w-0 flex-col border-white/10 xl:h-auto xl:min-h-0 xl:border-r">
          <div ref={list} className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
            {!messages.length && !pending && <p className="self-center py-10 text-center text-[13px] text-[#98a2b3]">{m.empty}</p>}
            {messages.map((message, i) => (
              <Fragment key={message.id}>
                {dhakaDay(message.at) !== dhakaDay(messages[i - 1]?.at ?? 0) && <DayDivider at={message.at} />}
                <Message message={message} />
              </Fragment>
            ))}
            {pending && (
              <>
                <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-[#0f766e] px-4 py-2.5 text-[14px] wrap-anywhere whitespace-pre-line">{pending}</div>
                <div className="flex items-center gap-2 text-[13px] text-[#98a2b3]">
                  <Loader2 size={14} className="animate-spin text-live" aria-hidden="true" /> {m.thinking}
                </div>
              </>
            )}
          </div>

          <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-t border-white/10 px-3 pt-3 md:flex-wrap">
            {m.prompts.map((prompt) => (
              <button key={prompt} type="button" disabled={busy} onClick={() => send(prompt)} className="h-9 shrink-0 rounded-full border border-white/15 px-3 text-[13px] text-[#d0d5dd] hover:bg-white/8 disabled:opacity-50">
                {prompt}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(text);
            }}
            className="flex shrink-0 items-end gap-2 p-3"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={2000}
              enterKeyHint="send"
              placeholder={m.placeholder}
              aria-label={m.placeholder}
              className="field-sizing-content max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-base text-white placeholder:text-[#667085] focus:border-live focus:outline-none sm:text-[14px]"
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
