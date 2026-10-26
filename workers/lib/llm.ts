import { liveKeys, withKeys } from "./llm-keys";
import { privateSettings } from "./settings";
import { sleep } from "./sleep";

const retryable = (status: number) => status === 429 || status >= 500;

// এক run এ সর্বোচ্চ এতবার AI ডাকা হয়; দোকান পাতা বদলালেও নিজের সাবস্ক্রিপশনের কোটা এক রাতে শেষ হয় না
let calls = Number(process.env.LLM_CALL_LIMIT ?? 200);

export async function llmReady(): Promise<boolean> {
  if (calls <= 0) return false;
  const { llm } = await privateSettings();
  return Boolean(liveKeys(llm?.apiKey).length && llm?.baseUrl && llm.model);
}

export async function askJson<T>(system: string, user: string): Promise<T> {
  const { llm } = await privateSettings();
  if (!llm?.apiKey) throw new Error("LLM key is not set in private_settings");
  if (calls-- <= 0) throw new Error("LLM call limit reached for this run");
  const request = { model: llm.model, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
  const post = (body: object) =>
    withKeys(llm.apiKey, (key) =>
      fetch(new URL("chat/completions", llm.baseUrl.endsWith("/") ? llm.baseUrl : `${llm.baseUrl}/`), {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      }),
    );
  // একবার থেমে আবার চেষ্টা: rate limit বা সার্ভারের সাময়িক সমস্যায়
  const send = async (body: object) => {
    const res = await post(body);
    if (!retryable(res.status)) return res;
    await sleep(2000 + Math.random() * 3000);
    return post(body);
  };
  let res = await send({ ...request, temperature: 0, response_format: { type: "json_object" } });
  // কিছু সার্ভিস বা reasoning মডেল temperature/response_format নেয় না
  if (res.status === 400) res = await send(request);
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content ?? "";
  return JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
}
