import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireEnv } from "../lib/env";
import { loadCatalog, requestedAfter } from "../services/catalog";
import { isLocalUrl } from "../stores/local";
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
  // ঘরের IP থেকে পড়ার দোকান GitHub এ নয়; এদের খোঁজে local_discover
  const sellers = run ? (await sellerStores()).filter(({ store }) => !isLocalUrl(store.origin)) : [];
  // শুধু সেই দোকান, যার শেষ খোঁজার পরে কোনো পণ্য চাওয়া হয়েছে; নতুন দোকান কখনো খোঁজা হয়নি বলে নিজেই আসে।
  // আটকানো দোকানও শেষ ধরা হয়, তাই একটাও দাম না পেলেও প্রতি run এ আসে না
  const catalog = run ? await loadCatalog() : [];
  const active = sellers.filter(({ seller }) => catalog.some((p) => requestedAfter(p, seller.discoveredAt)));
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
