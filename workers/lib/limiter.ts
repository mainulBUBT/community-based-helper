import { sleep } from "./sleep";

const MAX_CONCURRENT = 2;
const GAP_MS = 1000;

interface HostState {
  active: number;
  nextStart: number;
  waiting: (() => void)[];
}

const hosts = new Map<string, HostState>();

function state(host: string): HostState {
  let s = hosts.get(host);
  if (!s) hosts.set(host, (s = { active: 0, nextStart: 0, waiting: [] }));
  return s;
}

async function acquire(host: string) {
  const s = state(host);
  if (s.active < MAX_CONCURRENT) s.active++;
  else await new Promise<void>((resolve) => s.waiting.push(resolve));
  const wait = s.nextStart - Date.now();
  s.nextStart = Math.max(Date.now(), s.nextStart) + GAP_MS;
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
