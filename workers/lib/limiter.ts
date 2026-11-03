import { sleep } from "./sleep";

// প্রতি দোকানে একবারে একটা অনুরোধ, শুরুর মাঝে বিরতি — চাপ দিলে ছোট দোকান 429 দিয়ে আটকে দেয়।
// যাদের ঘণ্টার সীমা আরও কড়া তাদের `pace` দিয়ে লম্বা বিরতি। www থাকা-না-থাকা একই দোকান এক লেনে।
const MAX_CONCURRENT = 1;
const GAP_MS = 2000;

interface HostState {
  active: number;
  nextStart: number;
  waiting: (() => void)[];
}

const site = (host: string) => host.replace(/^www\./, "");
const gaps = new Map<string, number>();

export function pace(host: string, gapMs: number) {
  gaps.set(site(host), gapMs);
}

const hosts = new Map<string, HostState>();

function state(host: string): HostState {
  const key = site(host);
  let s = hosts.get(key);
  if (!s) hosts.set(key, (s = { active: 0, nextStart: 0, waiting: [] }));
  return s;
}

async function acquire(host: string) {
  const s = state(host);
  if (s.active < MAX_CONCURRENT) s.active++;
  else await new Promise<void>((resolve) => s.waiting.push(resolve));
  const wait = s.nextStart - Date.now();
  s.nextStart = Math.max(Date.now(), s.nextStart) + (gaps.get(site(host)) ?? GAP_MS);
  if (wait > 0) await sleep(wait);
}

function release(host: string) {
  const s = state(host);
  const next = s.waiting.shift();
  if (next) next();
  else s.active--;
}

export async function limited<T>(host: string, task: () => Promise<T>): Promise<T> {
  await acquire(host);
  try {
    return await task();
  } finally {
    release(host);
  }
}
