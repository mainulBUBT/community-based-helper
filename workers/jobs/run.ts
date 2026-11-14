import { db, must } from "../lib/db";
import { message } from "../lib/errors";
import { privateSettings } from "../lib/settings";
import { alert } from "../lib/telegram";

export type JobId = "prices" | "local_prices" | "local_discover" | "discover" | "promos" | "rebuild";

interface JobRow {
  name: string;
  enabled: boolean;
  run_requested_at: string | null;
  last_run_at: string | null;
}

export interface JobRun {
  id: number;
  job: JobId;
  startedAt: string;
}

export async function startJob(id: JobId): Promise<JobRun | null> {
  const job = (await must(db().from("jobs").select("name, enabled, run_requested_at, last_run_at").eq("id", id).single())) as JobRow;
  const requested = Boolean(job.run_requested_at && (!job.last_run_at || job.run_requested_at > job.last_run_at));
  const manual = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  if (!job.enabled && !requested && !manual) {
    console.log(`${id}: paused, skipping`);
    return null;
  }

  // আগের run কে GitHub সময় শেষে মেরে ফেললে সেটা "running" থেকে যায়
  const stale = new Date(Date.now() - 2 * 3600_000).toISOString();
  await must(
    db().from("job_runs").update({ status: "failed", message: "শেষ হওয়ার আগেই থেমে গেছে (সময় শেষ)", finished_at: new Date().toISOString() }).eq("job_id", id).eq("status", "running").lt("started_at", stale),
  );

  const startedAt = new Date().toISOString();
  const run = (await must(db().from("job_runs").insert({ job_id: id, status: "running", started_at: startedAt }).select("id").single())) as { id: number };
  await must(db().from("jobs").update({ last_run_at: startedAt, last_status: "running", run_requested_at: null }).eq("id", id));
  return { id: run.id, job: id, startedAt };
}

export async function previousMessage(run: JobRun): Promise<string | null> {
  const { data } = await db().from("job_runs").select("message").eq("job_id", run.job).neq("status", "running").lt("id", run.id).order("id", { ascending: false }).limit(1);
  return data?.[0]?.message ?? null;
}

export async function finishJob(run: JobRun, work: () => Promise<string>) {
  let status = "ok";
  let text: string;
  try {
    text = await work();
  } catch (error) {
    status = "failed";
    text = message(error);
    process.exitCode = 1;
  }
  console.log(`${run.job}: ${status}: ${text}`);

  const finishedAt = new Date().toISOString();
  await must(db().from("job_runs").update({ status, message: text, finished_at: finishedAt }).eq("id", run.id));
  await must(db().from("jobs").update({ last_status: status, last_message: text }).eq("id", run.job));
  // অপশন চালু থাকলে GitHub-এর কাজের প্রথম ব্যর্থতা পাহারাদার নিজে আবার চালায়, তাই Telegram-এ শুধু তার জরুরি খবর যায়
  const { managerAuto } = await privateSettings().catch(() => ({ managerAuto: false }));
  if (status === "failed" && (!managerAuto || run.job.startsWith("local_"))) {
    const { name } = (await must(db().from("jobs").select("name").eq("id", run.job).single())) as { name: string };
    await alert(`দরদাম: "${name}" ব্যর্থ\n${text}`).catch((error) => console.error(message(error)));
  }
}

export async function runJob(id: JobId, work: (run: JobRun) => Promise<string>) {
  const run = await startJob(id);
  if (run) await finishJob(run, () => work(run));
}
