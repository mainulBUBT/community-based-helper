const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export const toBnDigits = (value: string | number) => String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export const formatTaka = (amount: number) => `৳${amount.toLocaleString("en-IN")}`;

export function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "এইমাত্র";
  if (minutes < 60) return `${toBnDigits(minutes)} মিনিট আগে`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${toBnDigits(hours)} ঘণ্টা আগে`;
  const days = Math.round(hours / 24);
  if (days === 1) return "গতকাল";
  return `${toBnDigits(days)} দিন আগে`;
}

export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "880")}`;

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
