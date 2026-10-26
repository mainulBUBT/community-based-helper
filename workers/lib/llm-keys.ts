// এক প্রোভাইডারের কয়েকটা key (কমা, ফাঁকা জায়গা বা নতুন লাইনে আলাদা)। প্রতিবার পালা করে পরেরটা,
// আর কোটা শেষ (429) হলে সেই key এই run এ আর নয় — একটা key এর দৈনিক সীমায় পুরো কাজ থামে না।

const spent = new Set<string>();
let turn = 0;

export const splitKeys = (apiKey: string | null | undefined) => (apiKey ?? "").split(/[\s,]+/).filter(Boolean);

export function liveKeys(apiKey: string | null | undefined): string[] {
  const keys = splitKeys(apiKey).filter((key) => !spent.has(key));
  if (keys.length < 2) return keys;
  const start = turn++ % keys.length;
  return [...keys.slice(start), ...keys.slice(0, start)];
}

export function markSpent(key: string) {
  spent.add(key);
}

// প্রতিটা key দিয়ে পালা করে চেষ্টা; 429 এ পরের key, অন্য উত্তর (ভালো বা খারাপ) ফেরত
export async function withKeys(apiKey: string | null | undefined, call: (key: string) => Promise<Response>): Promise<Response> {
  const keys = liveKeys(apiKey);
  if (!keys.length) throw new Error("LLM key নেই, অথবা সব key এর কোটা শেষ");
  let last: Response | null = null;
  for (const key of keys) {
    last = await call(key);
    if (last.status !== 429) return last;
    markSpent(key);
  }
  return last!;
}
