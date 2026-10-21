"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { primaryButton, secondaryButton } from "./Panel";

interface Props {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, busy, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => event.target === event.currentTarget && onCancel()}
      className="m-auto w-[min(92vw,24rem)] rounded-2xl bg-surface p-0 text-ink shadow-xl backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-2 p-5">
        <h2 className="text-lg font-bold">{title}</h2>
        {body && <p className="text-sm text-dim">{body}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-line-soft px-5 py-3">
        <button type="button" onClick={onCancel} className={secondaryButton} autoFocus>
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={primaryButton}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
