import { db, must } from "../lib/db";
import { message } from "../lib/errors";
import { alert } from "../lib/telegram";

export type JobId = "prices" | "discover" | "promos" | "rebuild";

interface JobRow {
  name: string;
  enabled: boolean;
  run_requested_at: string | null;
  last_run_at: string | null;
}

export async function runJob(id: JobId, work: () => Promise<string>) {
  const job = (await must(db().from("jobs").select("name, enabled, run_requested_at, last_run_at").eq("id", id).single())) as JobRow;
  const requested = Boolean(job.run_requested_at && (!job.last_run_at || job.run_requested_at > job.last_run_at));
  const manual = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  if (!job.enabled && !requested && !manual) {
    console.log(`${id}: paused, skipping`);
    return;
  }

  const startedAt = new Date().toISOString();
  const run = (await must(db().from("job_runs").insert({ job_id: id, status: "running", started_at: startedAt }).select("id").single())) as { id: number };
  await must(db().from("jobs").update({ last_run_at: startedAt, last_status: "running", run_requested_at: null }).eq("id", id));

  let status = "ok";
  let text: string;
  try {
    text = await work();
  } catch (error) {
    status = "failed";
    text = message(error);
    process.exitCode = 1;
  }
  console.log(`${id}: ${status}: ${text}`);

  const finishedAt = new Date().toISOString();
  await must(db().from("job_runs").update({ status, message: text, finished_at: finishedAt }).eq("id", run.id));
  await must(db().from("jobs").update({ last_status: status, last_message: text }).eq("id", id));
  if (status === "failed") await alert(`সাশ্রয়: "${job.name}" ব্যর্থ\n${text}`).catch((error) => console.error(message(error)));
}
