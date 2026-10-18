import { showToast } from "./toast";

export async function copyText(text: string, doneMessage = "কপি হয়েছে") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(doneMessage);
  } catch {
    showToast("কপি করা যায়নি — হাতে সিলেক্ট করে কপি করুন");
  }
}

export async function shareText(title: string, text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: location.href });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  await copyText(`${text}\n${location.href}`, "শেয়ার করার তথ্য কপি হয়েছে");
}
