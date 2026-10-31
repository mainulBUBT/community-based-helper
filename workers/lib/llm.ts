import { liveKeys, QuotaError, splitKeys, withKeys } from "./llm-keys";
import { modelTarget, privateSettings, type LlmSettings } from "./settings";
import { sleep } from "./sleep";

const retryable = (status: number) => status === 429 || status >= 500;

// এক run এ সর্বোচ্চ এতবার AI ডাকা হয়; দোকান পাতা বদলালেও নিজের সাবস্ক্রিপশনের কোটা এক রাতে শেষ হয় না
let calls = Number(process.env.LLM_CALL_LIMIT ?? 200);

const configured = (models: LlmSettings[]) => models.filter((m) => m.baseUrl && m.model && splitKeys(m.apiKey).length);

// পছন্দের ক্রমে, এই run এ যেগুলোর quota এখনো শেষ হয়নি; পরের run আবার প্রথমটা থেকে
async function readyModels(): Promise<LlmSettings[]> {
  return configured((await privateSettings()).models).filter((m) => liveKeys(m.apiKey, modelTarget(m)).length);
}

// কেন AI ডাকা যাবে না: "off" কোনো সেটআপ নেই, "budget" এই run এর সীমা বা সব সেটআপের quota শেষ; ডাকা গেলে null
export async function llmBlocker(): Promise<"off" | "budget" | null> {
  if (calls <= 0) return "budget";
  if (!configured((await privateSettings()).models).length) return "off";
  return (await readyModels()).length ? null : "budget";
}

export const llmReady = async () => (await llmBlocker()) === null;

async function callModel(llm: LlmSettings, system: string, user: string): Promise<Response> {
  const request = { model: llm.model, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
  const post = (body: object) =>
    withKeys(
      llm.apiKey,
      (key) =>
        fetch(new URL("chat/completions", llm.baseUrl.endsWith("/") ? llm.baseUrl : `${llm.baseUrl}/`), {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(60_000),
        }),
      modelTarget(llm),
    );
  // একবার থেমে আবার চেষ্টা: rate limit বা সার্ভারের সাময়িক সমস্যায়
  const send = async (body: object) => {
    const res = await post(body);
    if (!retryable(res.status)) return res;
    await sleep(2000 + Math.random() * 3000);
    return post(body);
  };
  const res = await send({ ...request, temperature: 0, response_format: { type: "json_object" } });
  // কিছু সার্ভিস বা reasoning মডেল temperature/response_format নেয় না
  return res.status === 400 ? send(request) : res;
}

// প্রথম সেটআপ দিয়ে; তার quota শেষ হলে (429) তালিকার পরেরটা
export async function askJson<T>(system: string, user: string): Promise<T> {
  const models = await readyModels();
  if (!models.length) throw new Error((await llmBlocker()) === "off" ? "LLM key is not set in private_settings" : "সব AI সেটআপের quota শেষ");
  for (const [i, llm] of models.entries()) {
    if (calls-- <= 0) throw new Error("LLM call limit reached for this run");
    const last = i === models.length - 1;
    let res: Response;
    try {
      res = await callModel(llm, system, user);
    } catch (error) {
      if (error instanceof QuotaError && !last) continue;
      throw error;
    }
    if (res.status === 429 && !last) continue;
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content ?? "";
    return JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
  }
  throw new Error("সব AI সেটআপের quota শেষ");
}
