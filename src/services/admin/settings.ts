import { sampleSettings } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { PrivateSettings, SiteSettings } from "@/types/admin";
import { getSiteSettings } from "../catalog-live";
import { logAction } from "./audit";

const DEFAULT_PRIVATE: PrivateSettings = {
  llm: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.5-flash", apiKey: null },
  telegramBotToken: null,
  alertChatId: null,
  llmKeys: {},
};

export const providerKey = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, "");

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

// key আর token সার্ভার থেকে শুধু ঢাকা অবস্থায় আসে (যেমন ••••a1b2); সেভে খালি রাখলে আগেরটাই থাকে
export async function loadPrivateSettings(): Promise<PrivateSettings> {
  if (!supabase)
    return {
      ...demoPrivate,
      llm: { ...demoPrivate.llm, apiKey: masked(demoPrivate.llm.apiKey) },
      telegramBotToken: masked(demoPrivate.telegramBotToken),
      llmKeys: Object.fromEntries(Object.entries(demoPrivate.llmKeys ?? {}).map(([url, key]) => [url, masked(key)!])),
    };
  const { data, error } = await supabase.rpc("private_settings_masked");
  if (error) throw error;
  const value = (data ?? {}) as Partial<PrivateSettings>;
  return { ...DEFAULT_PRIVATE, ...value, llm: { ...DEFAULT_PRIVATE.llm, ...value.llm } };
}

export async function savePrivateSettings(value: PrivateSettings, section: string) {
  if (!supabase) {
    const base = providerKey(value.llm.baseUrl);
    const llmKeys = { ...demoPrivate.llmKeys, ...(value.llm.apiKey && base ? { [base]: value.llm.apiKey } : {}) };
    demoPrivate = {
      ...value,
      llm: { ...value.llm, apiKey: llmKeys[base] ?? null },
      telegramBotToken: value.telegramBotToken || demoPrivate.telegramBotToken,
      llmKeys,
    };
  } else {
    const { error } = await supabase.rpc("save_private_settings", { patch: value });
    if (error) throw error;
  }
  await logAction("settings.update", { section });
}

export async function testLlm({ baseUrl, model, apiKey }: PrivateSettings["llm"]) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey ?? ""}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with: ok" }] }),
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`.slice(0, 200));
  const body = await response.json();
  return String(body.choices?.[0]?.message?.content ?? "").trim();
}
