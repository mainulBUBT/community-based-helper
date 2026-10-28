"use client";

import {
  Activity,
  Bot,
  Boxes,
  Gauge,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Settings,
  Store,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Spinner } from "@/components/ui/Spinner";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import type { AdminMessages } from "@/i18n/admin-bn";
import { currentAdmin, onPasswordRecovery, signOut } from "@/services/admin/auth";
import { countPendingReview, REVIEW_CHANGED } from "@/services/admin/review";
import { ConfirmDialog } from "./ConfirmDialog";
import { LanguageButton } from "./LanguageButton";
import { LoginForm } from "./LoginForm";

type NavKey = keyof AdminMessages["nav"];

const NAV: { href: string; key: NavKey; icon: LucideIcon }[] = [
  { href: "/admin/", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/review/", key: "review", icon: ClipboardCheck },
  { href: "/admin/sellers/", key: "sellers", icon: Store },
  { href: "/admin/categories/", key: "categories", icon: Boxes },
  { href: "/admin/products/", key: "products", icon: Package },
  { href: "/admin/offers/", key: "offers", icon: Tag },
  { href: "/admin/jobs/", key: "jobs", icon: Bot },
  { href: "/admin/visitors/", key: "visitors", icon: Activity },
  { href: "/admin/limits/", key: "limits", icon: Gauge },
  { href: "/admin/logs/", key: "logs", icon: ScrollText },
  { href: "/admin/settings/", key: "settings", icon: Settings },
];

const trimSlash = (path: string) => path.replace(/\/+$/, "");

const iconButton = "flex size-10 items-center justify-center rounded-xl text-[#d0d5dd] hover:bg-white/10";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t, num } = useAdminI18n();
  const pathname = trimSlash(usePathname());
  // শুধু সংখ্যা (head count), পেজ বদলালে আর সিদ্ধান্ত দিলে আবার গোনা
  const [changes, setChanges] = useState(0);
  useEffect(() => {
    const bump = () => setChanges((n) => n + 1);
    window.addEventListener(REVIEW_CHANGED, bump);
    return () => window.removeEventListener(REVIEW_CHANGED, bump);
  }, []);
  const { data: pending } = useAsync(() => countPendingReview().catch(() => 0), [pathname, changes]);
  return (
    <nav aria-label={t.admin.menuLabel} className="flex flex-col gap-1">
      {NAV.map(({ href, key, icon: Icon }) => {
        const active = trimSlash(href) === "/admin" ? pathname === "/admin" : pathname.startsWith(trimSlash(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-[15px] ${active ? "bg-white/12 font-semibold text-white" : "text-[#d0d5dd] hover:bg-white/6"}`}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="flex-1">{t.admin.nav[key]}</span>
            {key === "review" && Boolean(pending) && <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-gold-ink">{num(pending ?? 0)}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton({ onSignedOut, className, iconOnly = false }: { onSignedOut: () => void; className: string; iconOnly?: boolean }) {
  const { t } = useAdminI18n();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" aria-label={iconOnly ? t.admin.logout : undefined} onClick={() => setAsking(true)} className={className}>
        <LogOut size={iconOnly ? 18 : 16} aria-hidden="true" />
        {!iconOnly && t.admin.logout}
      </button>
      <ConfirmDialog
        open={asking}
        title={t.admin.logoutConfirm}
        body={t.admin.logoutConfirmBody}
        confirmLabel={t.admin.logout}
        cancelLabel={t.admin.common.cancel}
        busy={busy}
        onCancel={() => setAsking(false)}
        onConfirm={async () => {
          setBusy(true);
          await signOut();
          setBusy(false);
          setAsking(false);
          onSignedOut();
        }}
      />
    </>
  );
}

function UserBlock({ email, onSignedOut }: { email: string; onSignedOut: () => void }) {
  return (
    <div className="flex flex-col gap-2 border-t border-white/10 px-2 pt-3 text-sm text-[#d0d5dd]">
      <LanguageButton />
      <span className="truncate">{email}</span>
      <LogoutButton onSignedOut={onSignedOut} className="flex items-center gap-2 self-start font-semibold text-white hover:underline" />
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useAdminI18n();
  const { data: admin, loading, reload } = useAsync(currentAdmin, []);
  const [recovering, setRecovering] = useState(false);
  const [open, setOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => onPasswordRecovery(() => setRecovering(true)), []);

  useEffect(() => {
    if (!open) return;
    const hamburger = hamburgerRef.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      hamburger?.focus();
    };
  }, [open]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-brand">
        <Spinner size={32} label={t.admin.loading} />
      </div>
    );
  }
  if (!admin || recovering) {
    return (
      <LoginForm
        recovering={recovering}
        onDone={() => {
          setRecovering(false);
          reload();
        }}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <header className="flex shrink-0 items-center gap-2 bg-[#101828] p-3 text-white lg:hidden">
        <button ref={hamburgerRef} type="button" aria-label={t.admin.openMenu} aria-expanded={open} onClick={() => setOpen(true)} className={iconButton}>
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <BrandMark size={28} />
          <span className="text-lg font-bold">{t.admin.title}</span>
        </div>
        <span className="flex-1" />
        <LogoutButton onSignedOut={reload} className={iconButton} iconOnly />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.admin.menuLabel}>
          <button type="button" aria-label={t.admin.closeMenu} onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col gap-3 overflow-y-auto bg-[#101828] p-4 text-white">
            <div className="flex items-center gap-2 px-2">
              <BrandMark size={30} />
              <span className="text-lg font-bold">{t.admin.title}</span>
              <span className="flex-1" />
              <button ref={closeRef} type="button" aria-label={t.admin.closeMenu} onClick={() => setOpen(false)} className={iconButton}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <span className="flex-1" />
            <UserBlock email={admin.email} onSignedOut={reload} />
          </div>
        </div>
      )}

      <aside className="hidden shrink-0 flex-col gap-1 bg-[#101828] p-3 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:p-4">
        <div className="flex items-center gap-2 px-2 pb-5">
          <BrandMark size={30} />
          <span className="text-lg font-bold">{t.admin.title}</span>
        </div>
        <NavList />
        <span className="flex-1" />
        <UserBlock email={admin.email} onSignedOut={reload} />
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
