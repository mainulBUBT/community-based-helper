import type { Page } from "../stores/page";
import { privateSettings } from "./settings";
import { pageOffers } from "./variants";

// Gemini-এর url_context টুল: পাতাটা Google-এর নিজের সার্ভার থেকে পড়ে দেয়। GitHub-এর datacenter IP যেসব
// দোকানে Cloudflare challenge খায় (Sumash, Gadget Breeze, Kry, Gadget & Gear), শুধু তাদের fallback।
// পড়া হলেও দাম স্বাভাবিক যাচাইয়ের ভেতর দিয়েই যায়: ভার্সন মেলানো, অফিসিয়াল দামের ৪০%–২.৫ গুণ সীমা।

const NATIVE = "https://generativelanguage.googleapis.com/v1beta";
let budget = Number(process.env.AI_READ_LIMIT ?? 120); // এক run এ এতবার AI পড়া, কোটা বাঁচাতে

interface AiRow {
  label?: string | null;
  price?: number | string;
  oldPrice?: number | string | null;
  inStock?: boolean | null;
  region?: string | null;
}

const num = (value: unknown): number => {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/[^\d]/g, "")) || 0;
};

async function gemini(url: string): Promise<string> {
  const { llm } = await privateSettings();
  // url_context শুধু Gemini নিজের API তে আছে; OpenAI-compatible ঠিকানা দিলে এই পথ চলবে না
  if (!llm?.apiKey || !llm.model || !/generativelanguage\.googleapis\.com/.test(llm.baseUrl ?? "")) throw new Error("url_context চালাতে Gemini-র নিজের API লাগে");
  const res = await fetch(`${NATIVE}/models/${llm.model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": llm.apiKey },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Open ${url} with the url_context tool. It is a product page of a Bangladeshi gadget shop. Reply with JSON only: {"title": product name or null, "image": main product image URL or null, "rows": [{"label": variant/option text exactly as shown (like "8GB/256GB", "45mm") or null when the page has a single variant, "price": current selling price in Bangladeshi taka as a number without commas, "oldPrice": struck-through original price as a number or null, "inStock": true|false|null, "region": version/region wording like "USA", "Japan", "Global" or null}]}. Include every variant listed on the page. If you could not read the page, reply {"rows": []}.`,
            },
          ],
        },
      ],
      tools: [{ url_context: {} }],
      generationConfig: { temperature: 0 }, // url_context এর সাথে JSON mode চলে না, তাই লেখা থেকে JSON কাটা হয়
    }),
    signal: AbortSignal.timeout(150_000),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; urlContextMetadata?: unknown; url_context_metadata?: unknown }[] };
  const first = data.candidates?.[0];
  if (process.env.AI_READ_VERBOSE) console.error(`AI fetch: ${JSON.stringify(first?.urlContextMetadata ?? first?.url_context_metadata ?? null)}`);
  return (first?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
}

// দোকান GitHub-এর IP কে আটকে দিলে ডাকা হয়। পড়তে না পারলে null — তখন আগের মতো "দোকান আটকে রাখায় বাদ"।
export async function aiRead(url: string): Promise<Page | null> {
  if (budget <= 0) return null;
  try {
    const text = await gemini(url);
    if (process.env.AI_READ_VERBOSE) console.error(`AI উত্তর: ${text.slice(0, 300)}`);
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const reply = JSON.parse(json) as { title?: string | null; image?: string | null; rows?: AiRow[] };
    budget--;
    const rows = (reply.rows ?? [])
      .map((row) => ({
        options: row.label ? [String(row.label).trim()] : [],
        region: row.region ? String(row.region).trim() : null,
        price: num(row.price),
        oldPrice: row.oldPrice == null ? null : num(row.oldPrice) || null,
        inStock: row.inStock ?? null,
      }))
      .filter((row) => row.price > 0);
    if (!rows.length) return null;
    return { offers: pageOffers(rows), title: reply.title ?? null, image: reply.image ?? null };
  } catch (error) {
    if (process.env.AI_READ_VERBOSE) console.error(`AI পড়া: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
