import { showToast } from "./toast";

export const SHARE_TARGETS = [
  { name: "Facebook", color: "#1877F2", href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: "WhatsApp", color: "#25D366", href: (url: string, title: string) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  { name: "Telegram", color: "#26A5E4", href: (url: string, title: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  { name: "X", color: "#0F1419", href: (url: string, title: string) => `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
];

// ফোনে নিজের শেয়ার শিট; false মানে শিট খোলা যায়নি, তখন নিজেদের মেনু
export async function nativeShare(title: string): Promise<boolean> {
  if (typeof navigator.share !== "function") return false;
  try {
    await navigator.share({ title, url: location.href });
    return true;
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError";
  }
}

export async function copyLink(text: { linkCopied: string; copyFailed: string }) {
  try {
    await navigator.clipboard.writeText(location.href);
    showToast(text.linkCopied);
  } catch {
    showToast(text.copyFailed);
  }
}
