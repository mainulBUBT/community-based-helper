import type { Page } from "../stores/page";
import { toTaka } from "./price";
import { withKeys } from "./llm-keys";
import { modelTarget, privateSettings } from "./settings";
import { sleep } from "./sleep";
import { pageOffers } from "./variants";

// Gemini-এর url_context টুল: পাতাটা Google-এর নিজের সার্ভার থেকে পড়ে দেয়। GitHub-এর datacenter IP যেসব
// দোকানে Cloudflare challenge খায় (Sumash, Gadget Breeze, Kry, Gadget & Gear), শুধু তাদের fallback।
// পড়া হলেও দাম স্বাভাবিক যাচাইয়ের ভেতর দিয়েই যায়: ভার্সন মেলানো, অফিসিয়াল দামের ৪০%–২.৫ গুণ সীমা।

const NATIVE = "https://generativelanguage.googleapis.com/v1beta";
let budget = Number(process.env.AI_READ_LIMIT ?? 120); // এক run এ এতবার AI পড়া, কোটা বাঁচাতে
let lastError: string | null = null;

// কেন AI দিয়েও পড়া গেল না, run এর বার্তায় দেখাতে
export const aiReadNote = () => (lastError ? ` (AI: ${lastError})` : "");

interface AiRow {
  label?: string | null;
  price?: number | string;
  oldPrice?: number | string | null;
  inStock?: boolean | null;
  region?: string | null;
}

async function gemini(url: string): Promise<string> {
  const { models } = await privateSettings();
  // url_context শুধু Gemini নিজের API তে আছে; তালিকার প্রথম Gemini সেটআপটা
  const llm = models.find((m) => m.apiKey && /generativelanguage\.googleapis\.com/.test(m.baseUrl));
  if (!llm) throw new Error("url_context চালাতে Gemini-র নিজের API লাগে");
  const model = llm.model;
  const request = () => withKeys(llm.apiKey, (key) => fetch(`${NATIVE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Open ${url} with the url_context tool. It is a product page of a Bangladeshi gadget shop. Reply with JSON only: {"title": product name or null, "image": main product image URL or null, "rows": [{"label": variant/option text exactly as shown (like "8GB/256GB", "45mm") or null when the page has a single variant, "price": current selling price in Bangladeshi taka as a number without commas (never a booking/deposit/pre-order advance amount — if the page only shows a booking amount for a costlier product, omit that row), "oldPrice": struck-through original price as a number or null, "inStock": true|false|null, "region": version/region wording like "USA", "Japan", "Global" or null}]}. Include every variant listed on the page. If you could not read the page, reply {"rows": []}.`,
            },
          ],
        },
      ],
      tools: [{ url_context: {} }],
      generationConfig: { temperature: 0 }, // url_context এর সাথে JSON mode চলে না, তাই লেখা থেকে JSON কাটা হয়
    }),
    signal: AbortSignal.timeout(150_000),
  }), modelTarget(llm));
  let res = await request();
  // Gemini মাঝে মাঝে ব্যস্ত (503); একটু থেমে আরেকবার
  if (res.status >= 500) {
    await sleep(8000 + Math.random() * 4000);
    res = await request();
  }
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; urlContextMetadata?: unknown; url_context_metadata?: unknown }[] };
  const first = data.candidates?.[0];
  if (process.env.AI_READ_VERBOSE) console.error(`AI fetch: ${JSON.stringify(first?.urlContextMetadata ?? first?.url_context_metadata ?? null)}`);
  return (first?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
}

// উত্তরে ব্যাখ্যার ভেতরেও JSON-এর মতো লেখা থাকতে পারে ("{\"rows\": []} দিতে বলা হয়েছে…"); যেখান থেকে পুরোটা পার্স হয় সেটাই
function lastJson(text: string): unknown {
  const end = text.lastIndexOf("}") + 1;
  for (let start = text.indexOf("{"); start >= 0 && start < end; start = text.indexOf("{", start + 1)) {
    try {
      return JSON.parse(text.slice(start, end));
    } catch {}
  }
  throw new Error("AI উত্তরে JSON নেই");
}

// দোকান GitHub-এর IP কে আটকে দিলে ডাকা হয়। পড়তে না পারলে null — তখন আগের মতো "দোকান আটকে রাখায় বাদ"।
export async function aiRead(url: string): Promise<Page | null> {
  if (budget <= 0) return null;
  budget--;
  try {
    const text = await gemini(url);
    if (process.env.AI_READ_VERBOSE) console.error(`AI উত্তর: ${text.slice(0, 300)}`);
    const reply = lastJson(text) as { title?: string | null; image?: string | null; rows?: AiRow[] };
    const rows = (reply.rows ?? [])
      .map((row) => ({
        options: row.label ? [String(row.label).trim()] : [],
        region: row.region ? String(row.region).trim() : null,
        price: toTaka(row.price) ?? 0,
        oldPrice: toTaka(row.oldPrice),
        inStock: row.inStock ?? null,
      }))
      .filter((row) => row.price > 0);
    if (!rows.length) return null;
    return { offers: pageOffers(rows), title: reply.title ?? null, image: reply.image ?? null };
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    if (process.env.AI_READ_VERBOSE) console.error(`AI পড়া: ${lastError}`);
    return null;
  }
}
