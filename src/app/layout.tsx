import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { ServiceWorker } from "@/components/layout/ServiceWorker";
import { Toaster } from "@/components/ui/Toaster";
import { SITE_URL } from "@/config/site";
import { preferencesInitScript } from "@/lib/preferences";
import { getSiteSettings } from "@/services/catalog";
import "./globals.css";

const body = Hind_Siliguri({ weight: ["400", "500", "600", "700"], subsets: ["bengali", "latin"], variable: "--font-body", display: "swap" });

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
  themeColor: "#f5f5f2",
  colorScheme: "light",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { cloudflareAnalyticsToken } = await getSiteSettings();
  return (
    <html lang="bn" className={body.variable} suppressHydrationWarning>
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
