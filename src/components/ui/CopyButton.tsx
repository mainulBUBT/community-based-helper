"use client";

import { Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";

interface CopyButtonProps {
  text: string;
  label: string;
  doneMessage?: string;
}

export function CopyButton({ text, label, doneMessage }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={() => copyText(text, doneMessage)}
      aria-label={label}
      title={label}
      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-dim hover:bg-surface-2 hover:text-ink"
    >
      <Copy size={17} aria-hidden="true" />
    </button>
  );
}
