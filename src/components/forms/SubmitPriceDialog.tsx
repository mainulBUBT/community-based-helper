"use client";

import { Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Turnstile } from "@/components/ui/Turnstile";
import { useI18n } from "@/hooks/useI18n";
import { showToast } from "@/lib/toast";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { submitPrice } from "@/services/catalog";

const field = "h-12 w-full rounded-md border border-line bg-surface px-3 text-base outline-none focus:border-brand";

const FIELDS = [
  { name: "product", hint: "productHint", required: true, maxLength: 120 },
  { name: "price", hint: "priceHint", required: true, maxLength: 12, inputMode: "numeric", pattern: "[0-9০-৯,]{3,12}" },
  { name: "seller", hint: "sellerHint", required: true, maxLength: 120 },
  { name: "phone", hint: "phoneHint", required: false, maxLength: 20, type: "tel", inputMode: "tel", pattern: "[+0-9০-৯ \\-]{6,20}" },
  { name: "link", hint: "linkHint", required: false, maxLength: 500, type: "url", pattern: "https?://.+" },
] as const;

export interface FixedProduct {
  name: string;
  productId: string;
  variantId?: string;
}

interface SubmitPriceDialogProps {
  product?: string;
  fixed?: FixedProduct;
  trigger: (open: () => void) => ReactNode;
}

export function SubmitPriceDialog({ product, fixed, trigger }: SubmitPriceDialogProps) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const needsCaptcha = Boolean(TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setSending(true);
    const error = await submitPrice({ ...payload, from: "ক্রেতা" }, captcha).catch(() => "failed" as const);
    setSending(false);
    setAttempt((n) => n + 1);
    if (!error) {
      form.reset();
      setOpen(false);
      showToast(t.report.thanks);
    } else {
      showToast(error === "limit" ? t.report.tooMany : error === "captcha" ? t.report.captchaFailed : t.report.failed);
    }
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      <dialog
        ref={dialog}
        aria-labelledby="submit-price-title"
        onClose={() => setOpen(false)}
        className="m-auto w-[min(100%-2rem,28rem)] rounded-lg bg-page p-0 text-ink shadow-2xl"
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 id="submit-price-title" className="text-lg font-bold">
              {t.report.title}
            </h2>
            <button type="button" aria-label={t.common.close} onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-md hover:bg-surface-2">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {fixed && (
            <div className="flex flex-col gap-1.5 text-sm font-semibold">
              {t.report.product}
              <p className="flex min-h-12 items-center rounded-md border border-line bg-surface-2 px-3 text-base font-medium text-ink">{fixed.name}</p>
              <input type="hidden" name="product" value={fixed.name} />
              <input type="hidden" name="productId" value={fixed.productId} />
              {fixed.variantId && <input type="hidden" name="variantId" value={fixed.variantId} />}
            </div>
          )}
          {FIELDS.filter((f) => !(fixed && f.name === "product")).map((f) => (
            <label key={f.name} className="flex flex-col gap-1.5 text-sm font-semibold">
              {t.report[f.name]}
              <span className="relative">
                {f.name === "price" && (
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-lg font-semibold text-dim">
                    ৳
                  </span>
                )}
                <input
                  name={f.name}
                  required={f.required}
                  placeholder={t.report[f.hint]}
                  type={"type" in f ? f.type : "text"}
                  maxLength={f.maxLength}
                  pattern={"pattern" in f ? f.pattern : undefined}
                  inputMode={"inputMode" in f ? f.inputMode : undefined}
                  defaultValue={f.name === "product" ? product : undefined}
                  className={`${field} ${f.name === "price" ? "pl-8" : ""}`}
                />
              </span>
            </label>
          ))}
          {needsCaptcha && open && (
            <Turnstile action="submit-price" resetKey={attempt} onToken={setCaptcha} labels={{ unavailable: t.report.captchaUnavailable, retry: t.common.retry }} />
          )}
          <button
            type="submit"
            disabled={sending || (needsCaptcha && !captcha)}
            className="flex h-12 items-center justify-center gap-2 rounded-md bg-brand font-bold text-brand-ink disabled:opacity-60"
          >
            <Send size={18} aria-hidden="true" />
            {sending ? t.report.sending : needsCaptcha && !captcha ? t.report.checking : t.report.send}
          </button>
        </form>
      </dialog>
    </>
  );
}
