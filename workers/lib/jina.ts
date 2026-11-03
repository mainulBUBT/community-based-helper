import { CHALLENGE } from "./http";
import { limited, pace } from "./limiter";
import { readPage, type Page } from "../stores/page";
import type { Store } from "../stores/types";

// দোকান GitHub-এর IP আটকে রাখলে Jina Reader (r.jina.ai) নিজেদের সার্ভার দিয়ে পাতা এনে দেয়।
// প্রথমে কাঁচা HTML চাওয়া হয় — তাতে আমাদের নিজের parser-ই দাম বের করে (JSON-LD, ভার্সন-ডেটা),
// কোনো AI আন্দাজ লাগে না। দোকান সেটাতে challenge দিলে (Rokomari) দ্বিতীয়বার markdown মোডে —
// ওই পথে Jina-র নিজের পড়ার পাইপলাইন পাস করে, লেখা থেকে দাম LLM পড়ে আর সাধারণ যাচাইয়ে যায়।
// দুই মোডেই পাতা না এলে (Sumash, Gadget Breeze) সেই দোকান ওই run-এ বাদ, Gemini-র url_context-এ যায়।
// key ছাড়া ফ্রি রেট ~২০ ডাক/মিনিট, তাই ডাকের ফাঁক ৩ সেকেন্ড; 429 এলে বাকি run আর Jina ডাকা হয় না।

pace("r.jina.ai", 3000);

const preferred = new Map<string, "html" | "md">();
const dead = new Set<string>();
let quotaOut = false;

const isChallenge = (body: string) => (CHALLENGE.test(body.slice(0, 5000)) && body.length < 50_000) || body.length < 500;

async function jinaGet(url: string, rawHtml: boolean): Promise<string | null> {
  const res = await limited("r.jina.ai", () =>
    fetch(`https://r.jina.ai/${url}`, {
      headers: { "x-no-cache": "true", ...(rawHtml ? { "x-return-format": "html" } : {}) },
      signal: AbortSignal.timeout(45_000),
    }),
  );
  if (res.status === 429) quotaOut = true;
  return res.ok ? res.text() : null;
}

export async function jinaRead(store: Store, url: string): Promise<Page | null> {
  if (quotaOut) return null;
  const site = new URL(url).host.replace(/^www\./, "");
  if (dead.has(site)) return null;
  const first = preferred.get(site) ?? "html";
  try {
    for (const mode of (first === "html" ? ["html", "md"] : ["md", "html"]) as ("html" | "md")[]) {
      const body = await jinaGet(url, mode === "html");
      if (!body || isChallenge(body)) continue;
      preferred.set(site, mode);
      return await readPage(store, url, true, body);
    }
    dead.add(site); // দুই মোডেই পাতা আসেনি — এই দোকান এই run-এ Jina দিয়ে পড়া যাবে না
    return null;
  } catch {
    return null; // ধীর বা ভাঙা ডাক; এই পাতা Gemini-তে
  }
}
