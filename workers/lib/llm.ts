import { liveKeys, QuotaError, splitKeys, withKeys } from "./llm-keys";
import { askLocalAi, localAiCommand } from "./local-ai";
import { modelTarget, privateSettings, type LlmSettings } from "./settings";
import { sleep } from "./sleep";

const retryable = (status: number) => status === 429 || status >= 500;

// judge/extract এর মতো ছোট প্রশ্নের উত্তর এতেই আসে; ঝুলে থাকা সেটআপে পুরো run দেরি হয়ে যায়
const timeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? 20_000);

// এক run এ সর্বোচ্চ এতবার AI ডাকা হয়; দোকান পাতা বদলালেও নিজের সাবস্ক্রিপশনের কোটা এক রাতে শেষ হয় না
let calls = Number(process.env.LLM_CALL_LIMIT ?? 200);

// এই run এ যেসব সেটআপ সাড়াই দেয়নি বা 5xx দিয়েছে — বাকি run এ আর ডাকা হয় না, সরাসরি পরের সেটআপে যাওয়া যায়
const broken = new Set<string>();

const configured = (models: LlmSettings[]) => models.filter((m) => m.baseUrl && m.model && splitKeys(m.apiKey).length);

// পছন্দের ক্রমে, এই run এ যেগুলোর quota এখনো শেষ হয়নি আর ভেঙে পড়েনি; পরের run আবার প্রথমটা থেকে
async function readyModels(): Promise<LlmSettings[]> {
  return configured((await privateSettings()).models).filter((m) => !broken.has(modelTarget(m)) && liveKeys(m.apiKey, modelTarget(m)).length);
}

// কেন AI ডাকা যাবে না: "off" কোনো সেটআপ নেই, "budget" এই run এর সীমা বা সব সেটআপের quota শেষ; ডাকা গেলে null
export async function llmBlocker(): Promise<"off" | "budget" | null> {
  if (calls <= 0) return "budget";
  if (process.env.LOCAL_JOB) return localAiCommand() ? null : "off";
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
          signal: AbortSignal.timeout(timeoutMs),
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

const parseJson = <T>(content: string) => JSON.parse(content.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;

// CLI না চললে বা subscription-এর সীমা শেষ হলে বাকি run AI ছাড়াই। কিছু CLI JSON এর আগে-পরে লেখা জোড়ে, তাই শুধু JSON অংশটা
async function askLocal<T>(system: string, user: string): Promise<T> {
  calls--;
  try {
    const answer = await askLocalAi(system, user);
    return parseJson<T>(/\{[\s\S]*\}/.exec(answer)?.[0] ?? answer);
  } catch (error) {
    if (!(error instanceof SyntaxError)) calls = 0;
    throw error;
  }
}

// প্রথম সেটআপ দিয়ে; quota শেষ (429), সাড়া না দেওয়া বা 5xx হলে তালিকার পরেরটা
export async function askJson<T>(system: string, user: string): Promise<T> {
  if (process.env.LOCAL_JOB) return askLocal<T>(system, user);
  const models = await readyModels();
  if (!models.length) throw new Error((await llmBlocker()) === "off" ? "LLM key is not set in private_settings" : "সব AI সেটআপের quota শেষ");
  for (const [i, llm] of models.entries()) {
    if (calls-- <= 0) throw new Error("LLM call limit reached for this run");
    const last = i === models.length - 1;
    let res: Response;
    try {
      res = await callModel(llm, system, user);
    } catch (error) {
      if (last) throw error;
      if (!(error instanceof QuotaError)) broken.add(modelTarget(llm));
      continue;
    }
    if (res.status === 429 && !last) continue;
    if (res.status >= 500 && !last) {
      broken.add(modelTarget(llm));
      continue;
    }
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content ?? "";
    return parseJson<T>(content);
  }
  throw new Error("সব AI সেটআপের quota শেষ");
}
