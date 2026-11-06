import { sampleSettings } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { LlmModel, LlmProvider, PrivateSettings, SiteSettings } from "@/types/admin";
import { getSiteSettings } from "../catalog-live";
import { logAction } from "./audit";

// আগে থেকেই থাকা প্রোভাইডার; বাকি যেকোনো OpenAI-compatible সার্ভিস অ্যাডমিনে "নতুন প্রোভাইডার" দিয়ে যোগ হয়
export const LLM_PRESETS = [
  { name: "Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.5-flash" },
  { name: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free" },
  { name: "Cloudflare", baseUrl: "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/v1", model: "@cf/meta/llama-3.1-8b-instruct" },
  { name: "Z.ai", baseUrl: "https://api.z.ai/api/paas/v4", model: "glm-4.5" },
];

const DEFAULT_PRIVATE: PrivateSettings = {
  llm: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.5-flash", apiKey: null },
  telegramBotToken: null,
  alertChatId: null,
  llmKeys: {},
};

export const providerKey = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, "");
export const modelTarget = (model: Pick<LlmModel, "baseUrl" | "model">) => `${providerKey(model.baseUrl)}|${model.model}`;

const domain = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/+$/, "");

// নাম দেওয়া প্রোভাইডার, সাথে পুরনো ভার্সনে শুধু key জমে যাওয়া নাম-ছাড়া সার্ভিস (ওদের নাম হয় ডোমেইন)
export function providerList(settings: PrivateSettings): LlmProvider[] {
  const named = settings.llmProviders ?? [];
  const legacy = Object.keys(settings.llmKeys ?? {})
    .filter((url) => url && !LLM_PRESETS.some((p) => providerKey(p.baseUrl) === url) && !named.some((p) => providerKey(p.baseUrl) === url))
    .map((url) => ({ name: domain(url), baseUrl: url }));
  return [...named, ...legacy];
}

export const providerName = (settings: PrivateSettings, baseUrl: string) =>
  LLM_PRESETS.find((p) => providerKey(p.baseUrl) === providerKey(baseUrl))?.name ??
  providerList(settings).find((p) => providerKey(p.baseUrl) === providerKey(baseUrl))?.name ??
  domain(baseUrl);

// তালিকা না থাকলে (পুরনো সেটিং) আগের একটা মডেলই তালিকা
export function modelList(settings: PrivateSettings): LlmModel[] {
  if (settings.llmModels) return settings.llmModels;
  return settings.llm.baseUrl && settings.llm.model && settings.llm.apiKey ? [{ baseUrl: settings.llm.baseUrl, model: settings.llm.model }] : [];
}

let demoPrivate: PrivateSettings = DEFAULT_PRIVATE;

const masked = (secret: string | null) => (secret ? `••••${secret.slice(-4)}` : null);

// সাইট বেক করা পুরনো কপি নয়, Supabase এর এখনকার মান; নইলে সেভের পরে পুরনো মান দেখাত, আবার সেভে নতুনটা মুছে যেত
export async function loadSiteSettings(): Promise<SiteSettings> {
  return supabase ? getSiteSettings() : { ...sampleSettings };
}

export async function saveSiteSettings(value: SiteSettings, section: string) {
  if (!supabase) Object.assign(sampleSettings, value);
  else {
    const { error } = await supabase.from("site_settings").upsert({ id: true, value });
    if (error) throw error;
  }
  await logAction("settings.update", { section });
}

// AI প্রোভাইডারের key পুরোটা আসে (অ্যাডমিনের ঘরে চোখের বোতামে দেখা যায়); Telegram token শুধু ঢাকা (যেমন ••••a1b2), সেভে খালি রাখলে আগেরটাই থাকে
export async function loadPrivateSettings(): Promise<PrivateSettings> {
  if (!supabase) return { ...demoPrivate, telegramBotToken: masked(demoPrivate.telegramBotToken) };
  const [settings, keys] = await Promise.all([supabase.rpc("private_settings_masked"), supabase.rpc("llm_keys")]);
  if (settings.error) throw settings.error;
  if (keys.error) throw keys.error;
  const value = (settings.data ?? {}) as Partial<PrivateSettings>;
  const llmKeys = (keys.data ?? {}) as Record<string, string>;
  const llm = { ...DEFAULT_PRIVATE.llm, ...value.llm };
  return { ...DEFAULT_PRIVATE, ...value, llm: { ...llm, apiKey: llmKeys[providerKey(llm.baseUrl)] ?? null }, llmKeys };
}

export async function savePrivateSettings({ removeLlmKey, ...value }: PrivateSettings, section: string) {
  const removeKey = removeLlmKey ? providerKey(removeLlmKey) : null;
  if (!supabase) {
    const base = providerKey(value.llm.baseUrl);
    const llmKeys = { ...demoPrivate.llmKeys, ...(value.llm.apiKey && base ? { [base]: value.llm.apiKey } : {}) };
    if (removeKey) delete llmKeys[removeKey];
    demoPrivate = {
      ...value,
      llm: { ...value.llm, apiKey: llmKeys[base] ?? null },
      telegramBotToken: value.telegramBotToken || demoPrivate.telegramBotToken,
      llmKeys,
    };
  } else {
    const { error } = await supabase.rpc("save_private_settings", { patch: { ...value, ...(removeKey && { removeLlmKey: removeKey }) } });
    if (error) throw error;
  }
  await logAction("settings.update", { section });
}

// key খালি থাকলে সার্ভার ওই প্রোভাইডারের সেভ করা key নেয়; ডেমোতে (Supabase ছাড়া) ব্রাউজার থেকেই
export async function testLlm({ baseUrl, model, apiKey }: PrivateSettings["llm"]) {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke<{ reply?: string; error?: string }>("test-llm", { body: { baseUrl, model, apiKey } });
    // ফাংশনের নিজের কারণটা দেখানো, শুধু "non-2xx" নয়
    if (error) throw new Error((await (error.context as Response | undefined)?.json?.().catch(() => null))?.error ?? error.message);
    if (data?.error) throw new Error(data.error);
    return data?.reply ?? "";
  }
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey ?? ""}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with: ok" }] }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${raw.slice(0, 150)}`);
  let body: { choices?: { message?: { content?: string } }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(`non-JSON reply: ${raw.slice(0, 150)}`);
  }
  return String(body.choices?.[0]?.message?.content ?? "").trim();
}

export const aiReady = (settings: PrivateSettings) => modelList(settings).some((m) => settings.llmKeys?.[providerKey(m.baseUrl)]);

// সেটআপের তালিকা সাথে সাথে সেভ; নতুন সেটআপের সাথে key দিলে সেটা ওই সার্ভিসের key হয়, প্রোভাইডারের তালিকাও এ সাথে বদলায়; removeKey দিলে ওই প্রোভাইডারের key-ও মুছে যায়
export async function saveLlmModels(settings: PrivateSettings, models: LlmModel[], section: string, added?: PrivateSettings["llm"], providers?: LlmProvider[], removeKey?: string) {
  const first = models[0];
  const llm = added ?? (first ? { baseUrl: first.baseUrl, model: first.model, apiKey: null } : settings.llm);
  await savePrivateSettings(
    { ...settings, llm, llmModels: models, ...(providers && { llmProviders: providers }), ...(removeKey && { removeLlmKey: removeKey }), telegramBotToken: null },
    section,
  );
}
