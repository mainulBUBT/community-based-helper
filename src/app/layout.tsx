import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { ServiceWorker } from "@/components/layout/ServiceWorker";
import { Toaster } from "@/components/ui/Toaster";
import { SITE_URL } from "@/config/site";
import { preferencesInitScript } from "@/lib/preferences";
import { getSiteSettings } from "@/services/catalog.server";
import "./globals.css";

const latin = Inter({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: settings.seoTitle, template: `%s | ${settings.name}` },
    description: settings.seoDescription,
    applicationName: settings.name,
    appleWebApp: { capable: true, title: settings.name, statusBarStyle: "default" },
    openGraph: { type: "website", siteName: settings.name, locale: "bn_BD", title: settings.seoTitle, description: settings.seoDescription },
    icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  };
}

export const viewport: Viewport = {
  themeColor: "#f6f7f9",
  colorScheme: "light",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { cloudflareAnalyticsToken } = await getSiteSettings();
  return (
    <html lang="bn" className={`${latin.variable} ${bengali.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: preferencesInitScript }} />
        {children}
        <Toaster />
        <ServiceWorker />
        {cloudflareAnalyticsToken && (
          <Script id="cloudflare-analytics" strategy="afterInteractive" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: cloudflareAnalyticsToken })} />
        )}
      </body>
    </html>
  );
}
