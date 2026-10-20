import { sampleJobs, sampleRuns } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { Job, JobRun } from "@/types/admin";
import { toJob, toJobRun } from "../mappers";
import { logAction } from "./audit";

export async function listJobs(): Promise<Job[]> {
  if (!supabase) return sampleJobs.map((job) => ({ ...job }));
  const { data, error } = await supabase.from("jobs").select("*").order("id");
  if (error) throw error;
  return data.map(toJob);
}

async function updateJob(job: Job, patch: Partial<Job>, row: Record<string, unknown>) {
  if (!supabase) {
    Object.assign(sampleJobs.find((j) => j.id === job.id)!, patch);
    return;
  }
  const { error } = await supabase.from("jobs").update(row).eq("id", job.id);
  if (error) throw error;
}

export async function setJobEnabled(job: Job, enabled: boolean) {
  await updateJob(job, { enabled }, { enabled });
  await logAction(enabled ? "job.enable" : "job.pause", { job: job.name });
}

export async function requestJobRun(job: Job) {
  const runRequestedAt = new Date().toISOString();
  await updateJob(job, { runRequestedAt }, { run_requested_at: runRequestedAt });
  await logAction("job.run", { job: job.name });
}

export async function listRuns(limit = 100): Promise<JobRun[]> {
  if (!supabase) return sampleRuns.slice(0, limit);
  const { data, error } = await supabase.from("job_runs").select("*").order("started_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data.map(toJobRun);
}
