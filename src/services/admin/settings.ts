import { sampleSettings } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { PrivateSettings, SiteSettings } from "@/types/admin";
import { getSiteSettings } from "../catalog";
import { logAction } from "./audit";

const DEFAULT_PRIVATE: PrivateSettings = {
  llm: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.5-flash", apiKey: null },
  telegramBotToken: null,
  alertChatId: null,
};

let demoPrivate: PrivateSettings = DEFAULT_PRIVATE;

export const loadSiteSettings = getSiteSettings;

export async function saveSiteSettings(value: SiteSettings, section: string) {
  if (!supabase) Object.assign(sampleSettings, value);
  else {
    const { error } = await supabase.from("site_settings").upsert({ id: true, value });
    if (error) throw error;
  }
  await logAction("settings.update", { section });
}

export async function loadPrivateSettings(): Promise<PrivateSettings> {
  if (!supabase) return demoPrivate;
  const { data, error } = await supabase.from("private_settings").select("value").maybeSingle();
  if (error) throw error;
  const value = (data?.value ?? {}) as Partial<PrivateSettings>;
  return { ...DEFAULT_PRIVATE, ...value, llm: { ...DEFAULT_PRIVATE.llm, ...value.llm } };
}

export async function savePrivateSettings(value: PrivateSettings, section: string) {
  if (!supabase) demoPrivate = value;
  else {
    const { error } = await supabase.from("private_settings").upsert({ id: true, value });
    if (error) throw error;
  }
  await logAction("settings.update", { section });
}

export async function testLlm({ baseUrl, model, apiKey }: PrivateSettings["llm"]) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey ?? ""}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with: ok" }], max_tokens: 5 }),
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`.slice(0, 200));
  const body = await response.json();
  return String(body.choices?.[0]?.message?.content ?? "").trim();
}
