"use client";

import { Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";
import { showToast } from "@/lib/toast";
import { submitPrice } from "@/services/catalog";

const field = "h-12 w-full rounded-md border border-line bg-surface px-3 text-base outline-none focus:border-brand";

const FIELDS = [
  { name: "product", hint: "productHint", required: true },
  { name: "price", hint: "priceHint", required: true, inputMode: "numeric" as const },
  { name: "seller", hint: "sellerHint", required: true },
  { name: "phone", hint: "phoneHint", required: false, inputMode: "tel" as const },
  { name: "link", hint: "linkHint", required: false },
] as const;

export function SubmitPriceDialog({ product, trigger }: { product?: string; trigger: (open: () => void) => ReactNode }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setSending(true);
    try {
      await submitPrice({ ...payload, from: "ক্রেতা" });
      form.reset();
      setOpen(false);
      showToast(t.report.thanks);
    } catch {
      showToast(t.report.failed);
    } finally {
      setSending(false);
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
          {FIELDS.map((f) => (
            <label key={f.name} className="flex flex-col gap-1.5 text-sm font-semibold">
              {t.report[f.name]}
              <input
                name={f.name}
                required={f.required}
                placeholder={t.report[f.hint]}
                inputMode={"inputMode" in f ? f.inputMode : undefined}
                defaultValue={f.name === "product" ? product : undefined}
                className={field}
              />
            </label>
          ))}
          <button type="submit" disabled={sending} className="flex h-12 items-center justify-center gap-2 rounded-md bg-brand font-bold text-brand-ink disabled:opacity-60">
            <Send size={18} aria-hidden="true" />
            {sending ? t.report.sending : t.report.send}
          </button>
        </form>
      </dialog>
    </>
  );
}
