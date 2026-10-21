"use client";

import { useState, type FormEvent } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Spinner } from "@/components/ui/Spinner";
import { useAdminI18n } from "@/hooks/useI18n";
import { isDemo, sendPasswordReset, signIn, updatePassword } from "@/services/admin/auth";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { Field } from "./Field";
import { Turnstile } from "./Turnstile";

type Mode = "login" | "forgot" | "reset";

export function LoginForm({ onDone, recovering = false }: { onDone: () => void; recovering?: boolean }) {
  const { t } = useAdminI18n();
  const [mode, setMode] = useState<Mode>(recovering ? "reset" : "login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const needsCaptcha = Boolean(TURNSTILE_SITE_KEY) && mode !== "reset";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        await signIn(email, password, captcha ?? undefined);
        onDone();
      } else if (mode === "forgot") {
        await sendPasswordReset(email, captcha ?? undefined);
        setNotice(t.admin.login.resetSent);
      } else {
        if (password.length < 8) throw new Error("short");
        await updatePassword(password);
        onDone();
      }
    } catch (e) {
      const code = (e as Error).message;
      const MESSAGES: Record<string, string> = {
        "not-admin": t.admin.login.notAdmin,
        invalid: t.admin.login.invalid,
        short: t.admin.login.shortPassword,
      };
      const fallback = /captcha/i.test(code) ? t.admin.login.captchaFailed : mode === "login" ? t.admin.login.invalid : t.admin.login.failed;
      setError(MESSAGES[code] ?? fallback);
    } finally {
      setBusy(false);
      if (needsCaptcha) setAttempt((n) => n + 1);
    }
  }

  const title = { login: t.admin.login.title, forgot: t.admin.login.forgotTitle, reset: t.admin.login.resetTitle }[mode];
  const submit = { login: t.admin.login.enter, forgot: t.admin.login.sendLink, reset: t.admin.login.savePassword }[mode];

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-line-soft bg-surface p-6">
        <div className="flex items-center gap-3">
          <BrandMark />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {mode !== "reset" && <Field label={t.admin.login.email} name="email" type="email" autoComplete="username" required />}
        {mode !== "forgot" && (
          <Field
            label={mode === "reset" ? t.admin.login.newPassword : t.admin.login.password}
            name="password"
            type="password"
            autoComplete={mode === "reset" ? "new-password" : "current-password"}
            required
          />
        )}
        {needsCaptcha && <Turnstile action={`admin-${mode}`} resetKey={attempt} onToken={setCaptcha} />}
        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm font-semibold text-ok">
            {notice}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || (needsCaptcha && !captcha)}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand font-bold text-brand-ink disabled:opacity-60"
        >
          {busy && <Spinner size={18} />}
          {busy ? t.admin.login.busy : needsCaptcha && !captcha ? t.admin.login.checkingHuman : submit}
        </button>
        {mode === "login" && !isDemo && (
          <button type="button" onClick={() => setMode("forgot")} className="self-start text-sm font-semibold text-brand">
            {t.admin.login.forgotLink}
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" onClick={() => setMode("login")} className="self-start text-sm font-semibold text-brand">
            {t.admin.login.backToLogin}
          </button>
        )}
        {isDemo && <p className="text-[13px] text-dim">{t.admin.login.demoNote}</p>}
      </form>
    </main>
  );
}
