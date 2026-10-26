"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const control = "w-full rounded-xl border border-line bg-surface px-3 text-[15px] outline-none focus:border-brand";

interface Labelled {
  label: string;
  hint?: ReactNode;
}

function Wrap({ label, hint, children }: Labelled & { children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-dim">{hint}</span>}
    </label>
  );
}

export function Field({ label, hint, ...input }: Labelled & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrap label={label} hint={hint}>
      <input {...input} className={`${control} h-11`} />
    </Wrap>
  );
}

// key/token: ডিফল্টে ঢাকা, চোখের বোতামে দেখা যায়
export function SecretField({ label, hint, show, hide, ...input }: Labelled & { show: string; hide: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <Wrap label={label} hint={hint}>
      <span className="relative flex">
        <input {...input} type={shown ? "text" : "password"} className={`${control} h-11 pr-11`} />
        <button
          type="button"
          aria-label={shown ? hide : show}
          aria-pressed={shown}
          onClick={() => setShown(!shown)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-dim hover:text-ink"
        >
          {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
    </Wrap>
  );
}

export function TextArea({ label, hint, className = "", ...input }: Labelled & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrap label={label} hint={hint}>
      <textarea {...input} className={`${control} min-h-24 py-2.5 ${className}`} />
    </Wrap>
  );
}

export function Select({ label, hint, children, ...input }: Labelled & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrap label={label} hint={hint}>
      <select {...input} className={`${control} h-11`}>
        {children}
      </select>
    </Wrap>
  );
}
