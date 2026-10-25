import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireEnv } from "../lib/env";
import { discoverStore, sellerStores, summarize, type StoreResult } from "./discover";
import { finishJob, startJob, type JobRun } from "./run";

// GitHub এ discover তিন ধাপে: plan (কোন দোকানগুলো) → প্রতি দোকানে আলাদা job → finish (এক বার্তা)।
// দোকানের তালিকা stores/index.ts আর sellers টেবিল থেকে, তাই নতুন দোকান যোগ করলে নিজে থেকেই job পায়
const RESULTS = ".cache/discover";

async function output(values: Record<string, string>) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join("");
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, lines);
  else process.stdout.write(lines);
}

async function plan() {
  const run = await startJob("discover");
  const active = run ? await sellerStores() : [];
  await output({ run: run ? JSON.stringify(run) : "", stores: JSON.stringify(active.map(({ store }) => store.id)) });
}

async function store(id: string) {
  const pair = (await sellerStores()).find(({ store }) => store.id === id);
  if (!pair) throw new Error(`${id}: দোকান বা বিক্রেতা পাওয়া যায়নি`);
  const result = await discoverStore(pair.store, pair.seller);
  console.log(`${id}: ${JSON.stringify(result)}`);
  await mkdir(RESULTS, { recursive: true });
  await writeFile(join(RESULTS, `${id}.json`), JSON.stringify(result));
}

async function finish() {
  const run = JSON.parse(requireEnv("DISCOVER_RUN")) as JobRun;
  const expected = (JSON.parse(requireEnv("DISCOVER_STORES")) as string[]).length;
  const files = (await readdir(RESULTS).catch(() => [] as string[])).filter((file) => file.endsWith(".json"));
  const results = await Promise.all(files.map(async (file) => JSON.parse(await readFile(join(RESULTS, file), "utf8")) as StoreResult));
  await finishJob(run, () => summarize(results, run.startedAt, expected));
}

export async function discoverStep(step: string, arg?: string) {
  if (step === "plan") return plan();
  if (step === "store" && arg) return store(arg);
  if (step === "finish") return finish();
  throw new Error("usage: worker discover [plan | store <id> | finish]");
}
