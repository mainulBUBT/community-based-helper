const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export const toBnDigits = (value: string | number) => String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export const parseTaka = (text: string) => Number(text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(/\D/g, ""));

export const formatTaka = (amount: number, lang: "bn" | "en" = "en") =>
  `৳${amount.toLocaleString(lang === "bn" ? "bn-BD" : "en-IN")}`;

export const dayRange = (min: number | null, max: number | null) => {
  const days = [...new Set([min, max].filter((day): day is number => day != null))];
  return days.length ? days.join("–") : null;
};

export const splitList = (value: string | null) => (value ?? "").split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean);

export const telLink = (phone: string) => `tel:${(splitList(phone)[0] ?? "").replace(/[^\d+]/g, "")}`;

export const whatsappLink = (phone: string) => `https://wa.me/${(splitList(phone)[0] ?? "").replace(/\D/g, "").replace(/^0/, "880")}`;

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
