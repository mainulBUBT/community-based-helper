import type { Job } from "@/types/admin";

const STUCK_AFTER = 2 * 3600000;

export type JobState = "ok" | "running" | "queued" | "stuck" | "failed" | "paused" | "never";

export function jobState(job: Job, now: number): JobState {
  if (!job.enabled) return "paused";
  if (job.runRequestedAt && (!job.lastRunAt || job.runRequestedAt > job.lastRunAt)) return "queued";
  if (job.lastStatus === "running") return job.lastRunAt && now - new Date(job.lastRunAt).getTime() > STUCK_AFTER ? "stuck" : "running";
  if (!job.lastRunAt) return "never";
  return job.lastStatus === "failed" ? "failed" : "ok";
}
