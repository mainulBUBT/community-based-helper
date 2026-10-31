import { db, must } from "./db";

export interface LlmSettings {
  baseUrl: string;
  model: string;
  apiKey: string | null;
}

export interface PrivateSettings {
  // পছন্দের ক্রমে, প্রতিটার সাথে তার সার্ভিসের key
  models: LlmSettings[];
  telegramBotToken: string | null;
  alertChatId: string | null;
}

interface StoredModel {
  baseUrl: string;
  model: string;
}

interface StoredSettings {
  llm?: LlmSettings | null;
  llmModels?: StoredModel[];
  llmKeys?: Record<string, string>;
  telegramBotToken?: string | null;
  alertChatId?: string | null;
}

let cached: PrivateSettings | null = null;

export const providerKey = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, "");
export const modelTarget = (model: Pick<LlmSettings, "baseUrl" | "model">) => `${providerKey(model.baseUrl)}|${model.model}`;

function envLlm(): LlmSettings[] {
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  return baseUrl && model ? [{ baseUrl, model, apiKey: process.env.LLM_API_KEY ?? null }] : [];
}

// তালিকা না থাকলে (পুরনো সেটিং) আগের একটা মডেলই তালিকা
function storedModels(value: StoredSettings): LlmSettings[] {
  const keyOf = (baseUrl: string) => value.llmKeys?.[providerKey(baseUrl)] ?? (value.llm && providerKey(value.llm.baseUrl) === providerKey(baseUrl) ? value.llm.apiKey : null);
  const list: StoredModel[] = value.llmModels?.length ? value.llmModels : value.llm?.baseUrl && value.llm.model ? [value.llm] : [];
  return list.map((m) => ({ baseUrl: m.baseUrl, model: m.model, apiKey: keyOf(m.baseUrl) }));
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
