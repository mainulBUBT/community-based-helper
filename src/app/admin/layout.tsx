import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RootDocument } from "@/components/layout/RootDocument";
import { siteMetadata } from "@/lib/site-metadata";

export { viewport } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return { ...(await siteMetadata("en")), title: "Admin", robots: { index: false, follow: false } };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument lang="en">
      <AdminShell>{children}</AdminShell>
    </RootDocument>
  );
}
