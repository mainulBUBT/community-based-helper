import { splitKeys, type LlmSettings } from "../../workers/lib/models";
import { toolSpecs } from "./tools";

export interface ToolCall {
  id: string;
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

// 429 সবসময় কোটা শেষ নয়: মিনিটের সীমা বা একসাথে বেশি ডাকলেও আসে, তাই সেটা থেমে আবার চেষ্টা; দিনের/ব্যালেন্সের সীমা হলে পরের key বা সেটআপে। শেষে আসল কারণ উত্তরে
const RATE_RETRIES = 2;
// kimi-k3-এর মতো ভেবে উত্তর দেওয়া মডেলে বড় প্রসঙ্গসহ এক ডাকেই এক মিনিটের বেশি লাগে; alarm এর ১৫ মিনিটের সীমার ভেতরে থাকে
const CALL_TIMEOUT_MS = 180_000;
const RATE = /rate|too many|concurren|frequen|busy|retry/i;
const SPENT = /quota|balance|exhaust|per ?day|daily|insufficient|billing/i;

// worker এর মতোই: প্রথম সেটআপ দিয়ে; quota শেষ হলে (429) পরের key, তারপর তালিকার পরের সেটআপ।
// used: কোন সেটআপ উত্তর দিল, যাতে একই উত্তরের পরের ধাপে quota শেষ হওয়াগুলো আর ডাকা না হয়
export async function chat(models: LlmSettings[], messages: ChatMessage[]): Promise<{ message: ChatMessage; used: number }> {
  const reasons: string[] = [];
  for (const [used, llm] of models.entries()) {
    for (const key of splitKeys(llm.apiKey)) {
      const post = () =>
        fetch(new URL("chat/completions", llm.baseUrl.endsWith("/") ? llm.baseUrl : `${llm.baseUrl}/`), {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: llm.model, messages, tools: toolSpecs }),
          signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
        });
      // সার্ভারের সাময়িক সমস্যায় (5xx) একবার থেমে আবার
      let res = await post();
      if (res.status >= 500) {
        await scheduler.wait(2000);
        res = await post();
      }
      for (let retry = 0; res.status === 429 && retry < RATE_RETRIES; retry++) {
        const text = await res.clone().text().catch(() => "");
        if (!RATE.test(text) || SPENT.test(text)) break;
        await scheduler.wait(Math.min(20, Number(res.headers.get("retry-after")) || 5 * (retry + 1)) * 1000);
        res = await post();
      }
      if (res.status === 429) {
        reasons.push(`${llm.model}: ${(await res.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 160)}`);
        continue;
      }
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const body = (await res.json()) as { choices?: { message?: ChatMessage }[] };
      const message = body.choices?.[0]?.message;
      if (!message) throw new Error("LLM খালি উত্তর দিয়েছে");
      return { message, used };
    }
  }
  throw new Error(`AI ডাকে 429 (${reasons.join("; ")})`);
}
