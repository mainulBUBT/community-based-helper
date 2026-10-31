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

// worker এর মতোই: প্রথম সেটআপ দিয়ে; quota শেষ হলে (429) পরের key, তারপর তালিকার পরের সেটআপ।
// used: কোন সেটআপ উত্তর দিল, যাতে একই উত্তরের পরের ধাপে quota শেষ হওয়াগুলো আর ডাকা না হয়
export async function chat(models: LlmSettings[], messages: ChatMessage[]): Promise<{ message: ChatMessage; used: number }> {
  for (const [used, llm] of models.entries()) {
    for (const key of splitKeys(llm.apiKey)) {
      const res = await fetch(new URL("chat/completions", llm.baseUrl.endsWith("/") ? llm.baseUrl : `${llm.baseUrl}/`), {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: llm.model, messages, tools: toolSpecs }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429) continue;
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const body = (await res.json()) as { choices?: { message?: ChatMessage }[] };
      const message = body.choices?.[0]?.message;
      if (!message) throw new Error("LLM খালি উত্তর দিয়েছে");
      return { message, used };
    }
  }
  throw new Error("সব AI সেটআপের quota শেষ");
}
