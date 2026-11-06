"use client";

import { Check, ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Field, SecretField } from "@/components/admin/Field";
import { StepNumber } from "@/components/admin/Guide";
import { Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { showToast } from "@/lib/toast";
import { LLM_PRESETS, aiReady, modelList, modelTarget, providerKey, providerList, providerName, saveLlmModels, testLlm } from "@/services/admin/settings";
import type { LlmModel, LlmProvider, PrivateSettings } from "@/types/admin";

// ব্রাউজার/পাসওয়ার্ড ম্যানেজার এই ফর্মকে লগইন ভেবে model এ ইমেইল আর key তে পাসওয়ার্ড বসিয়ে দেয়
const NO_AUTOFILL = { autoComplete: "off", "data-1p-ignore": true, "data-lpignore": "true", "data-form-type": "other" } as const;

type TestResult = { tone: "ok" | "fail" | "info"; text: string } | null;

const TEST_TONE = {
  ok: "border-ok/30 bg-ok-soft text-ink",
  fail: "border-sale/20 bg-sale-soft text-ink",
  info: "border-line-soft bg-surface-2 text-dim",
};

const iconButton = "flex size-9 items-center justify-center rounded-lg text-dim hover:bg-surface-2 hover:text-ink disabled:opacity-30";

const chip = (active: boolean) => `flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${active ? "border-brand bg-brand-soft" : "border-line hover:border-brand"}`;

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <StepNumber n={n} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h4 className="pt-0.5 font-semibold">{title}</h4>
        {children}
      </div>
    </div>
  );
}

function ModelList({ settings, models, onSaved }: { settings: PrivateSettings; models: LlmModel[]; onSaved: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();

  async function save(next: LlmModel[], toast: string) {
    if (await run(() => saveLlmModels(settings, next, t.admin.jobs.auditSection), toast)) onSaved();
  }

  function move(index: number, by: number) {
    const next = [...models];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    return save(next, t.admin.jobs.orderToast);
  }

  if (!models.length) return <p className="rounded-xl bg-surface-2/60 px-4 py-3 text-sm text-dim">{t.admin.jobs.noModels}</p>;
  return (
    <ol className="flex flex-col divide-y divide-line-soft rounded-xl border border-line-soft">
      {models.map((m, i) => (
        <li key={modelTarget(m)} className="flex items-center gap-3 px-4 py-3">
          <StepNumber n={i + 1} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold break-words">{m.model}</span>
            <span className="text-xs text-dim">{providerName(settings, m.baseUrl)}</span>
          </div>
          <div className="flex shrink-0 items-center">
            <button type="button" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label={t.admin.jobs.moveUp} title={t.admin.jobs.moveUp} className={iconButton}>
              <ChevronUp size={18} aria-hidden="true" />
            </button>
            <button type="button" disabled={busy || i === models.length - 1} onClick={() => move(i, 1)} aria-label={t.admin.jobs.moveDown} title={t.admin.jobs.moveDown} className={iconButton}>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            <button type="button" disabled={busy} onClick={() => save(models.filter((_, j) => j !== i), t.admin.jobs.removedToast)} aria-label={t.admin.jobs.removeModel} title={t.admin.jobs.removeModel} className={`${iconButton} hover:bg-sale-soft hover:text-sale`}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}

function AddModel({ settings, models, onSaved }: { settings: PrivateSettings; models: LlmModel[]; onSaved: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const providers = providerList(settings);
  const [sel, setSel] = useState(LLM_PRESETS[0].baseUrl);
  const [baseUrl, setBaseUrl] = useState(LLM_PRESETS[0].baseUrl);
  const [name, setName] = useState("");
  const [model, setModel] = useState(LLM_PRESETS[0].model);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const isNew = sel === "new";
  const savedKey = (url: string) => settings.llmKeys?.[providerKey(url)] ?? null;
  const lastModel = (url: string) => models.find((m) => providerKey(m.baseUrl) === providerKey(url))?.model ?? "";
  const typedKey = (form: HTMLFormElement | null) => String(new FormData(form ?? undefined).get("apiKey") ?? "").trim() || null;

  function pick(key: string, url: string, presetModel: string) {
    setSel(key);
    setBaseUrl(url);
    setModel(presetModel);
    setTestResult(null);
  }

  async function onTest(form: HTMLFormElement | null) {
    const apiKey = typedKey(form);
    if (!apiKey) return setTestResult({ tone: "fail", text: t.admin.jobs.testNeedsKey });
    setTestResult({ tone: "info", text: t.admin.jobs.testing });
    try {
      setTestResult({ tone: "ok", text: t.admin.jobs.testOk(await testLlm({ baseUrl: baseUrl.trim(), model: model.trim(), apiKey })) });
    } catch (error) {
      setTestResult({ tone: "fail", text: t.admin.jobs.testFailed((error as Error).message) });
    }
  }

  async function removeProvider(provider: LlmProvider) {
    const named = (settings.llmProviders ?? []).filter((p) => providerKey(p.baseUrl) !== providerKey(provider.baseUrl));
    const next = models.filter((m) => providerKey(m.baseUrl) !== providerKey(provider.baseUrl));
    const key = providerKey(provider.baseUrl);
    if (await run(() => saveLlmModels(settings, next, t.admin.jobs.auditSection, undefined, named, key), t.admin.jobs.providerRemoved)) onSaved();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = baseUrl.trim();
    const added = { baseUrl: url, model: model.trim() };
    if (models.some((m) => modelTarget(m) === modelTarget(added))) return showToast(t.admin.jobs.duplicate);
    const apiKey = typedKey(event.currentTarget);
    if (!apiKey) return showToast(t.admin.jobs.testNeedsKey);
    if (isNew) {
      const label = name.trim();
      if (!label || !url) return showToast(t.admin.jobs.providerNeedsName);
      if (LLM_PRESETS.some((p) => providerKey(p.baseUrl) === providerKey(url)) || providers.some((p) => providerKey(p.baseUrl) === providerKey(url))) return showToast(t.admin.jobs.providerDuplicate);
      const named = [...(settings.llmProviders ?? []), { name: label, baseUrl: url }];
      if (await run(() => saveLlmModels(settings, [...models, added], t.admin.jobs.auditSection, { ...added, apiKey }, named), t.admin.jobs.providerAdded)) onSaved();
      return;
    }
    if (await run(() => saveLlmModels(settings, [...models, added], t.admin.jobs.auditSection, { ...added, apiKey }), t.admin.jobs.addedToast)) onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Step n={1} title={t.admin.jobs.stepProvider}>
        <div className="flex flex-wrap gap-2">
          {LLM_PRESETS.map((preset) => (
            <button key={preset.name} type="button" aria-pressed={!isNew && providerKey(baseUrl) === providerKey(preset.baseUrl)} onClick={() => pick(preset.baseUrl, preset.baseUrl, preset.model)} className={chip(!isNew && providerKey(baseUrl) === providerKey(preset.baseUrl))}>
              {preset.name}
              {savedKey(preset.baseUrl) && <Check size={14} className="text-ok" aria-label={t.admin.jobs.keySaved} />}
            </button>
          ))}
          {providers.map((provider) => {
            const active = !isNew && providerKey(baseUrl) === providerKey(provider.baseUrl);
            return (
              <span key={provider.baseUrl} className={`flex h-10 items-center overflow-hidden rounded-xl border ${active ? "border-brand bg-brand-soft" : "border-line"}`}>
                <button type="button" aria-pressed={active} onClick={() => pick(provider.baseUrl, provider.baseUrl, lastModel(provider.baseUrl))} className="flex h-full items-center gap-1.5 pl-3 pr-2 text-sm font-semibold">
                  {provider.name}
                  {savedKey(provider.baseUrl) && <Check size={14} className="text-ok" aria-label={t.admin.jobs.keySaved} />}
                </button>
                <button type="button" disabled={busy} onClick={() => removeProvider(provider)} aria-label={t.admin.jobs.removeProvider} title={t.admin.jobs.removeProvider} className="flex h-full w-7 items-center justify-center text-dim hover:bg-sale-soft hover:text-sale">
                  <X size={13} aria-hidden="true" />
                </button>
              </span>
            );
          })}
          <button type="button" aria-pressed={isNew} onClick={() => pick("new", "", "")} className={chip(isNew)}>
            + {t.admin.jobs.newProvider}
          </button>
        </div>
        <span className="text-xs text-dim">{t.admin.jobs.presetHint}</span>
        <div className="grid gap-4 md:grid-cols-2">
          {isNew && (
            <Field label={t.admin.jobs.providerNameLabel} name="providerName" {...NO_AUTOFILL} value={name} onChange={(e) => setName(e.target.value)} required hint={t.admin.jobs.providerNameHint} />
          )}
          <Field label={t.admin.jobs.baseUrl} name="baseUrl" type="url" {...NO_AUTOFILL} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required hint={t.admin.jobs.baseUrlHint} />
          <Field label={t.admin.jobs.model} name="model" {...NO_AUTOFILL} value={model} onChange={(e) => setModel(e.target.value)} required hint={isNew ? t.admin.jobs.newModelHint : t.admin.jobs.modelHint} />
        </div>
      </Step>
      <Step n={2} title={t.admin.jobs.stepKey}>
        {/* সার্ভিস বদলালে ঘর খালি হয়, আর দেখায় ওই সার্ভিসের নিজের সেভ করা key */}
        <SecretField
          key={providerKey(baseUrl) || "new"}
          label={t.admin.jobs.apiKey}
          name="apiKey"
          defaultValue={savedKey(baseUrl) ?? ""}
          {...NO_AUTOFILL}
          autoComplete="new-password"
          show={t.admin.jobs.showKey}
          hide={t.admin.jobs.hideKey}
          hint={savedKey(baseUrl) ? t.admin.jobs.keySavedHere : t.admin.jobs.noKeyForProvider}
        />
      </Step>
      <Step n={3} title={t.admin.jobs.stepTest}>
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={(e) => onTest(e.currentTarget.form)} disabled={testResult?.tone === "info"} className={`${secondaryButton} w-full sm:w-fit`}>
            {t.admin.jobs.testConnection}
          </button>
          <span className="text-xs text-dim">{t.admin.jobs.testHint}</span>
        </div>
        {testResult && (
          <p role="status" className={`rounded-xl border px-4 py-3 text-sm break-words ${TEST_TONE[testResult.tone]}`}>
            {testResult.text}
          </p>
        )}
      </Step>
      <Step n={4} title={isNew ? t.admin.jobs.addProviderTitle : t.admin.jobs.addModel}>
        <div className="flex flex-col gap-1.5">
          <button type="submit" disabled={busy} className={`${primaryButton} w-full sm:w-fit`}>
            {isNew ? t.admin.jobs.addProviderTitle : t.admin.jobs.addModel}
          </button>
          <span className="text-xs text-dim">{isNew ? t.admin.jobs.addProviderHint : t.admin.jobs.addHint}</span>
        </div>
      </Step>
    </form>
  );
}

export function AiSetup({ settings, onSaved }: { settings: PrivateSettings; onSaved: () => void }) {
  const { t } = useAdminI18n();
  const models = modelList(settings);
  const ready = aiReady(settings);
  return (
    <Panel
      title={t.admin.jobs.aiTitle}
      action={
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ready ? "bg-ok-soft text-ok" : "bg-gold-soft text-gold-text"}`}>
          {ready ? t.admin.jobs.aiReady : t.admin.jobs.aiMissing}
        </span>
      }
    >
      <div className="grid gap-4 border-b border-line-soft bg-surface-2/50 p-5 text-sm md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold">{t.admin.jobs.aiUses}</span>
          <ul className="list-disc space-y-1 pl-5 text-dim">
            {t.admin.jobs.aiUseList.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </div>
        <p className="text-dim">{t.admin.jobs.aiWithout}</p>
      </div>
      <section className="flex flex-col gap-3 border-b border-line-soft p-5">
        <h3 className="font-bold">{t.admin.jobs.modelsTitle}</h3>
        <p className="text-sm text-dim">{t.admin.jobs.modelsHint}</p>
        <ModelList settings={settings} models={models} onSaved={onSaved} />
      </section>
      <section className="flex flex-col gap-4 p-5">
        <h3 className="font-bold">{t.admin.jobs.addTitle}</h3>
        <AddModel settings={settings} models={models} onSaved={onSaved} />
      </section>
    </Panel>
  );
}
