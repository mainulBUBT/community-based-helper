import { db, must } from "./db";

export interface LlmSettings {
  baseUrl: string;
  model: string;
  apiKey: string | null;
}

export interface PrivateSettings {
  llm: LlmSettings | null;
  telegramBotToken: string | null;
  alertChatId: string | null;
}

let cached: PrivateSettings | null = null;

function envLlm(): LlmSettings | null {
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  return baseUrl && model ? { baseUrl, model, apiKey: process.env.LLM_API_KEY ?? null } : null;
}

export async function privateSettings(): Promise<PrivateSettings> {
  if (cached) return cached;
  const fallback = envLlm();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    cached = { llm: fallback, telegramBotToken: null, alertChatId: null };
    return cached;
  }
  const row = await must(db().from("private_settings").select("value").maybeSingle());
  const value = (row?.value ?? {}) as Partial<PrivateSettings>;
  cached = {
    llm: value.llm ?? fallback,
    telegramBotToken: value.telegramBotToken ?? null,
    alertChatId: value.alertChatId ?? null,
  };
  return cached;
}
