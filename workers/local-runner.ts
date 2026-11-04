import { spawn } from "node:child_process";
import { db } from "./lib/db";
import { message } from "./lib/errors";

// নিজের মেশিনে (ম্যাক, PC, Termux) চলে; অ্যাডমিন থেকে `local_prices` এর "এখনই চালান" দিলে (jobs.run_requested_at) সেটা ধরে
// ঘরের IP থেকে কাজ চালায়। `--every <ঘণ্টা>` দিলে অনুরোধ ছাড়াও ওই ঘণ্টা পরপর। ফল অ্যাডমিনের জব-তালিকায় যায়।
const JOB = "local_prices";
const POLL_MS = 60_000;

const everyIndex = process.argv.indexOf("--every");
const everyHours = everyIndex > 0 ? Number(process.argv[everyIndex + 1]) : 0;
const once = process.argv.includes("--once");

interface JobRow {
  enabled: boolean;
  run_requested_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
}

async function due(): Promise<string | null> {
  const { data, error } = await db().from("jobs").select("enabled, run_requested_at, last_run_at, last_status").eq("id", JOB).single();
  if (error || !data) throw new Error(error?.message ?? `${JOB} জব নেই`);
  const job = data as JobRow;
  if (job.last_status === "running" && job.last_run_at && Date.now() - Date.parse(job.last_run_at) < 2 * 3600_000) return null;
  if (job.run_requested_at && (!job.last_run_at || job.run_requested_at > job.last_run_at)) return "অ্যাডমিনের অনুরোধ";
  if (everyHours > 0 && job.enabled && (!job.last_run_at || Date.now() - Date.parse(job.last_run_at) > everyHours * 3600_000)) return `${everyHours} ঘণ্টা পার`;
  return null;
}

function run(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--env-file-if-exists=.env.local", "--import", "tsx", "workers/cli.ts", JOB], { stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function main() {
  console.log(`${JOB} রানার চালু${everyHours ? `, প্রতি ${everyHours} ঘণ্টায়` : ""}; অ্যাডমিনের অনুরোধের অপেক্ষায় (Ctrl+C বন্ধ)`);
  for (;;) {
    try {
      const reason = await due();
      if (reason) {
        console.log(`${new Date().toLocaleTimeString()} চালাচ্ছি: ${reason}`);
        await run();
      }
    } catch (error) {
      console.error(`${new Date().toLocaleTimeString()} ${message(error)}`);
    }
    if (once) return;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

main().then(() => process.exit(0));
