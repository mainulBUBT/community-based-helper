import { DurableObject } from "cloudflare:workers";
import { splitKeys, storedModels, type LlmSettings, type StoredSettings } from "../../workers/lib/models";
import type { ManagerEnv } from "./env";
import { SITE } from "./context";
import { chat, type ChatMessage } from "./llm";
import { privateSettings, rest } from "./supabase";
import { sendMessage, setWebhook, tokenMark, webhookSecret } from "./telegram";
import { queueJob, RUNNABLE, TOOLS, type JobRow, type Step } from "./tools";
import { alertText, blockedHosts, hostsText, isDanger, isQuiet, judge, newHosts, rememberHosts, retryNote, WATCHED, type WatchState } from "./watch";

type Role = "user" | "manager" | "schedule";

interface MessageRow extends Record<string, SqlStorageValue> {
  id: number;
  role: Role;
  text: string;
  steps: string;
  at: number;
}

interface TelegramUpdate {
  update_id?: number;
  message?: { text?: string; chat?: { id?: number | string } };
}

// সকাল ৯টা ঢাকা = ৩টা UTC
const REPORT_HOUR_UTC = 3;
const MAX_ROUNDS = 6;
const CONTEXT = 10;
// AI দেখে শেষ ১০টা, অ্যাডমিন পাতা ৪০টা; এর চেয়ে পুরনো কথা শুধু জায়গা নেয়
const KEEP = 500;
const WATCH_EVERY = 30 * 60_000;
const RETRY_AFTER_ERROR = 5 * 60_000;

const REPORT =
  "সকালের রিপোর্ট লেখো: my_actions দেখে নিজে কী করেছ, কাজগুলোর অবস্থা (কোনটা ব্যর্থ বা আটকে থাকলে কারণসহ), যাচাই বাকি কয়টা, গতকাল ভিজিটর কী খুঁজেছে, আর রাখার মানে কম এমন পণ্য কয়টা (নিয়ম ভাঙা ২-৩টার নাম কারণসহ)। ৬-৮ লাইনে, প্রতিটা লাইনের শুরুতে একটা ইমোজি।";

const system = (state: string) =>
  [
    "তুমি দরদাম সাইটের AI ম্যানেজার। তুমি মালিকের সাথে কথা বলছ।",
    SITE,
    `তোমার নিজের অবস্থা: ${state}`,
    "কাজের বার্তা (last_message) শেষ রানের সময়ের (last_run_at); এরপর সেটিং বদলালে সেটা পুরনো, তাই নিজের অবস্থার সাথে না মিললে সময়সহ বলো। যেমন শেষ রানে AI quota শেষ ছিল কিন্তু এখন অন্য AI সেটআপ আছে।",
    "মালিক বললে send_telegram দিয়ে তাঁর Telegram-এ পাঠাতে পারো। সকালের রিপোর্ট এমনিতেই Telegram-এ যায়।",
    "মালিক বললে run_job দিয়ে নিয়মিত কাজ (দাম আনা, নতুন পণ্য খোঁজা, অফার, সাইট বানানো) এখনই চালাতে লাইনে দিতে পারো; কাজ শেষ হতে মিনিট লাগে, তাই কী লাইনে দিলে আর ফল পরে jobs_status-এ দেখবেন বলো। যাচাই বাকির কোনোটা তুমি নিজে অনুমোদন বা বাদ করতে পারো না: prices কাজের শেষে বিদ্যমান নিয়মে AI নিশ্চিতগুলো সিদ্ধান্ত নেয় (প্রতিবার সর্বোচ্চ ৩০টা), বাকিগুলো অ্যাডমিন → যাচাই বাকি পাতায় মালিকের জন্য।",
    "এর বাইরে কিছু (দাম, পণ্য বা সেটিং বদল) তুমি পারো না। মালিক চাইলে বলো সেই অনুমতি নেই, আর অ্যাডমিন প্যানেলের কোথায় করবেন বলে দাও।",
    "তুমি সহকারী: শুধু প্রশ্নের উত্তর নয়, টুলের ফলে কোনো সমস্যা বা সুযোগ চোখে পড়লে নিজে থেকে বলো আর কী করা উচিত পরামর্শ দাও। কোনো পণ্য লুকানো বা বাদের সিদ্ধান্ত সবসময় মালিকের।",
    "পাহারা কোডে চলে, তোমার হাতে নয়: ব্যর্থ বা অনেকক্ষণ না চলা কাজ একবার নিজে আবার চালায়, আর নতুন কোনো দোকান আটকালে নোট রাখে। সেই নোটগুলো কথাবার্তায় দেখবে।",
    "মালিক \"ম্যানেজার নিজে করবে\" অপশন চালু করলে prices কাজের শেষে কোড নিজেই নতুন ভার্সন যোগ করে: মোবাইলে একই কনফিগ ২+ দোকানে আসল দামে পেলে, দিনে সর্বোচ্চ ৫টা। my_actions-এ তার হিসাব আছে। নতুন দোকান যোগ, লুকানো বা মোছা এখনো এতে নেই। 🚨 মানে সবচেয়ে জরুরি: দাম আনা, পণ্য খোঁজা বা সাইট বানানোর কাজ আবার চালিয়েও ঠিক হয়নি। বাকি খবর Telegram-এ আলাদা করে না পাঠিয়ে সকালের রিপোর্টে বলো।",
    "তথ্য লাগলে টুল ডাকো। সংখ্যা, নাম বা পাতা কখনো বানিয়ে বলবে না; ওপরের তালিকায় না থাকলে বলো জানো না।",
    "উত্তর ছোট আর সহজ বাংলায়, বাংলাদেশে মানুষ যেভাবে কথা বলে। মালিক ইংরেজিতে লিখলে ইংরেজিতে।",
    `এখন ঢাকার সময়: ${new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}`,
  ].join("\n");

function nextReport(now = Date.now()): number {
  const at = new Date(now);
  at.setUTCHours(REPORT_HOUR_UTC, 0, 0, 0);
  if (at.getTime() <= now) at.setUTCDate(at.getUTCDate() + 1);
  return at.getTime();
}

const readyModels = (settings: StoredSettings): LlmSettings[] => storedModels(settings).filter((m) => m.baseUrl && m.model && splitKeys(m.apiKey).length);

export class Manager extends DurableObject<ManagerEnv> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: ManagerEnv) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, text TEXT NOT NULL, steps TEXT NOT NULL DEFAULT '[]', at INTEGER NOT NULL)");
      this.sql.exec("CREATE TABLE IF NOT EXISTS inbox (update_id INTEGER PRIMARY KEY, text TEXT NOT NULL)");
      const reportAt = (await ctx.storage.get<number>("reportAt")) ?? nextReport();
      await ctx.storage.put("reportAt", reportAt);
      const watchAt = (await ctx.storage.get<number>("watchAt")) ?? Date.now() + WATCH_EVERY;
      await ctx.storage.put("watchAt", watchAt);
      const next = Math.min(reportAt, watchAt);
      const alarm = await ctx.storage.getAlarm();
      if (alarm === null || alarm > next) await ctx.storage.setAlarm(next);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/telegram") return this.receive((await request.json()) as TelegramUpdate);
    if (url.pathname === "/status") return Response.json(await this.status(url.origin));
    if (url.pathname === "/chat") {
      const { message } = (await request.json()) as { message?: unknown };
      if (typeof message !== "string" || !message.trim()) return new Response(null, { status: 400 });
      await this.reply(await privateSettings(this.env), message.trim().slice(0, 2000), "user");
      return Response.json({ messages: this.history(2) });
    }
    return new Response("Not found", { status: 404 });
  }

  // Telegram কে সাথে সাথে "পেয়েছি" বলা; উত্তর লেখা হয় alarm এ, যাতে ধীর AI তে Telegram আবার না পাঠায়
  private async receive(update: TelegramUpdate): Promise<Response> {
    const text = update.message?.text?.trim();
    if (!update.update_id || !text) return new Response(null);
    const { alertChatId } = await privateSettings(this.env);
    if (!alertChatId || String(update.message?.chat?.id) !== String(alertChatId)) return new Response(null);
    this.sql.exec("INSERT OR IGNORE INTO inbox (update_id, text) VALUES (?, ?)", update.update_id, text.slice(0, 2000));
    await this.ctx.storage.setAlarm(Date.now());
    return new Response(null);
  }

  // alarm বারবার ব্যর্থ হলে Cloudflare সেটা ফেলে দেয়, তখন পাহারাও থেমে যেত; তাই ত্রুটিতেও পরের alarm বসে
  async alarm() {
    let failed = false;
    try {
      await this.work();
    } catch (error) {
      failed = true;
      console.error(`manager alarm failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    const reportAt = (await this.ctx.storage.get<number>("reportAt")) ?? nextReport();
    const watchAt = (await this.ctx.storage.get<number>("watchAt")) ?? Date.now();
    const next = Math.min(reportAt, watchAt);
    await this.ctx.storage.setAlarm(failed ? Math.max(next, Date.now() + RETRY_AFTER_ERROR) : next);
  }

  private async work() {
    const settings = await privateSettings(this.env);
    for (const { update_id, text } of this.sql.exec<{ update_id: number; text: string }>("SELECT update_id, text FROM inbox ORDER BY update_id").toArray()) {
      this.sql.exec("DELETE FROM inbox WHERE update_id = ?", update_id);
      await this.notify(settings, await this.reply(settings, text, "user"));
    }
    if (Date.now() >= ((await this.ctx.storage.get<number>("watchAt")) ?? 0)) {
      await this.ctx.storage.put("watchAt", Date.now() + WATCH_EVERY);
      await this.watch(settings).catch((error) => console.error(`manager watch failed: ${error instanceof Error ? error.message : String(error)}`));
    }
    if (Date.now() >= ((await this.ctx.storage.get<number>("reportAt")) ?? nextReport())) {
      await this.notify(settings, await this.reply(settings, REPORT, "schedule"));
      await this.ctx.storage.put("reportAt", nextReport());
    }
  }

  // পাহারার সিদ্ধান্ত কোডে, AI ডাকা হয় না; তাই AI-এর quota শেষ হলেও চলে
  private async watch(settings: StoredSettings) {
    const now = Date.now();
    const state = (await this.ctx.storage.get<WatchState>("watch")) ?? { jobs: {} };
    const jobs = await rest<JobRow[]>(this.env, `jobs?select=id,name,enabled,schedule,run_requested_at,last_run_at,last_status,last_message&id=in.(${WATCHED.join(",")})`);
    const verdicts = jobs.map((job) => ({ job, verdict: judge(job, state.jobs[job.id], now) }));
    const cloud = verdicts.filter(({ job }) => job.enabled && RUNNABLE.includes(job.id));
    // রাতে চুপ, শুধু সব কাজ একসাথে বন্ধ হলে ছাড়া
    const quiet = isQuiet(now) && !(cloud.length > 0 && cloud.every(({ verdict }) => verdict === "alert"));
    try {
      for (const { job, verdict } of verdicts) {
        if (verdict === "fine") delete state.jobs[job.id];
        if (verdict === "retry") {
          const { queued } = await queueJob(this.env, job.id);
          state.jobs[job.id] = { retriedAt: now };
          if (queued) this.save("manager", retryNote(job), [{ call: `run_job("${job.id}")`, result: "লাইনে দেওয়া হয়েছে", tone: "ok" }]);
        }
        if (verdict !== "alert") continue;
        if (!isDanger(job.id)) this.save("manager", alertText(job, now), []);
        else if (quiet || !(await this.announce(settings, alertText(job, now)))) continue;
        state.jobs[job.id] = { ...state.jobs[job.id], alerted: true };
      }
      const seen = blockedHosts(jobs.filter((job) => RUNNABLE.includes(job.id)).map((job) => job.last_message));
      const fresh = newHosts(seen, state.hosts);
      // একটা দোকান আটকানো বিপদ নয়: চ্যাটে থাকে, সকালের রিপোর্টে যায়
      if (fresh.length) this.save("manager", hostsText(fresh), []);
      state.hosts = rememberHosts(seen, state.hosts, now);
    } finally {
      await this.ctx.storage.put("watch", state);
    }
  }

  // Telegram না পৌঁছালে false, পরের পাহারায় আবার চেষ্টা; Telegram সেট করা না থাকলে শুধু অ্যাডমিনের চ্যাটে
  private async announce(settings: StoredSettings, text: string): Promise<boolean> {
    if (settings.telegramBotToken && settings.alertChatId) {
      const status = await sendMessage(settings.telegramBotToken, settings.alertChatId, text).catch(() => 0);
      if (status !== 200) return false;
    }
    this.save("manager", text, []);
    return true;
  }

  private async status(origin: string) {
    const settings = await privateSettings(this.env);
    const models = readyModels(settings);
    const { telegramBotToken: token, alertChatId } = settings;
    const telegram = !token || !alertChatId ? "missing" : (await this.connectTelegram(token, `${origin}/telegram`)) ? "ok" : "rejected";
    return {
      model: models[0]?.model ?? null,
      models: models.length,
      telegram,
      nextReport: new Date((await this.ctx.storage.get<number>("reportAt")) ?? nextReport()).toISOString(),
      history: this.history(40),
    };
  }

  // token বা ঠিকানা বদলালে তবেই Telegram কে নতুন করে জানানো
  private async connectTelegram(token: string, url: string): Promise<boolean> {
    const mark = await tokenMark(token, url);
    if ((await this.ctx.storage.get<string>("webhook")) === mark) return true;
    const status = await setWebhook(token, url, await webhookSecret(this.env));
    await this.ctx.storage.put("telegram", status === 200 ? "ok" : `HTTP ${status}`);
    if (status !== 200) return false;
    await this.ctx.storage.put("webhook", mark);
    return true;
  }

  private async state(settings: StoredSettings): Promise<string> {
    const models = readyModels(settings).map((m) => m.model);
    const telegram = !settings.telegramBotToken
      ? "token দেওয়া নেই"
      : !settings.alertChatId
        ? "chat id দেওয়া নেই"
        : `শেষ সংযোগের চেষ্টা: ${(await this.ctx.storage.get<string>("telegram")) ?? "এখনো হয়নি"}`;
    return `AI মডেল (ক্রমে): ${models.join(", ") || "নেই"}। Telegram: ${telegram}।`;
  }

  private async notify(settings: StoredSettings, text: string) {
    if (settings.telegramBotToken && settings.alertChatId) await sendMessage(settings.telegramBotToken, settings.alertChatId, text);
  }

  private async reply(settings: StoredSettings, text: string, role: Role): Promise<string> {
    const past = this.history(CONTEXT);
    this.save(role, text, []);
    try {
      const { reply, steps } = await this.answer(settings, past, text);
      this.save("manager", reply, steps);
      return reply;
    } catch (error) {
      const reply = `দুঃখিত, এখন উত্তর দিতে পারছি না: ${error instanceof Error ? error.message : String(error)}`;
      this.save("manager", reply, []);
      return reply;
    }
  }

  private async answer(settings: StoredSettings, past: ReturnType<Manager["history"]>, text: string): Promise<{ reply: string; steps: Step[] }> {
    let models = readyModels(settings);
    if (!models.length) throw new Error("কোনো AI সেটআপ নেই। অ্যাডমিন → অটোমেশন ও AI তে যোগ করুন।");
    const messages: ChatMessage[] = [
      { role: "system", content: system(await this.state(settings)) },
      ...past.map((m): ChatMessage => ({ role: m.role === "manager" ? "assistant" : "user", content: m.text })),
      { role: "user", content: text },
    ];
    const steps: Step[] = [];
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const { message, used } = await chat(models, messages);
      models = models.slice(used);
      messages.push(message);
      if (!message.tool_calls?.length) return { reply: message.content?.trim() || "…", steps };
      for (const call of message.tool_calls) {
        const tool = TOOLS[call.function.name];
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {}
        const out = tool
          ? await tool.run(this.env, args).catch((error) => ({ data: { error: String(error) }, result: "পড়া যায়নি", tone: "bad" as const }))
          : { data: { error: "unknown tool" }, result: "অজানা টুল", tone: "bad" as const };
        const shown = Object.values(args).map((v) => JSON.stringify(v)).join(", ");
        steps.push({ call: `${call.function.name}(${shown})`, result: out.result, tone: out.tone });
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(out.data).slice(0, 8000) });
      }
    }
    throw new Error("উত্তর খুঁজতে অনেক ধাপ লেগে যাচ্ছে");
  }

  private save(role: Role, text: string, steps: Step[]) {
    this.sql.exec("INSERT INTO messages (role, text, steps, at) VALUES (?, ?, ?, ?)", role, text, JSON.stringify(steps), Date.now());
    this.sql.exec("DELETE FROM messages WHERE id <= (SELECT MAX(id) FROM messages) - ?", KEEP);
  }

  private history(limit: number) {
    return this.sql
      .exec<MessageRow>("SELECT * FROM (SELECT id, role, text, steps, at FROM messages ORDER BY id DESC LIMIT ?) ORDER BY id", limit)
      .toArray()
      .map((m) => ({ id: m.id, role: m.role, text: m.text, steps: JSON.parse(m.steps) as Step[], at: new Date(m.at).toISOString() }));
  }
}
