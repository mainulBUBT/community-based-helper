import { spawn } from "node:child_process";
import { db } from "./lib/db";
import { message } from "./lib/errors";

// নিজের মেশিনে (ম্যাক, PC, Termux) চলে; GitHub যেসব দোকানে 403 পায় সেগুলো ঘরের IP থেকে।
// দুটো জব: local_prices (দাম আপডেট) আর local_discover (নতুন পণ্য ওই দোকানগুলোতে খোঁজা)।
// চালায় যখন (ক) অ্যাডমিনে "এখনই চালান" দেওয়া হয় (jobs.run_requested_at), (খ) local_discover এর শেষ সফল run এর পর নতুন পণ্য এসেছে,
// (গ) `--every <ঘণ্টা>` দিলে local_prices ওই ঘণ্টা পরপর। ফল অ্যাডমিনের জব-তালিকায়।
const POLL_MS = 60_000;
const DEFAULT_DAYS = 3;

const everyIndex = process.argv.indexOf("--every");
const everyHours = everyIndex > 0 ? Number(process.argv[everyIndex + 1]) : 0;
const once = process.argv.includes("--once");

interface JobRow {
  enabled: boolean;
  run_requested_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
}

async function job(id: string): Promise<JobRow> {
  const { data, error } = await db().from("jobs").select("enabled, run_requested_at, last_run_at, last_status").eq("id", id).single();
  if (error || !data) throw new Error(error?.message ?? `${id} জব নেই (supabase/batches/2026-11-04-local-prices-job.sql চালাতে হবে)`);
  return data as JobRow;
}

async function newProducts(): Promise<number> {
  const { data } = await db().from("job_runs").select("started_at").eq("job_id", "local_discover").eq("status", "ok").order("started_at", { ascending: false }).limit(1);
  const since = data?.[0]?.started_at ?? new Date(Date.now() - DEFAULT_DAYS * 86_400_000).toISOString();
  const { count } = await db().from("products").select("id", { count: "exact", head: true }).gt("discover_requested_at", since);
  return count ?? 0;
}

async function due(id: "local_prices" | "local_discover"): Promise<string | null> {
  const row = await job(id);
  if (row.last_status === "running" && row.last_run_at && Date.now() - Date.parse(row.last_run_at) < 2 * 3600_000) return null;
  if (row.run_requested_at && (!row.last_run_at || row.run_requested_at > row.last_run_at)) return "অ্যাডমিনের অনুরোধ";
  if (!row.enabled) return null;
  if (id === "local_discover" && (await newProducts()) > 0) return "নতুন পণ্য এসেছে";
  if (id === "local_prices" && everyHours > 0 && (!row.last_run_at || Date.now() - Date.parse(row.last_run_at) > everyHours * 3600_000)) return `${everyHours} ঘণ্টা পার`;
  return null;
}

function run(id: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--env-file-if-exists=.env.local", "--import", "tsx", "workers/cli.ts", id], { stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function main() {
  console.log(`লোকাল রানার চালু${everyHours ? `, local_prices প্রতি ${everyHours} ঘণ্টায়` : ""}; অ্যাডমিনের অনুরোধ আর নতুন পণ্যের অপেক্ষায় (Ctrl+C বন্ধ)`);
  for (;;) {
    for (const id of ["local_discover", "local_prices"] as const) {
      try {
        const reason = await due(id);
        if (reason) {
          console.log(`${new Date().toLocaleTimeString()} ${id}: ${reason}`);
          await run(id);
        }
      } catch (error) {
        console.error(`${new Date().toLocaleTimeString()} ${id}: ${message(error)}`);
      }
    }
    if (once) return;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

main().then(() => process.exit(0));
