import type { Messages } from "@/i18n/bn";
import { formatTaka } from "@/utils/format";

export interface ShareItem {
  name: string;
  lowest: number | null;
}

// তুলনার পাতার শিরোনাম আর বিবরণ: ব্রাউজারে CompareView বসায়, শেয়ারের preview-র জন্য Pages Function
export function compareShare(t: Messages, lang: "bn" | "en", items: ShareItem[]) {
  const prices = items.flatMap((item) => (item.lowest === null ? [] : [t.compare.sharePrice(item.name, formatTaka(item.lowest, lang))]));
  return {
    title: t.compare.shareTitle(items.map((item) => item.name)),
    description: prices.length ? t.compare.shareDescription(prices.join(", ")) : null,
  };
}
