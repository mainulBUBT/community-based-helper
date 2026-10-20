import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

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

export function TextArea({ label, hint, ...input }: Labelled & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrap label={label} hint={hint}>
      <textarea {...input} className={`${control} min-h-24 py-2.5`} />
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
