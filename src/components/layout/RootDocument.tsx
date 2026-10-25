import { Inter, Noto_Sans_Bengali } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { ServiceWorker } from "@/components/layout/ServiceWorker";
import { Toaster } from "@/components/ui/Toaster";
import { preferencesInitScript, type Lang } from "@/lib/preferences";
import { getSiteSettings } from "@/services/catalog.server";
import "@/app/globals.css";

const latin = Inter({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", display: "swap" });

// bn, en আর admin তিনটা আলাদা root layout, যাতে স্ট্যাটিক HTML এই সঠিক lang থাকে
export async function RootDocument({ lang, children }: { lang: Lang; children: ReactNode }) {
  const { cloudflareAnalyticsToken } = await getSiteSettings();
  return (
    <html lang={lang} className={`${latin.variable} ${bengali.variable}`} suppressHydrationWarning>
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
