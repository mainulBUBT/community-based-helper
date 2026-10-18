import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali, Tiro_Bangla } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/Toaster";
import { APP } from "@/config/app";
import { themeInitScript } from "@/lib/theme";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const body = Noto_Sans_Bengali({ subsets: ["bengali", "latin"], variable: "--font-body", display: "swap" });
const heading = Tiro_Bangla({ weight: "400", subsets: ["bengali", "latin"], variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  title: { default: APP.name, template: `%s · ${APP.name}` },
  description: APP.tagline,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1417" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="bn" className={`${body.variable} ${heading.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
