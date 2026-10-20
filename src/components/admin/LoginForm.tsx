"use client";

import { useState, type FormEvent } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { isDemo, sendPasswordReset, signIn, updatePassword } from "@/services/admin/auth";
import { Field } from "./Field";

type Mode = "login" | "forgot" | "reset";

const MESSAGES: Record<string, string> = {
  "not-admin": "এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই",
  invalid: "ইমেইল বা পাসওয়ার্ড মেলেনি",
};

export function LoginForm({ onDone, recovering = false }: { onDone: () => void; recovering?: boolean }) {
  const [mode, setMode] = useState<Mode>(recovering ? "reset" : "login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

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
        await signIn(email, password);
        onDone();
      } else if (mode === "forgot") {
        await sendPasswordReset(email);
        setNotice("ইমেইলে পাসওয়ার্ড বদলানোর লিংক পাঠানো হয়েছে।");
      } else {
        if (password.length < 8) throw new Error("short");
        await updatePassword(password);
        onDone();
      }
    } catch (e) {
      const code = (e as Error).message;
      setError(code === "short" ? "পাসওয়ার্ড অন্তত ৮ অক্ষরের দিন" : (MESSAGES[code] ?? (mode === "login" ? MESSAGES.invalid : "কাজটা হলো না, আবার চেষ্টা করুন")));
    } finally {
      setBusy(false);
    }
  }

  const title = { login: "অ্যাডমিন লগইন", forgot: "পাসওয়ার্ড ভুলে গেছেন", reset: "নতুন পাসওয়ার্ড দিন" }[mode];
  const submit = { login: "ঢুকুন", forgot: "লিংক পাঠান", reset: "পাসওয়ার্ড সেভ করুন" }[mode];

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-line-soft bg-surface p-6">
        <div className="flex items-center gap-3">
          <BrandMark />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {mode !== "reset" && <Field label="ইমেইল" name="email" type="email" autoComplete="username" required />}
        {mode !== "forgot" && (
          <Field
            label={mode === "reset" ? "নতুন পাসওয়ার্ড" : "পাসওয়ার্ড"}
            name="password"
            type="password"
            autoComplete={mode === "reset" ? "new-password" : "current-password"}
            required
          />
        )}
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
        <button type="submit" disabled={busy} className="h-12 rounded-xl bg-brand font-bold text-brand-ink disabled:opacity-60">
          {busy ? "একটু অপেক্ষা…" : submit}
        </button>
        {mode === "login" && !isDemo && (
          <button type="button" onClick={() => setMode("forgot")} className="self-start text-sm font-semibold text-brand">
            পাসওয়ার্ড ভুলে গেছেন?
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" onClick={() => setMode("login")} className="self-start text-sm font-semibold text-brand">
            লগইনে ফিরুন
          </button>
        )}
        {isDemo && <p className="text-[13px] text-dim">ডেটাবেস যুক্ত না থাকায় ডেমো মোড চলছে। লগইনের তথ্য .env.example ফাইলে আছে।</p>}
      </form>
    </main>
  );
}
