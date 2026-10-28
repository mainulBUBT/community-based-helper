import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/services/catalog.server";

export const dynamic = "force-static";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings();
  return {
    id: "/",
    name: settings.name,
    short_name: settings.name,
    description: settings.tagline,
    lang: "bn",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f766e",
    theme_color: "#0f766e",
    categories: ["shopping", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "খুঁজুন", url: "/search/" },
      { name: "সেভ করা", url: "/saved/" },
    ],
  };
}
