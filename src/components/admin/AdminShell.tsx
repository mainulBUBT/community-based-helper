"use client";

import {
  Activity,
  Bot,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  ScrollText,
  Settings,
  Store,
  Tag,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { currentAdmin, onPasswordRecovery, signOut } from "@/services/admin/auth";
import { LoginForm } from "./LoginForm";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/admin/review/", label: "যাচাই বাকি", icon: ClipboardCheck },
  { href: "/admin/sellers/", label: "বিক্রেতা", icon: Store },
  { href: "/admin/products/", label: "পণ্য ও দাম", icon: Package },
  { href: "/admin/offers/", label: "অফার", icon: Tag },
  { href: "/admin/jobs/", label: "কাজ ও AI", icon: Bot },
  { href: "/admin/visitors/", label: "ভিজিটর", icon: Activity },
  { href: "/admin/logs/", label: "লগ", icon: ScrollText },
  { href: "/admin/settings/", label: "সেটিংস", icon: Settings },
];

const trimSlash = (path: string) => path.replace(/\/+$/, "");

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = trimSlash(usePathname());
  const { data: admin, loading, reload } = useAsync(currentAdmin, []);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => onPasswordRecovery(() => setRecovering(true)), []);

  if (loading) {
    return (
      <div className="mx-auto max-w-md p-8">
        <ListSkeleton rows={3} />
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
      <aside className="flex shrink-0 flex-col gap-1 bg-[#101828] p-3 text-white lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:p-4">
        <div className="flex items-center gap-2 px-2 pb-2 lg:pb-5">
          <BrandMark size={30} />
          <span className="text-lg font-bold">অ্যাডমিন</span>
          <span className="flex-1" />
          <button
            type="button"
            aria-label="বের হন"
            onClick={async () => {
              await signOut();
              reload();
            }}
            className="flex size-10 items-center justify-center rounded-xl text-[#d0d5dd] hover:bg-white/10 lg:hidden"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="অ্যাডমিন মেনু" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = trimSlash(href) === "/admin" ? pathname === "/admin" : pathname.startsWith(trimSlash(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-[15px] ${active ? "bg-white/12 font-semibold text-white" : "text-[#d0d5dd] hover:bg-white/6"}`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <span className="hidden flex-1 lg:block" />
        <div className="hidden flex-col gap-2 border-t border-white/10 px-2 pt-3 text-sm text-[#d0d5dd] lg:flex">
          <span className="truncate">{admin.email}</span>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              reload();
            }}
            className="flex items-center gap-2 self-start font-semibold text-white hover:underline"
          >
            <LogOut size={16} aria-hidden="true" />
            বের হন
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
