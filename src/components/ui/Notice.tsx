import type { ReactNode } from "react";

interface NoticeProps {
  children: ReactNode;
  tone?: "muted" | "error";
}

export function Notice({ children, tone = "muted" }: NoticeProps) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={`px-4 py-8 text-center text-[15px] ${tone === "error" ? "text-danger-soft" : "text-dim"}`}
    >
      {children}
    </p>
  );
}

interface AsyncContentProps {
  loading: boolean;
  error: string | null;
  children?: ReactNode;
}

export function AsyncContent({ loading, error, children }: AsyncContentProps) {
  if (loading) return <Notice>লোড হচ্ছে…</Notice>;
  if (error) return <Notice tone="error">{error}</Notice>;
  return children;
}
