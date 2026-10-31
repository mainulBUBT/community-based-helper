import { db, must } from "./db";
import { storedModels, type LlmSettings, type StoredSettings } from "./models";

export { modelTarget, providerKey, type LlmSettings } from "./models";

export interface PrivateSettings {
  // পছন্দের ক্রমে, প্রতিটার সাথে তার সার্ভিসের key
  models: LlmSettings[];
  telegramBotToken: string | null;
  alertChatId: string | null;
}

let cached: PrivateSettings | null = null;

function envLlm(): LlmSettings[] {
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  return baseUrl && model ? [{ baseUrl, model, apiKey: process.env.LLM_API_KEY ?? null }] : [];
}

export async function privateSettings(): Promise<PrivateSettings> {
  if (cached) return cached;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    cached = { models: envLlm(), telegramBotToken: null, alertChatId: null };
    return cached;
  }
  const row = await must(db().from("private_settings").select("value").maybeSingle());
  const value = (row?.value ?? {}) as StoredSettings;
  const models = storedModels(value);
  cached = {
    models: models.length ? models : envLlm(),
    telegramBotToken: value.telegramBotToken ?? null,
    alertChatId: value.alertChatId ?? null,
  };
  return cached;
}
