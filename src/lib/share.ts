import { showToast } from "./toast";

export async function sharePage(title: string, text: { linkCopied: string; copyFailed: string }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url: location.href });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(location.href);
    showToast(text.linkCopied);
  } catch {
    showToast(text.copyFailed);
  }
}
