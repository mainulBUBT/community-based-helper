// এক প্রোভাইডারের কয়েকটা key (কমা, ফাঁকা জায়গা বা নতুন লাইনে আলাদা)। প্রতিবার পালা করে পরেরটা।
// 429 দুই রকম: মিনিটের সীমা হলে থেমে আবার একই key; দিনের কোটা শেষ হলে সেই key এই run এ আর নয়।
import { sleep } from "./sleep";

const spent = new Set<string>();
let turn = 0;

// সব AI ডাক একটা একটা করে, মাঝে ফাঁক রেখে: দোকানগুলো একসাথে চললেও ফ্রি tier এর মিনিটের সীমায় পড়ে না
const GAP = Number(process.env.LLM_MIN_GAP_MS ?? 4000);
const RATE_RETRIES = 3;
let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

export const splitKeys = (apiKey: string | null | undefined) => (apiKey ?? "").split(/[\s,]+/).filter(Boolean);

// key এর কোটা মডেল ধরে (Gemini-তে একই key এর এক মডেল শেষ হলেও অন্যটা চলে), তাই scope = মডেল
export class QuotaError extends Error {}

export function liveKeys(apiKey: string | null | undefined, scope = ""): string[] {
  const keys = splitKeys(apiKey).filter((key) => !spent.has(`${scope}|${key}`));
  if (keys.length < 2) return keys;
  const start = turn++ % keys.length;
  return [...keys.slice(start), ...keys.slice(0, start)];
}

export function markSpent(key: string, scope = "") {
  spent.add(`${scope}|${key}`);
}

// Gemini উত্তরে বলে কোন সীমা ("...PerDay...") আর কতক্ষণ পরে ("retryDelay": "23s")
async function limitOf(res: Response): Promise<{ daily: boolean; wait: number }> {
  const text = await res.clone().text().catch(() => "");
  const seconds = Number(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/.exec(text)?.[1] ?? res.headers.get("retry-after") ?? 30);
  return { daily: /PerDay/i.test(text), wait: Math.min(90, Math.max(5, seconds)) * 1000 };
}

function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    await sleep(Math.max(0, lastCall + GAP - Date.now()));
    try {
      return await task();
    } finally {
      lastCall = Date.now();
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

// প্রতিটা key দিয়ে পালা করে চেষ্টা; 429 ছাড়া অন্য উত্তর (ভালো বা খারাপ) ফেরত
export async function withKeys(apiKey: string | null | undefined, call: (key: string) => Promise<Response>, scope = ""): Promise<Response> {
  if (!splitKeys(apiKey).length) throw new Error("LLM key নেই");
  const keys = liveKeys(apiKey, scope);
  if (!keys.length) throw new QuotaError("AI-র আজকের কোটা শেষ (সব key এর)");
  let last: Response | null = null;
  for (const key of keys) {
    for (let attempt = 0; ; attempt++) {
      last = await serial(() => call(key));
      if (last.status !== 429) return last;
      const { daily, wait } = await limitOf(last);
      if (daily || attempt >= RATE_RETRIES) {
        markSpent(key, scope);
        break;
      }
      lastCall = Math.max(lastCall, Date.now() + wait - GAP);
      await sleep(wait);
    }
  }
  return last!;
}
